// ============================================================
//  AYMAN-FCA — Request Config
//  مكتبة KIRA بوت | المطور: Ayman
//  تحسين: timeout أسرع + ضغط تلقائي
// ============================================================
"use strict";

const { sanitizeHeaders } = require("./sanitize");
const { jar, client, httpsAgent, httpAgent } = require("./client");

function cfg(base = {}) {
  const { reqJar, headers, params, agent, timeout } = base;
  return {
    headers: sanitizeHeaders(headers),
    params,
    jar: reqJar || jar,
    withCredentials: true,
    // ✅ 30 ثانية بدل 60 — كشف أسرع للمشاكل
    timeout: timeout || 30000,
    httpAgent: agent || httpAgent,
    httpsAgent: agent || httpsAgent,
    proxy: false,
    validateStatus: (s) => s >= 200 && s < 600,
    // ✅ ضغط تلقائي
    decompress: true
  };
}

module.exports = { cfg };
