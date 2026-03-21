// ============================================================
//  AYMAN-FCA — HTTP Client
//  مكتبة KIRA بوت | المطور: Ayman
//  تحسين: timeout أسرع + keep-alive + connection pooling
// ============================================================
"use strict";

const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const http = require("http");
const https = require("https");

const jar = new CookieJar();

// ✅ HTTP Agents مع Keep-Alive — يقلل وقت إنشاء الاتصال بشكل كبير
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 30000
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 30000,
  rejectUnauthorized: false // يتجنب مشاكل SSL على بعض البيئات
});

const client = wrapper(
  axios.create({
    jar,
    withCredentials: true,
    // ✅ 30 ثانية بدل 60 — أسرع كشف للانقطاع
    timeout: 30000,
    validateStatus: (s) => s >= 200 && s < 600,
    maxRedirects: 5,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    httpAgent,
    httpsAgent,
    // ✅ ضغط تلقائي للاستجابات
    decompress: true
  })
);

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = {
  jar,
  client,
  delay,
  httpAgent,
  httpsAgent
};
