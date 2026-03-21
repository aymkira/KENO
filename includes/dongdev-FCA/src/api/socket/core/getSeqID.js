// ============================================================
//  AYMAN-FCA — GetSeqID + Session Recovery
//  مكتبة KIRA بوت | المطور: Ayman
//  التطوير: استعادة الجلسة محلياً بدون سيرفر خارجي
// ============================================================
"use strict";

const { getType } = require("../../../utils/format");
const { parseAndCheckLogin, saveCookies } = require("../../../utils/client");
const { get } = require("../../../utils/request");
const path = require("path");
const fs   = require("fs");

const MAX_RETRIES   = 4;
const RETRY_DELAY   = 2500;

// ✅ تجديد الجلسة محلياً — بدون أي سيرفر خارجي
async function refreshSessionLocally(ctx, logger) {
  try {
    logger("[ KIRA ] تجديد الجلسة محلياً...", "warn");

    // جرب www أولاً ثم m.facebook
    const urls = [
      "https://www.facebook.com/",
      "https://m.facebook.com/",
      "https://www.facebook.com/home.php"
    ];

    const isValidUID = uid =>
      uid && uid !== "0" && /^\d+$/.test(uid) && parseInt(uid, 10) > 0;

    const extractUID = html => {
      const s = typeof html === "string" ? html : String(html || "");
      return s.match(/"USER_ID"\s*:\s*"(\d+)"/)?.[1] ||
             s.match(/\["CurrentUserInitialData",\[\],\{".*?"USER_ID":"(\d+)".*?\},\d+\]/)?.[1];
    };

    for (const url of urls) {
      try {
        const res = await get(url, ctx.jar, null, ctx.globalOptions, ctx)
          .then(saveCookies(ctx.jar));
        const html = res?.data || "";
        const uid  = extractUID(html);
        if (isValidUID(uid)) {
          ctx.loggedIn = true;
          ctx.userID   = uid;
          logger(`[ KIRA ] جلسة مجددة ✅ UID: ${uid}`, "info");
          return true;
        }
      } catch (_) {}
    }

    logger("[ KIRA ] فشل تجديد الجلسة — الصفحات لم تعطِ USER_ID", "warn");
    return false;
  } catch (e) {
    logger(`[ KIRA ] خطأ في تجديد الجلسة: ${e?.message || e}`, "error");
    return false;
  }
}

// ✅ تجديد fb_dtsg محلياً
async function refreshFbDtsg(ctx, logger) {
  try {
    const { getFrom } = require("../../../utils/constants");
    const res  = await get("https://www.facebook.com/", ctx.jar, null, ctx.globalOptions, ctx);
    const html = res?.data || "";
    const fb_dtsg  = getFrom(html, '["DTSGInitData",[],{"token":"', '","');
    const jazoest  = getFrom(html, "jazoest=", '",');
    if (fb_dtsg) {
      ctx.fb_dtsg = fb_dtsg;
      if (jazoest) ctx.jazoest = jazoest;
      logger("[ KIRA ] fb_dtsg مجدد ✅", "info");
      return true;
    }
  } catch (_) {}
  return false;
}

// ✅ حفظ AppState في الملف المحلي عند نجاح الجلسة
function saveAppStateToFile(ctx, logger) {
  try {
    const { getAppState } = require("../../../utils/cookies");
    const appStatePath = path.join(process.cwd(), "appstate.json");
    const state = getAppState(ctx.jar);
    if (state && state.length > 0) {
      const tmp = appStatePath + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(state, null, "\t"), "utf8");
      fs.renameSync(tmp, appStatePath);
      logger("[ KIRA ] AppState محفوظ تلقائياً بعد تجديد الجلسة ✅", "info");
    }
  } catch (_) {}
}

module.exports = function createGetSeqID(deps) {
  const { listenMqtt, logger, emitAuth } = deps;

  return function getSeqID(defaultFuncs, api, ctx, globalCallback, form, retryCount = 0) {
    ctx.t_mqttCalled = false;

    return defaultFuncs
      .post("https://www.facebook.com/api/graphqlbatch/", ctx.jar, form)
      .then(parseAndCheckLogin(ctx, defaultFuncs))
      .then(async resData => {
        if (getType(resData) !== "Array") {
          const errMsg = resData?.error || resData?.message || "";
          if (/Not logged in|login|blocked|401|403|checkpoint/i.test(errMsg)) {
            throw { error: "Not logged in", originalResponse: resData };
          }
          throw { error: "Not logged in", originalResponse: resData };
        }
        if (!Array.isArray(resData) || !resData.length) return;
        const lastRes = resData[resData.length - 1];
        if (lastRes && lastRes.successful_results === 0) return;

        const syncSeqId = resData[0]?.o0?.data?.viewer?.message_threads?.sync_sequence_id;
        if (syncSeqId) {
          ctx.lastSeqId = syncSeqId;
          // ✅ أعد تصفير عداد المحاولات عند النجاح
          ctx._seqIdRetries = 0;
          logger("[ KIRA ] MQTT SeqID ✅ — بدء الاستماع", "info");
          listenMqtt(defaultFuncs, api, ctx, globalCallback);
        } else {
          throw { error: "getSeqId: no sync_sequence_id found." };
        }
      })
      .catch(async err => {
        const msg = ((err?.error) || (err?.message) || String(err || ""));
        const isAuthError = /Not logged in|no sync_sequence_id|blocked the login|401|403/i.test(msg);

        if (isAuthError) {
          // ✅ المرحلة 1: إعادة المحاولة مع تجديد محلي
          if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAY * (retryCount + 1);
            logger(`[ KIRA ] SeqID retry ${retryCount + 1}/${MAX_RETRIES} بعد ${delay}ms`, "warn");
            await new Promise(r => setTimeout(r, delay));

            // في أول محاولة: جدد fb_dtsg فقط
            if (retryCount === 0) {
              await refreshFbDtsg(ctx, logger);
            }
            // في المحاولة الثانية: جدد الجلسة كاملة
            if (retryCount === 1) {
              const ok = await refreshSessionLocally(ctx, logger);
              if (ok) saveAppStateToFile(ctx, logger);
            }
            // في المحاولة الثالثة: جدد fb_dtsg + جلسة معاً
            if (retryCount === 2) {
              await refreshFbDtsg(ctx, logger);
              const ok = await refreshSessionLocally(ctx, logger);
              if (ok) saveAppStateToFile(ctx, logger);
            }

            return getSeqID(defaultFuncs, api, ctx, globalCallback, form, retryCount + 1);
          }

          // ✅ المرحلة 2: آخر محاولة — تجديد شامل
          logger("[ KIRA ] كل المحاولات فشلت — محاولة تجديد شامل أخيرة...", "warn");
          const ok = await refreshSessionLocally(ctx, logger);
          if (ok) {
            await refreshFbDtsg(ctx, logger);
            saveAppStateToFile(ctx, logger);
            await new Promise(r => setTimeout(r, 3000));
            return getSeqID(defaultFuncs, api, ctx, globalCallback, form, 0);
          }

          // ✅ فشل كل شيء — أشعر البوت
          if (/blocked/i.test(msg)) {
            return emitAuth(ctx, api, globalCallback, "login_blocked", msg);
          }
          return emitAuth(ctx, api, globalCallback, "not_logged_in", msg);
        }

        logger(`[ KIRA ] getSeqID خطأ: ${msg}`, "error");
        return emitAuth(ctx, api, globalCallback, "auth_error", msg);
      });
  };
};
