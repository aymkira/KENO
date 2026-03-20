"use strict";

// 🛡️ تم تعطيل تسجيل الخروج — البوت لن يسجل خروجاً أبداً
module.exports = function (defaultFuncs, api, ctx) {
  return function logout(callback) {
    const msg = "🛡️ تسجيل الخروج معطّل — البوت محمي";
    if (typeof callback === "function") return callback(new Error(msg));
    return Promise.reject(new Error(msg));
  };
};
