// ============================================================
//  AYMAN-FCA — Smart Retry System
//  مكتبة KIRA بوت | المطور: Ayman
//  تحسين: إعادة محاولة ذكية مع Exponential Backoff
// ============================================================
"use strict";

const { delay } = require("./client");

// ✅ أنواع الأخطاء التي تستحق إعادة المحاولة
const RETRYABLE_NET_CODES = new Set([
  "UND_ERR_CONNECT_TIMEOUT",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EPIPE",
  "EAI_AGAIN",
  "ENETUNREACH"
]);

function isRetryableError(e) {
  const code = e?.code || e?.cause?.code || "";
  const msg = (e?.message || "").toLowerCase();
  if (RETRYABLE_NET_CODES.has(code)) return true;
  if (/timeout|connect timeout|network error|fetch failed|socket hang up/i.test(msg)) return true;
  return false;
}

async function requestWithRetry(fn, retries = 3, baseDelay = 800, ctx) {
  let lastError;

  const emit = (event, payload) => {
    try {
      if (ctx?._emitter?.emit) ctx._emitter.emit(event, payload);
    } catch {}
  };

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;

      // ✅ خطأ Header غير صالح — لا تعيد المحاولة أبداً
      if (
        e?.code === "ERR_INVALID_CHAR" ||
        e?.message?.includes("Invalid character in header")
      ) {
        const err = new Error("Invalid header content — request aborted.");
        err.error = "Invalid header content";
        err.originalError = e;
        err.code = "ERR_INVALID_CHAR";
        return Promise.reject(err);
      }

      const status = e?.response?.status || e?.statusCode || 0;
      const url = e?.config?.url || "";
      const method = String(e?.config?.method || "").toUpperCase();

      // ✅ Rate limit — أشعر بالحدث ولا تعيد المحاولة بنفس السرعة
      if (status === 429) {
        emit("rateLimit", { status, url, method });
        // انتظر أطول عند الـ rate limit
        const rateLimitDelay = Math.min(baseDelay * Math.pow(3, i), 60000);
        await delay(rateLimitDelay);
        continue;
      }

      // ✅ أخطاء 4xx (غير 429) — لا تعيد المحاولة
      if (status >= 400 && status < 500) {
        return e.response || Promise.reject(e);
      }

      // ✅ آخر محاولة
      if (i === retries - 1) {
        return e.response || Promise.reject(e);
      }

      // ✅ أخطاء الشبكة — أشعر بالحدث
      if (!status && isRetryableError(e)) {
        emit("networkError", {
          code: e?.code || "",
          message: e?.message || String(e),
          url,
          method,
          attempt: i + 1
        });
      }

      // ✅ Exponential Backoff مع Jitter — يتجنب الطوفان على السيرفر
      const backoffDelay = Math.min(
        baseDelay * Math.pow(2, i) + Math.floor(Math.random() * 300),
        30000
      );
      await delay(backoffDelay);
    }
  }

  return Promise.reject(lastError || new Error("Request failed after retries"));
}

module.exports = { requestWithRetry };
