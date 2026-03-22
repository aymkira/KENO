// ============================================================
//  AYMAN-FCA v2.0 — Smart Headers + Random User-Agent
//  © 2025 Ayman. All Rights Reserved.
//  مستوحى من: ws3-fca | مطوَّر بالكامل بواسطة أيمن
//
//  السر الأول لاستمرارية الجلسة:
//  كل request يستخدم User-Agent مختلف لتجنب كشف البوت
// ============================================================
"use strict";

// Sanitize header value to remove invalid characters
function sanitizeHeaderValue(value) {
  if (value === null || value === undefined) return "";
  let str = String(value);

  // Remove array-like strings (e.g., "["performAutoLogin"]")
  // This handles cases where arrays were accidentally stringified
  if (str.trim().startsWith("[") && str.trim().endsWith("]")) {
    // Try to detect if it's a stringified array and remove it
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        // If it's an array, return empty string (invalid header value)
        return "";
      }
    } catch {
      // Not valid JSON, continue with normal sanitization
    }
  }

  // Remove invalid characters for HTTP headers:
  // - Control characters (0x00-0x1F, except HTAB 0x09)
  // - DEL character (0x7F)
  // - Newlines and carriage returns
  // - Square brackets (often indicate array stringification issues)
  str = str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F\r\n\[\]]/g, "").trim();

  return str;
}

// Sanitize header name to ensure it's valid
function sanitizeHeaderName(name) {
  if (!name || typeof name !== "string") return "";
  // Remove invalid characters for HTTP header names
  return name.replace(/[^\x21-\x7E]/g, "").trim();
}

function getHeaders(url, options, ctx, customHeader) {
  // ── استخدم stealth engine لو موجود ────────────────────
  try {
    const stealth = require("../../func/stealth");
    if (ctx) {
      const stealthHeaders = stealth.buildApiHeaders(url, ctx);
      // دمج مع customHeader
      if (customHeader && typeof customHeader === "object") {
        for (const [key, value] of Object.entries(customHeader)) {
          if (value && typeof value !== "object" && typeof value !== "function") {
            stealthHeaders[sanitizeHeaderName(key)] = sanitizeHeaderValue(String(value));
          }
        }
      }
      return stealthHeaders;
    }
  } catch (_) {}

  const u = new URL(url);
  const ua = options?.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
  const referer = options?.referer || "https://www.facebook.com/";
  const origin = referer.replace(/\/+$/, "");
  const contentType = options?.contentType || "application/x-www-form-urlencoded";
  const acceptLang = options?.acceptLanguage || "ar,en-US;q=0.9,en;q=0.8";
  const headers = {
    Host: sanitizeHeaderValue(u.host),
    Origin: sanitizeHeaderValue(origin),
    Referer: sanitizeHeaderValue(referer),
    "User-Agent": sanitizeHeaderValue(ua),
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
    "Accept-Language": sanitizeHeaderValue(acceptLang),
    "Accept-Encoding": "gzip, deflate, br",
    "Content-Type": sanitizeHeaderValue(contentType),
    Connection: "keep-alive",
    DNT: "1",
    "Upgrade-Insecure-Requests": "1",
    "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"139\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-ch-ua-arch": "\"x86\"",
    "sec-ch-ua-bitness": "\"64\"",
    "sec-ch-ua-full-version-list": "\"Chromium\";v=\"139.0.0.0\", \"Not;A=Brand\";v=\"24.0.0.0\", \"Google Chrome\";v=\"139.0.0.0\"",
    "sec-ch-ua-platform-version": "\"15.0.0\"",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "X-Requested-With": "XMLHttpRequest",
    Pragma: "no-cache",
    "Cache-Control": "no-cache"
  };
  if (ctx?.region) {
    const regionValue = sanitizeHeaderValue(ctx.region);
    if (regionValue) headers["X-MSGR-Region"] = regionValue;
  }
  if (customHeader && typeof customHeader === "object") {
    // Filter customHeader to only include valid HTTP header values (strings, numbers, booleans)
    // Exclude functions, objects, arrays, and other non-serializable values
    for (const [key, value] of Object.entries(customHeader)) {
      // Skip null, undefined, functions, objects, and arrays
      if (value === null || value === undefined || typeof value === "function") {
        continue;
      }
      if (typeof value === "object") {
        // Arrays are objects in JavaScript, so check for arrays explicitly
        if (Array.isArray(value)) {
          continue;
        }
        // Skip plain objects (but allow null which is already handled above)
        continue;
      }
      // Only allow strings, numbers, and booleans - convert to string and sanitize
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        const sanitizedKey = sanitizeHeaderName(key);
        const sanitizedValue = sanitizeHeaderValue(value);
        if (sanitizedKey && sanitizedValue !== "") {
          headers[sanitizedKey] = sanitizedValue;
        }
      }
    }
  }
  // Final pass: sanitize all header values to ensure no invalid characters
  const sanitizedHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    const sanitizedKey = sanitizeHeaderName(key);
    const sanitizedValue = sanitizeHeaderValue(value);
    if (sanitizedKey && sanitizedValue !== "") {
      sanitizedHeaders[sanitizedKey] = sanitizedValue;
    }
  }
  return sanitizedHeaders;
}

module.exports = { getHeaders };

  return {
    userAgent,
    secChUa,
    secChUaPlatform:        `"${platform.platform}"`,
    secChUaPlatformVersion: platform.version,
    secChUaMobile:          "?0"
  };
}

// ✅ Headers شاملة تُحاكي المتصفح الحقيقي
function getHeaders(url, options, ctx, customHeader) {
  let host;
  try { host = new URL(url).hostname; } catch { host = "www.facebook.com"; }

  const { userAgent, secChUa, secChUaPlatform, secChUaPlatformVersion, secChUaMobile }
    = randomUserAgent();

  const ua = options?.userAgent || ctx?.globalOptions?.userAgent || userAgent;

  const headers = {
    "Accept":                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding":           "gzip, deflate, br",
    "Accept-Language":           "ar,en-US;q=0.9,en;q=0.8",
    "Cache-Control":             "max-age=0",
    "Connection":                "keep-alive",
    "Content-Type":              "application/x-www-form-urlencoded",
    "Host":                      host,
    "Origin":                    `https://${host}`,
    "Referer":                   `https://${host}/`,
    "Sec-Ch-Ua":                 secChUa,
    "Sec-Ch-Ua-Mobile":          secChUaMobile,
    "Sec-Ch-Ua-Platform":        secChUaPlatform,
    "Sec-Ch-Ua-Platform-Version": secChUaPlatformVersion,
    "Sec-Fetch-Dest":            "document",
    "Sec-Fetch-Mode":            "navigate",
    "Sec-Fetch-Site":            "same-origin",
    "Sec-Fetch-User":            "?1",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent":                ua,
    "Viewport-Width":            "1920",
    "Dpr":                       "1"
  };

  // ✅ إضافة رؤوس المنطقة لتسريع الاتصال
  if (ctx?.region) {
    headers["X-MSGR-Region"] = ctx.region;
  }

  // ✅ merge custom headers
  if (customHeader && typeof customHeader === "object") {
    for (const [k, v] of Object.entries(customHeader)) {
      if (k !== "noRef") headers[k] = v;
    }
    if (customHeader.noRef) delete headers["Referer"];
  }

  return headers;
}

module.exports = { getHeaders, randomUserAgent };
