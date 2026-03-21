// ============================================================
//  AYMAN-FCA — Emit Auth
//  مكتبة KIRA بوت | المطور: Ayman
//  التطوير: تسجيل وقت الانتهاء + حفظ appstate قبل الإيقاف
// ============================================================
"use strict";

module.exports = function createEmitAuth({ logger }) {
  return function emitAuth(ctx, api, globalCallback, reason, detail) {

    // ✅ احفظ AppState قبل الإيقاف
    try {
      if (api && typeof api.getAppState === "function") {
        const fs   = require("fs");
        const path = require("path");
        const state = api.getAppState();
        if (state && state.length > 0) {
          const p   = path.join(process.cwd(), "appstate.json");
          const tmp = p + ".tmp";
          fs.writeFileSync(tmp, JSON.stringify(state, null, "\t"), "utf8");
          fs.renameSync(tmp, p);
          logger("[ KIRA ] AppState محفوظ قبل الإيقاف ✅", "info");
        }
      }
    } catch (_) {}

    // ✅ تنظيف كل الـ timers
    const clearSafe = (fn, ref) => { try { fn(ref); } catch (_) {} };

    clearSafe(clearInterval, ctx._autoCycleTimer);  ctx._autoCycleTimer = null;
    clearSafe(clearTimeout,  ctx._reconnectTimer);  ctx._reconnectTimer = null;
    clearSafe(clearTimeout,  ctx._rTimeout);        ctx._rTimeout = null;

    try { ctx._ending = true; ctx._cycling = false; } catch (_) {}

    // ✅ إيقاف MQTT
    try {
      if (ctx.mqttClient) {
        ctx.mqttClient.removeAllListeners();
        if (ctx.mqttClient.connected) ctx.mqttClient.end(true);
      }
    } catch (_) {}
    ctx.mqttClient = undefined;
    ctx.loggedIn   = false;

    // ✅ تنظيف الذاكرة
    try { if (ctx.tasks instanceof Map) ctx.tasks.clear(); } catch (_) {}
    try {
      (ctx._autoSaveInterval || []).forEach(i => clearInterval(i));
      ctx._autoSaveInterval = [];
    } catch (_) {}
    try {
      if (ctx._scheduler?.destroy) { ctx._scheduler.destroy(); ctx._scheduler = undefined; }
    } catch (_) {}

    const msg = detail || reason;
    logger(`[ KIRA ] auth → ${reason}: ${msg}`, "error");

    // ✅ أشعر البوت بالنوع والوقت
    if (typeof globalCallback === "function") {
      try {
        globalCallback({
          type:      "account_inactive",
          reason,
          error:     msg,
          timestamp: Date.now()
        }, null);
      } catch (e) {
        logger(`[ KIRA ] emitAuth callback خطأ: ${e?.message || e}`, "error");
      }
    }
  };
};
