// ============================================================
//  AYMAN-FCA — Auto Save AppState
//  مكتبة KIRA بوت | المطور: Ayman
//  تحسين: حفظ عند الأخطاء + تحقق من صحة البيانات
// ============================================================
"use strict";

const fs = require("fs");
const path = require("path");
const logger = require("../../../func/logger");

module.exports = function (defaultFuncs, api, ctx) {
  return function enableAutoSaveAppState(options = {}) {
    const filePath = options.filePath || path.join(process.cwd(), "appstate.json");
    // ✅ الفترة الافتراضية 10 دقائق
    const interval = options.interval || 10 * 60 * 1000;
    const saveOnLogin = options.saveOnLogin !== false;

    let lastSavedHash = null;

    function hashState(data) {
      // hash بسيط لتجنب الحفظ إذا لم تتغير البيانات
      return JSON.stringify(data).length + "_" + (data.appState || []).length;
    }

    function saveAppState(force = false) {
      try {
        const appState = api.getAppState();
        if (!appState || !appState.appState || appState.appState.length === 0) {
          logger("[ KIRA ] AppState فارغ — تم تخطي الحفظ", "warn");
          return;
        }

        const currentHash = hashState(appState);
        // ✅ لا تحفظ إذا لم تتغير البيانات (توفير I/O)
        if (!force && currentHash === lastSavedHash) return;

        const data = JSON.stringify(appState, null, 2);

        // ✅ حفظ في ملف مؤقت أولاً ثم استبدال — يتجنب تلف الملف
        const tmpPath = filePath + ".tmp";
        fs.writeFileSync(tmpPath, data, "utf8");
        fs.renameSync(tmpPath, filePath);

        lastSavedHash = currentHash;
        logger(`[ KIRA ] AppState محفوظ ✅ (${filePath})`, "info");
      } catch (error) {
        logger(`[ KIRA ] خطأ في حفظ AppState: ${error?.message || error}`, "error");
      }
    }

    let immediateSaveTimer = null;
    if (saveOnLogin) {
      immediateSaveTimer = setTimeout(() => {
        saveAppState(true);
        immediateSaveTimer = null;
      }, 2000);
    }

    const intervalId = setInterval(() => saveAppState(), interval);
    logger(`[ KIRA ] حفظ تلقائي للـ AppState مفعّل (كل ${Math.round(interval / 60000)} دقيقة)`, "info");

    if (!ctx._autoSaveInterval) ctx._autoSaveInterval = [];
    ctx._autoSaveInterval.push(intervalId);

    // ✅ احفظ عند الإيقاف
    const exitHandler = () => saveAppState(true);
    process.once("SIGINT", exitHandler);
    process.once("SIGTERM", exitHandler);

    return function disableAutoSaveAppState() {
      if (immediateSaveTimer) { clearTimeout(immediateSaveTimer); immediateSaveTimer = null; }
      clearInterval(intervalId);
      process.removeListener("SIGINT", exitHandler);
      process.removeListener("SIGTERM", exitHandler);
      const index = ctx._autoSaveInterval?.indexOf(intervalId) ?? -1;
      if (index !== -1) ctx._autoSaveInterval.splice(index, 1);
      logger("[ KIRA ] تم إيقاف الحفظ التلقائي للـ AppState", "info");
    };
  };
};
