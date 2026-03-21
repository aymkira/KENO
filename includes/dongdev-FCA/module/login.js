// ============================================================
//  AYMAN-FCA — Login Entry Point
//  مكتبة KIRA بوت
//  المطور: Ayman
//  جميع الحقوق محفوظة © 2025 Ayman
// ============================================================

"use strict";

const { getType } = require("../src/utils/format");
const { setOptions } = require("./options");
const { loadConfig } = require("./config");
const loginHelper = require("./loginHelper");
const logger = require("../func/logger");

const { config } = loadConfig();
global.fca = { config };

// ✅ حماية عالمية من الكراش — مرة واحدة فقط
if (!global.fca._errorHandlersInstalled) {
  global.fca._errorHandlersInstalled = true;

  // معالجة الـ Promise التي لم تُعالج
  process.on("unhandledRejection", (reason) => {
    try {
      if (reason && typeof reason === "object") {
        const errorCode = reason.code || reason.cause?.code;
        const errorMessage = reason.message || String(reason);

        // تجاهل أخطاء Sequelize المعروفة
        if (errorMessage.includes("No Sequelize instance passed")) return;

        // أخطاء الشبكة — لا نوقف البوت
        if (
          errorCode === "UND_ERR_CONNECT_TIMEOUT" ||
          errorCode === "ETIMEDOUT" ||
          errorCode === "ECONNREFUSED" ||
          errorCode === "ENOTFOUND" ||
          errorCode === "ECONNRESET" ||
          errorMessage.includes("Connect Timeout") ||
          errorMessage.includes("fetch failed") ||
          errorMessage.includes("ECONNREFUSED") ||
          errorMessage.includes("ENOTFOUND")
        ) {
          logger(`[ KIRA ] خطأ شبكة (لن يوقف البوت): ${errorMessage}`, "warn");
          return;
        }
      }

      logger(`[ KIRA ] Promise غير معالجة: ${reason && reason.message ? reason.message : String(reason)}`, "error");
    } catch (e) {
      // صامت — لا نكسر معالج الأخطاء نفسه
    }
  });

  // معالجة الأخطاء غير المتوقعة
  process.on("uncaughtException", (error) => {
    try {
      const errorMessage = error.message || String(error);
      const errorCode = error.code;

      // تجاهل أخطاء Sequelize المعروفة
      if (errorMessage.includes("No Sequelize instance passed")) return;

      // أخطاء الشبكة — لا نوقف البوت
      if (
        errorCode === "UND_ERR_CONNECT_TIMEOUT" ||
        errorCode === "ETIMEDOUT" ||
        errorMessage.includes("Connect Timeout") ||
        errorMessage.includes("fetch failed")
      ) {
        logger(`[ KIRA ] خطأ شبكة uncaught (لن يوقف البوت): ${errorMessage}`, "warn");
        return;
      }

      logger(`[ KIRA ] خطأ غير متوقع (البوت يحاول الاستمرار): ${errorMessage}`, "error");
    } catch (e) {
      // صامت
    }
  });
}

// ✅ دالة اللوجين الرئيسية
function login(loginData, options, callback) {
  if (getType(options) === "Function" || getType(options) === "AsyncFunction") {
    callback = options;
    options = {};
  }

  const globalOptions = {
    selfListen: false,
    selfListenEvent: false,
    listenEvents: false,
    listenTyping: false,
    updatePresence: false,
    forceLogin: false,
    autoMarkRead: false,
    autoReconnect: true,
    online: true,
    emitReady: false,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
  };

  setOptions(globalOptions, options);

  let prCallback = null;
  let rejectFunc = null;
  let resolveFunc = null;
  let returnPromise = null;

  if (getType(callback) !== "Function" && getType(callback) !== "AsyncFunction") {
    returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    prCallback = function (error, api) {
      if (error) return rejectFunc(error);
      return resolveFunc(api);
    };
    callback = prCallback;
  }

  // ✅ autoUpdate معطل — نبدأ مباشرة بدون تحقق من التحديثات
  const proceed = () =>
    loginHelper(
      loginData.appState,
      loginData.Cookie,
      loginData.email,
      loginData.password,
      globalOptions,
      callback,
      prCallback
    );

  proceed();

  return returnPromise;
}

module.exports = login;
