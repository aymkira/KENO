// ============================================================
//  AYMAN-FCA v2.0 — Session Keeper
//  © 2025 Ayman. All Rights Reserved.
//
//  🔑 السر الأعظم لاستمرارية الجلسة لشهر وأكثر:
//
//  1. Presence تلقائي كل 45 ثانية (يُقنع Facebook أن المستخدم حي)
//  2. تجديد fb_dtsg كل 6 ساعات (قبل انتهائه)
//  3. حفظ Cookies من كل response (تجديد تلقائي دون طلب)
//  4. Accessibility cookie (تُقنع Facebook أنه متصفح حقيقي)
//  5. نشاط خفيف عشوائي كل 3-7 دقائق (يمنع timeout)
//  6. حفظ AppState بشكل atomic (يحمي من تلف الملف)
// ============================================================
"use strict";

const fs   = require("fs");
const path = require("path");

const logger = require("../../../func/logger");

// ✅ ترميز الـ presence (من fca-master الأصلية)
const PRESENCE_MAP = {
  _:"%", A:"%2", B:"000", C:"%7d", D:"%7b%22", E:"%2c%22",
  F:"%22%3a", G:"%2c%22ut%22%3a1", H:"%2c%22bls%22%3a",
  I:"%2c%22n%22%3a%22%", J:"%22%3a%7b%22i%22%3a0%7d",
  K:"%2c%22pt%22%3a0%2c%22vis%22%3a", L:"%2c%22ch%22%3a%7b%22h%22%3a%22",
  M:"%7b%22v%22%3a2%2c%22time%22%3a1", N:".channel%22%2c%22sub%22%3a%5b",
  O:"%2c%22sb%22%3a1%2c%22t%22%3a%5b", P:"%2c%22ud%22%3a100%2c%22lc%22%3a0",
  Q:"%5d%2c%22f%22%3anull%2c%22uct%22%3a", R:".channel%22%2c%22sub%22%3a%5b1%5d",
  Z:"%2c%22sb%22%3a1%2c%22t%22%3a%5b%5d%2c%22f%22%3anull%2c%22uct%22%3a0%2c%22s%22%3a0%2c%22blo%22%3a0%7d%2c%22bl%22%3a%7b%22ac%22%3a"
};

// بناء الـ encoder
const encodeMap = {};
const decodeList = [];
for (const [k, v] of Object.entries(PRESENCE_MAP)) {
  encodeMap[v] = k;
  decodeList.push(v);
}
decodeList.sort((a, b) => b.length - a.length);
const presenceRegex = new RegExp(decodeList.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");

function presenceEncode(str) {
  return encodeURIComponent(str).replace(presenceRegex, m => encodeMap[m] || m);
}

// ✅ توليد presence حقيقي يُحاكي المتصفح
function generatePresence(userID) {
  const time = Date.now();
  return "E" + presenceEncode(JSON.stringify({
    v: 3,
    time: Math.floor(time / 1000),
    user: userID,
    state: {
      ut: 0, t2: [], lm2: null, uct2: time, tr: null,
      tw: Math.floor(Math.random() * 4294967295) + 1,
      at: time
    },
    ch: { [`p_${userID}`]: 0 }
  }));
}

// ✅ Accessibility cookie — يُقنع Facebook أنه متصفح حقيقي
function generateAccessibilityCookie() {
  const time = Date.now();
  return encodeURIComponent(JSON.stringify({
    sr: 0, "sr-ts": time, jk: 0, "jk-ts": time,
    kb: 0, "kb-ts": time, hcm: 0, "hcm-ts": time
  }));
}

// ✅ حفظ AppState بشكل atomic — يحمي من تلف الملف
function saveAppStateAtomic(statePath, state) {
  try {
    const tmp = statePath + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(state, null, "\t"), "utf8");
    fs.renameSync(tmp, statePath);
    return true;
  } catch (e) {
    logger(`[ AYMAN ] خطأ في حفظ AppState: ${e?.message || e}`, "error");
    return false;
  }
}

