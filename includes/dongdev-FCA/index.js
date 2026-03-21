// ============================================================
//  AYMAN-FCA — Main Entry
//  مكتبة KIRA بوت
//  المطور: Ayman
//  جميع الحقوق محفوظة © 2025 Ayman
// ============================================================

const login = require("./module/login");

// CommonJS default export
module.exports = login;

// دعم require({ login })
module.exports.login = login;

// دعم ESM interop
module.exports.default = login;
