"use strict";
/**
 * ╔══════════════════════════════════════════╗
 * ║   AYMAN-FCA — Guardian System v1.0      ║
 * ║   نظام الحارس — مضاد تسجيل الخروج      ║
 * ║              by ayman                   ║
 * ╚══════════════════════════════════════════╝
 * 
 * مهامه:
 * ① تجديد fb_dtsg كل 6 ساعات تلقائياً
 * ② حفظ AppState كل 30 دقيقة
 * ③ ping كل 25 ثانية لإبقاء الجلسة حية
 * ④ تجديد الكوكيز من messenger.com و facebook.com
 * ⑤ كشف الخروج وإعادة الاتصال فوراً
 */

const fs     = require("fs-extra");
const path   = require("path");
const logger = require("./logger");
const { humanDelay } = require("./stealth");

const DTSG_REFRESH_INTERVAL  = 6  * 60 * 60 * 1000; // 6 ساعات
const APPSTATE_SAVE_INTERVAL = 30 * 60 * 1000;       // 30 دقيقة
const SESSION_PING_INTERVAL  = 25 * 1000;             // 25 ثانية
const COOKIE_REFRESH_INTERVAL= 2  * 60 * 60 * 1000;  // ساعتين

class Guardian {
  constructor(ctx, api, defaultFuncs, appStatePath) {
    this.ctx          = ctx;
    this.api          = api;
    this.defaultFuncs = defaultFuncs;
    this.appStatePath = appStatePath || path.join(process.cwd(), "appstate.json");
    this.timers       = [];
    this.active       = false;
    this.dtsgFailCount= 0;
  }

  // ── تشغيل الحارس ──────────────────────────────────────
  start() {
    if (this.active) return;
    this.active = true;
    logger("🛡️ Guardian نظام الحارس شغّال — مضاد تسجيل الخروج مفعّل", "success");

    this._startDtsgRefresh();
    this._startAppStateSave();
    this._startSessionPing();
    this._startCookieRefresh();
  }

  // ── إيقاف الحارس ──────────────────────────────────────
  stop() {
    this.active = false;
    this.timers.forEach(t => clearInterval(t));
    this.timers = [];
    logger("🛡️ Guardian أوقف", "warn");
  }

  // ① تجديد fb_dtsg كل 6 ساعات ──────────────────────────
  _startDtsgRefresh() {
    const refresh = async () => {
      if (!this.active) return;
      try {
        const { get } = require("../src/utils/request");
        const { saveCookies } = require("../src/utils/client");
        const { getFrom } = require("../src/utils/constants");

        await humanDelay(1000, 3000);
        const res = await get("https://www.facebook.com/", this.ctx.jar, null, this.ctx.globalOptions, this.ctx)
          .then(saveCookies(this.ctx.jar));

        const html     = res && res.data ? res.data : "";
        const fb_dtsg  = getFrom(html, '["DTSGInitData",[],{"token":"', '",');
        const jazoest  = getFrom(html, "jazoest=", "&");

        if (fb_dtsg && fb_dtsg.length > 5) {
          this.ctx.fb_dtsg = fb_dtsg;
          if (jazoest) this.ctx.jazoest = jazoest;
          this.dtsgFailCount = 0;
          logger(`🔑 fb_dtsg جُدِّد بنجاح (${fb_dtsg.slice(0, 8)}...)`, "success");

          // حفظ AppState بعد تجديد dtsg مباشرة
          await this._saveAppState();
        } else {
          this.dtsgFailCount++;
          logger(`⚠️ فشل تجديد fb_dtsg (محاولة ${this.dtsgFailCount})`, "warn");
          if (this.dtsgFailCount >= 3) {
            logger("❌ فشل متكرر في تجديد fb_dtsg — الجلسة قد تكون منتهية", "error");
          }
        }
      } catch (e) {
        logger(`⚠️ خطأ في تجديد fb_dtsg: ${e.message}`, "warn");
      }
    };

    // تجديد فوري بعد دقيقتين من البدء
    setTimeout(refresh, 2 * 60 * 1000);
    const t = setInterval(refresh, DTSG_REFRESH_INTERVAL);
    this.timers.push(t);
  }

  // ② حفظ AppState كل 30 دقيقة ──────────────────────────
  _startAppStateSave() {
    const save = async () => {
      if (!this.active) return;
      await this._saveAppState();
    };

    // حفظ فوري بعد 10 ثواني
    setTimeout(save, 10000);
    const t = setInterval(save, APPSTATE_SAVE_INTERVAL);
    this.timers.push(t);
  }

  async _saveAppState() {
    try {
      const appState = this.api.getAppState();
      if (!appState || !appState.length) return;

      fs.ensureDirSync(path.dirname(this.appStatePath));
      fs.writeFileSync(this.appStatePath, JSON.stringify(appState, null, 2), "utf8");
      logger(`💾 AppState حُفظ (${appState.length} كوكي)`, "info");
    } catch (e) {
      logger(`⚠️ خطأ في حفظ AppState: ${e.message}`, "warn");
    }
  }

  // ③ ping كل 25 ثانية لإبقاء الجلسة حية ────────────────
  _startSessionPing() {
    const ping = async () => {
      if (!this.active) return;
      try {
        // MQTT ping — يبقي الاتصال حياً
        if (this.ctx.mqttClient && this.ctx.mqttClient.connected) {
          this.ctx.mqttClient.publish(
            "/foreground_state",
            JSON.stringify({ foreground: true }),
            { qos: 1 }
          );
        }
      } catch (_) {}
    };

    const t = setInterval(ping, SESSION_PING_INTERVAL);
    this.timers.push(t);
  }

  // ④ تجديد الكوكيز من facebook + messenger ─────────────
  _startCookieRefresh() {
    const refresh = async () => {
      if (!this.active) return;
      try {
        const { get } = require("../src/utils/request");
        const { saveCookies } = require("../src/utils/client");

        await humanDelay(2000, 5000);

        // تجديد من facebook.com
        await get("https://www.facebook.com/", this.ctx.jar, null, this.ctx.globalOptions, this.ctx)
          .then(saveCookies(this.ctx.jar));

        // تجديد من messenger.com أيضاً — يقوي الجلسة
        await humanDelay(1000, 2000);
        await get("https://www.messenger.com/", this.ctx.jar, null, this.ctx.globalOptions, this.ctx)
          .then(saveCookies(this.ctx.jar));

        logger("🍪 الكوكيز جُدِّدت (facebook + messenger)", "info");

        // حفظ AppState بعد تجديد الكوكيز
        await this._saveAppState();
      } catch (e) {
        logger(`⚠️ خطأ في تجديد الكوكيز: ${e.message}`, "warn");
      }
    };

    // أول تجديد بعد ساعة
    setTimeout(refresh, 60 * 60 * 1000);
    const t = setInterval(refresh, COOKIE_REFRESH_INTERVAL);
    this.timers.push(t);
  }

  // ── معلومات الحالة ─────────────────────────────────────
  status() {
    return {
      active:         this.active,
      dtsgFailCount:  this.dtsgFailCount,
      appStatePath:   this.appStatePath,
      timersCount:    this.timers.length,
      mqttConnected:  !!(this.ctx.mqttClient && this.ctx.mqttClient.connected),
    };
  }
}

module.exports = Guardian;
