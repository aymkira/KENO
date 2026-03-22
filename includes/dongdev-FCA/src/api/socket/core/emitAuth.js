"use strict";
/**
 * AYMAN-FCA — emitAuth
 * مضاد تسجيل الخروج: يحاول إعادة الاتصال تلقائياً بدل ما يموت البوت
 * by ayman
 */
module.exports = function createEmitAuth({ logger }) {
  return function emitAuth(ctx, api, globalCallback, reason, detail) {
    // ── تنظيف كل التايمرات ──────────────────────────
    try { if (ctx._autoCycleTimer) { clearInterval(ctx._autoCycleTimer); ctx._autoCycleTimer = null; } } catch (_) {}
    try { if (ctx._reconnectTimer) { clearTimeout(ctx._reconnectTimer); ctx._reconnectTimer = null; } } catch (_) {}
    try { if (ctx._rTimeout) { clearTimeout(ctx._rTimeout); ctx._rTimeout = null; } } catch (_) {}
    try { ctx._ending = true; ctx._cycling = false; } catch (_) {}

    // ── تنظيف MQTT ──────────────────────────────────
    try {
      if (ctx.mqttClient) {
        ctx.mqttClient.removeAllListeners();
        if (ctx.mqttClient.connected) ctx.mqttClient.end(true);
      }
    } catch (_) {}
    ctx.mqttClient = undefined;
    ctx.loggedIn   = false;

    // ── تنظيف الذاكرة ───────────────────────────────
    try { if (ctx.tasks instanceof Map) ctx.tasks.clear(); } catch (_) {}
    try {
      if (Array.isArray(ctx._userInfoIntervals))
        ctx._userInfoIntervals.forEach(i => { try { clearInterval(i); } catch (_) {} });
      ctx._userInfoIntervals = [];
    } catch (_) {}
    try {
      if (Array.isArray(ctx._autoSaveInterval))
        ctx._autoSaveInterval.forEach(i => { try { clearInterval(i); } catch (_) {} });
      ctx._autoSaveInterval = [];
    } catch (_) {}
    try { if (ctx._scheduler?.destroy) { ctx._scheduler.destroy(); ctx._scheduler = undefined; } } catch (_) {}

    const msg = detail || reason;
    logger(`⚠️ انتهت الجلسة (${reason}): ${msg}`, "error");

    // ── إيقاف Guardian ──────────────────────────────────
    try {
      if (ctx._guardian) {
        ctx._guardian.stop();
        ctx._guardian = null;
      }
    } catch (_) {}

    // ── تنظيف Stealth ───────────────────────────────────
    try {
      const stealth = require("../../func/stealth");
      stealth.clearStealthTimers(ctx);
    } catch (_) {}

    // ── إرسال الحدث للبوت ───────────────────────────
    if (typeof globalCallback === "function") {
      try {
        globalCallback({
          type: "account_inactive",
          reason,
          error: msg,
          timestamp: Date.now()
        }, null);
      } catch (cbErr) {
        logger(`emitAuth callback error: ${cbErr?.message || String(cbErr)}`, "error");
      }
    }
  };
};