// ✅ النظام الرئيسي لإبقاء الجلسة حية
function createSessionKeeper(api, ctx, options = {}) {
  const appStatePath = options.appStatePath ||
    path.join(process.cwd(), "appstate.json");
  const onSave = typeof options.onSave === "function" ? options.onSave : null;

  let _presenceTimer  = null;
  let _activityTimer  = null;
  let _dtsgTimer      = null;
  let _saveTimer      = null;
  let _accessTimer    = null;
  let _active         = false;

  // ① Presence كل 45 ثانية
  function startPresence() {
    if (_presenceTimer) return;
    _presenceTimer = setInterval(() => {
      try {
        if (!ctx.mqttClient?.connected) return;
        const presence = generatePresence(ctx.userID);
        ctx.mqttClient.publish(
          "/orca_presence",
          JSON.stringify({ p: presence, c: ctx.userID }),
          { qos: 0 }
        );
      } catch (_) {}
    }, 45000);
  }

  // ② نشاط خفيف عشوائي كل 3-7 دقائق
  function scheduleActivity() {
    const ms = (3 + Math.random() * 4) * 60 * 1000;
    _activityTimer = setTimeout(async () => {
      try {
        if (api?.markAsReadAll) api.markAsReadAll(() => {});
      } catch (_) {}
      scheduleActivity();
    }, ms);
  }

  // ③ تجديد fb_dtsg كل 6 ساعات
  function startDtsgRefresh() {
    if (_dtsgTimer) return;
    _dtsgTimer = setInterval(async () => {
      try {
        if (api?.refreshFb_dtsg) {
          await api.refreshFb_dtsg();
          logger("[ AYMAN ] fb_dtsg مجدد تلقائياً ✅", "info");
        }
      } catch (_) {}
    }, 6 * 60 * 60 * 1000);
  }

  // ④ حفظ AppState كل 8 دقائق
  function startAutoSave() {
    if (_saveTimer) return;
    _saveTimer = setInterval(() => {
      try {
        if (!api?.getAppState) return;
        const state = api.getAppState();
        if (!state || state.length === 0) return;

        // ✅ لا تحفظ إذا لم تتغير البيانات
        const hash = state.length + "_" + (state[0]?.value?.length || 0);
        if (hash === ctx._lastSaveHash) return;
        ctx._lastSaveHash = hash;

        const ok = saveAppStateAtomic(appStatePath, state);
        if (ok) {
          logger("[ AYMAN ] AppState محفوظ ✅", "info");
          if (onSave) onSave(state);
        }
      } catch (_) {}
    }, 8 * 60 * 1000);
  }

  // ⑤ Accessibility cookie كل 30 دقيقة
  function startAccessibilityCookie() {
    if (_accessTimer) return;
    const updateCookie = () => {
      try {
        const val = generateAccessibilityCookie();
        const cookieStr = `wd=${val}; domain=.facebook.com; path=/; expires=${
          new Date(Date.now() + 365 * 24 * 3600 * 1000).toUTCString()
        }`;
        if (ctx?.jar?.setCookieSync) {
          ctx.jar.setCookieSync(cookieStr, "https://www.facebook.com");
        }
      } catch (_) {}
    };
    updateCookie();
    _accessTimer = setInterval(updateCookie, 30 * 60 * 1000);
  }

  function start() {
    if (_active) return;
    _active = true;
    startPresence();
    scheduleActivity();
    startDtsgRefresh();
    startAutoSave();
    startAccessibilityCookie();
    logger("[ AYMAN ] Session Keeper مفعّل ✅ — الجلسة ستدوم لشهر+", "info");
  }

  function stop() {
    _active = false;
    [_presenceTimer, _dtsgTimer, _saveTimer, _accessTimer].forEach(t => {
      if (t) clearInterval(t);
    });
    if (_activityTimer) clearTimeout(_activityTimer);
    _presenceTimer = _activityTimer = _dtsgTimer = _saveTimer = _accessTimer = null;
    logger("[ AYMAN ] Session Keeper موقوف", "info");
  }

  // ✅ حفظ فوري
  function saveNow() {
    try {
      if (!api?.getAppState) return false;
      const state = api.getAppState();
      if (!state || state.length === 0) return false;
      return saveAppStateAtomic(appStatePath, state);
    } catch (_) { return false; }
  }

  return { start, stop, saveNow, generatePresence, generateAccessibilityCookie };
}

module.exports = { createSessionKeeper, generatePresence, generateAccessibilityCookie, saveAppStateAtomic };
