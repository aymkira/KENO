// ============================================================
//  AYMAN-FCA — HTTP Client
//  مكتبة KIRA بوت | المطور: Ayman
// ============================================================
"use strict";

const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");

const jar = new CookieJar();

// ✅ بدون httpAgent/httpsAgent مخصص — axios-cookiejar-support لا يدعمه
const client = wrapper(
  axios.create({
    jar,
    withCredentials: true,
    timeout: 30000,
    validateStatus: (s) => s >= 200 && s < 600,
    maxRedirects: 5,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    decompress: true
  })
);

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = {
  jar,
  client,
  delay
};
