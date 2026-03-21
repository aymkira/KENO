// ============================================================
//  AYMAN-FCA — Refresh fb_dtsg
//  مكتبة KIRA بوت | المطور: Ayman
//  التطوير: retry تلقائي + تجديد كل 6 ساعات بدل 24
// ============================================================
"use strict";

const { getFrom }  = require("../../utils/constants");
const { get }      = require("../../utils/request");
const { getType }  = require("../../utils/format");
const logger       = require("../../../func/logger");

module.exports = function (defaultFuncs, api, ctx) {

  // ✅ جدول تجديد تلقائي كل 6 ساعات
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  if (ctx._fbDtsgInterval) clearInterval(ctx._fbDtsgInterval);
  ctx._fbDtsgInterval = setInterval(async () => {
    try {
      await api.refreshFb_dtsg();
      logger("[ KIRA ] fb_dtsg مجدد تلقائياً ✅", "info");
    } catch (_) {}
  }, SIX_HOURS);

  return function refreshFb_dtsg(obj, callback) {
    if (typeof obj === "function") { callback = obj; obj = {}; }
    if (!obj) obj = {};
    if (getType(obj) !== "Object") obj = {};

    let resolveFunc, rejectFunc;
    const returnPromise = new Promise((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc  = reject;
    });
    if (!callback) {
      callback = (err, data) => err ? rejectFunc(err) : resolveFunc(data);
    }

    if (Object.keys(obj).length === 0) {
      // ✅ جرب 3 مرات عند الفشل
      const tryRefresh = async (attempt = 0) => {
        try {
          const res = await get(
            "https://www.facebook.com/",
            ctx.jar, null, ctx.globalOptions, { noRef: true }
          );
          const html    = res?.data || "";
          const fb_dtsg = getFrom(html, '["DTSGInitData",[],{"token":"', '","');
          const jazoest = getFrom(html, "jazoest=", '",');

          if (!fb_dtsg) {
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 2000));
              return tryRefresh(attempt + 1);
            }
            throw new Error("لم يُعثر على fb_dtsg بعد 3 محاولات");
          }

          Object.assign(ctx, { fb_dtsg, jazoest });
          callback(null, {
            data:    { fb_dtsg, jazoest },
            message: "تم تجديد fb_dtsg ✅"
          });
        } catch (err) {
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 2000));
            return tryRefresh(attempt + 1);
          }
          callback(err);
        }
      };
      tryRefresh();
    } else {
      Object.assign(ctx, obj);
      callback(null, {
        data:    obj,
        message: `تم تجديد: ${Object.keys(obj).join(", ")}`
      });
    }

    return returnPromise;
  };
};
