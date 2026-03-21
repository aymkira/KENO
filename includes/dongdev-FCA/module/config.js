// ============================================================
//  AYMAN-FCA — Config Loader
//  مكتبة KIRA بوت
//  المطور: Ayman
//  جميع الحقوق محفوظة © 2025 Ayman
// ============================================================

const fs = require("fs");
const path = require("path");
const logger = require("../func/logger");

const defaultConfig = {
  // ✅ autoUpdate معطل افتراضياً — لا يبطئ الإقلاع على Render
  autoUpdate: false,

  mqtt: {
    enabled: true,
    reconnectInterval: 3600
  },

  autoLogin: true,

  // ✅ السيرفر الخارجي معطل — لا يُرسل أي بيانات لأحد
  apiServer: "",
  apiKey: "",

  credentials: {
    email: "",
    password: "",
    twofactor: ""
  },

  antiGetInfo: {
    AntiGetThreadInfo: false,
    AntiGetUserInfo: false
  },

  remoteControl: {
    enabled: false,
    url: "",
    token: "",
    autoReconnect: true
  }
};

function loadConfig() {
  const configPath = path.join(process.cwd(), "fca-config.json");
  let config;

  if (!fs.existsSync(configPath)) {
    config = defaultConfig;
  } else {
    try {
      const fileContent = fs.readFileSync(configPath, "utf8");
      config = Object.assign({}, defaultConfig, JSON.parse(fileContent));
    } catch (err) {
      logger(`خطأ في قراءة ملف الإعدادات: ${err.message}`, "error");
      config = defaultConfig;
    }
  }

  return { config, configPath };
}

module.exports = { loadConfig, defaultConfig };
