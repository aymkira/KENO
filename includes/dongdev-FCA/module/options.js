// ============================================================
//  AYMAN-FCA — Options
//  مكتبة KIRA بوت | المطور: Ayman
// ============================================================
"use strict";

const { getType } = require("../src/utils/format");
const { setProxy } = require("../src/utils/request");
const logger = require("../func/logger");

const Boolean_Option = [
  "online",
  "selfListen",
  "listenEvents",
  "updatePresence",
  "forceLogin",
  "autoMarkRead",
  "listenTyping",
  "autoReconnect",
  "emitReady",
  "selfListenEvent",
  "autoMarkDelivery"
];

// ✅ خيارات يتم تجاهلها بصمت (موروثة من مكتبات قديمة)
const IGNORED_OPTIONS = new Set([
  "logLevel",
  "pauseLog",
  "logRecordSize",
  "updateSeq"
]);

function setOptions(globalOptions, options) {
  for (const key of Object.keys(options || {})) {
    // ✅ تجاهل الخيارات القديمة بصمت بدون warn
    if (IGNORED_OPTIONS.has(key)) continue;

    if (Boolean_Option.includes(key)) {
      globalOptions[key] = Boolean(options[key]);
      continue;
    }

    switch (key) {
      case "userAgent": {
        globalOptions.userAgent = options.userAgent ||
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
        break;
      }
      case "proxy": {
        if (typeof options.proxy !== "string") {
          delete globalOptions.proxy;
          setProxy();
        } else {
          globalOptions.proxy = options.proxy;
          setProxy(globalOptions.proxy);
        }
        break;
      }
      case "pageID": {
        globalOptions.pageID = String(options.pageID);
        break;
      }
      default: {
        logger(`[ KIRA ] setOptions: خيار غير معروف "${key}" — تم تجاهله`, "warn");
        break;
      }
    }
  }
}

module.exports = { setOptions, Boolean_Option };
