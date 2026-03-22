
"use strict";
/**
 * ╔══════════════════════════════════════════╗
 * ║     AYMAN-FCA — Stealth Engine v1.0     ║
 * ║   محرك التمويه — مضاد كشف الأتمتة      ║
 * ║              by ayman                   ║
 * ╚══════════════════════════════════════════╝
 * يجعل البوت يبدو كمتصفح حقيقي بالكامل
 */

// ── بيانات متصفحات حقيقية محدّثة ──────────────────────
const BROWSERS = [
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    secChUa: '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    platform: '"Windows"',
    platformVersion: '"15.0.0"',
    fullVersion: '"122.0.6261.112"',
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    secChUa: '"Chromium";v="121", "Not A(Brand";v="99", "Google Chrome";v="121"',
    platform: '"Windows"',
    platformVersion: '"10.0.0"',
    fullVersion: '"121.0.6167.185"',
  },
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    secChUa: '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    platform: '"macOS"',
    platformVersion: '"14.3.1"',
    fullVersion: '"122.0.6261.112"',
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    secChUa: null,
    platform: '"Windows"',
    platformVersion: '"15.0.0"',
    fullVersion: null,
  },
];

// ── اختيار عشوائي ذكي ──────────────────────────────────
function getRandomBrowser() {
  return BROWSERS[Math.floor(Math.random() * BROWSERS.length)];
}

// ── توليد headers كاملة تشبه متصفح حقيقي ──────────────
function buildStealthHeaders(url, ctx) {
  const browser = ctx._browser || getRandomBrowser();
  const u       = new URL(url);
  const isMsg   = u.hostname.includes("messenger");

  const headers = {
    "User-Agent":                browser.ua,
    "Accept":                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language":           "ar,en-US;q=0.9,en;q=0.8",
    "Accept-Encoding":           "gzip, deflate, br",
    "Cache-Control":             "no-cache",
    "Pragma":                    "no-cache",
    "DNT":                       "1",
    "Connection":                "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Site":            "same-origin",
    "Sec-Fetch-Mode":            "navigate",
    "Sec-Fetch-User":            "?1",
    "Sec-Fetch-Dest":            "document",
    "Origin":                    isMsg ? "https://www.messenger.com" : "https://www.facebook.com",
    "Referer":                   isMsg ? "https://www.messenger.com/" : "https://www.facebook.com/",
  };

  // headers خاصة بـ Chrome فقط
  if (browser.secChUa) {
    headers["sec-ch-ua"]                  = browser.secChUa;
    headers["sec-ch-ua-mobile"]           = "?0";
    headers["sec-ch-ua-platform"]         = browser.platform;
    headers["sec-ch-ua-platform-version"] = browser.platformVersion;
    headers["sec-ch-ua-arch"]             = '"x86"';
    headers["sec-ch-ua-bitness"]          = '"64"';
    if (browser.fullVersion)
      headers["sec-ch-ua-full-version"] = browser.fullVersion;
  }

  if (ctx?.region) headers["X-MSGR-Region"] = ctx.region;

  return headers;
}

// ── headers للطلبات الـ API (XHR) ──────────────────────
function buildApiHeaders(url, ctx) {
  const base = buildStealthHeaders(url, ctx);
  return {
    ...base,
    "Content-Type":    "application/x-www-form-urlencoded",
    "X-FB-LSD":        ctx?.fb_lsd || "",
    "X-ASBD-ID":       "198387",
    "X-FB-Friendly-Name": "MessengerWeb",
    "Sec-Fetch-Site":  "same-origin",
    "Sec-Fetch-Mode":  "cors",
    "Sec-Fetch-Dest":  "empty",
    "Sec-Fetch-User":  undefined,
  };
}

// ── توليد تأخير عشوائي يشبه الإنسان ───────────────────
function humanDelay(minMs = 200, maxMs = 800) {
  return new Promise(r =>
    setTimeout(r, Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs)
  );
}

// ── توليد Session ID عشوائي ────────────────────────────
function generateSessionID() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
}

// ── توليد Client ID عشوائي ─────────────────────────────
function generateClientID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── تدوير المتصفح كل N ساعات لتجنب الكشف ──────────────
function startBrowserRotation(ctx, intervalHours = 6) {
  const ms = intervalHours * 60 * 60 * 1000;
  const rotate = () => {
    ctx._browser = getRandomBrowser();
  };
  rotate(); // فوري
  const timer = setInterval(rotate, ms);
  if (ctx._stealthTimers) ctx._stealthTimers.push(timer);
  else ctx._stealthTimers = [timer];
  return timer;
}

// ── تنظيف التايمرات ────────────────────────────────────
function clearStealthTimers(ctx) {
  if (ctx._stealthTimers) {
    ctx._stealthTimers.forEach(t => clearInterval(t));
    ctx._stealthTimers = [];
  }
}

module.exports = {
  getRandomBrowser,
  buildStealthHeaders,
  buildApiHeaders,
  humanDelay,
  generateSessionID,
  generateClientID,
  startBrowserRotation,
  clearStealthTimers,
};
