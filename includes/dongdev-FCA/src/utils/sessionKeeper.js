// ============================================================
//  AYMAN-FCA v2.1 — Session Keeper (Enhanced)
//  © 2025 Ayman. All Rights Reserved.
//
//  تقنيات إضافية لتمديد الجلسة:
//  1. Presence كل 45 ثانية
//  2. تجديد fb_dtsg كل 6 ساعات
//  3. Accessibility cookie كل 30 دقيقة
//  4. نشاط عشوائي كل 3-7 دقائق
//  5. حفظ AppState atomic كل 8 دقائق
//  6. تجديد xs cookie (أهم cookie في الجلسة)
//  7. ping خفيف لـ Facebook كل ساعة
//  8. تحديث lastActive timestamp
// ============================================================
"use strict";

const fs   = require("fs");
const path = require("path");

let logger;
try {
  logger = require("../../../func/logger");
} catch(_) {
  logger = (msg, type) => process.stderr.write(`[ AYMAN ][ ${type || "info"} ] > ${msg}\n`);
}

// ── Presence Encoder ────────────────────────────────────────────
const PRESENCE_MAP = {
  _:"%", A:"%2", B:"000", C:"%7d", D:"%7b%22", E:"%2c%22",
  F:"%22%3a", G:"%2c%22ut%22%3a1", H:"%2c%22bls%22%3a",
  I:"%2c%22n%22%3a%22%", J:"%22%3a%7b%22i%22%3a0%7d",
  K:"%2c%22pt%22%3a0%2c%22vis%22%3a", L:"%2c%22ch%22%3a%7b%22h%22%3a%22",
  M:"%7b%22v%22%3a2%2c%22time%22%3a1", N:".channel%22%2c%22sub%22%3a%5b",
  O:"%2c%22sb%22%3a1%2c%22t%22%3a%5b", P:"%2c%22ud%22%3a100%2c%22lc%22%3a0",
  Q:"%5d%2c%22f%22%3anull%2c%22uct%22%3a", R:".channel%22%2c%22sub%22%3a%5b1%5d",
  Z:"%2c%22sb%22%3a1%2c%22t%22%3a%5b%5d%2c%22f%22%3anull%2c%22uct%22%3a0%2c%22s%22%3a0%2c%22blo%22%3a0%7d%2c%22bl%22%3a%7b%22ac%22%3a"
};
const encodeMap  = {};
const decodeList = [];
for (const [k, v] of Object.entries(PRESENCE_MAP)) {
  encodeMap[v] = k;
  decodeList.push(v);
}
decodeList.sort((a, b) => b.length - a.length);
const presenceRegex = new RegExp(
  decodeList.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g"
);
function presenceEncode(str) {
  return encodeURIComponent(str).replace(presenceRegex, m => encodeMap[m] || m);
}

// ── توليد Presence حقيقي ────────────────────────────────────────
function generatePresence(userID) {
  const time = Date.now();
  return "E" + presenceEncode(JSON.stringify({
    v: 3,
    time: Math.floor(time / 1000),
    user: userID,
    state: {
      ut: 0, t2: [], lm2: null, uct2: time, tr: null,
      tw: Math.floor(Math.random() * 4294967295) + 1,
      at: time
    },
    ch: { [`p_${userID}`]: 0 }
  }));
}

// ── Accessibility Cookie ─────────────────────────────────────────
function generateAccessibilityCookie() {
  const time = Date.now();
  return encodeURIComponent(JSON.stringify({
    sr: 0, "sr-ts": time, jk: 0, "jk-ts": time,
    kb: 0, "kb-ts": time, hcm: 0, "hcm-ts": time
  }));
}

// ── Atomic AppState Save ─────────────────────────────────────────
function saveAppStateAtomic(statePath, state) {
  try {
    const tmp = statePath + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(state, null, "\t"), "utf8");
    fs.renameSync(tmp, statePath);
    return true;
  } catch (e) {
    logger(`خطأ في حفظ AppState: ${e?.message || e}`, "error");
    return false;
  }
}

// ── ضبط Cookie في الـ jar ────────────────────────────────────────
function setCookieSafe(jar, cookieStr, url) {
  try {
    if (typeof jar?.setCookieSync === "function")
      jar.setCookieSync(cookieStr, url);
    else if (typeof jar?.setCookie === "function")
      jar.setCookie(cookieStr, url);
  } catch(_) {}
}

// ────────────────────────────────────────────────────────────────
//  createSessionKeeper — النظام الرئيسي
// ────────────────────────────────────────────────────────────────
function createSessionKeeper(api, ctx, options = {}) {
  const appStatePath = options.appStatePath || path.join(process.cwd(), "appstate.json");
  const onSave       = typeof options.onSave === "function" ? options.onSave : null;

  let _presence   = null;
  let _activity   = null;
  let _dtsg       = null;
  let _save       = null;
  let _access     = null;
  let _ping       = null;
  let _xsRefresh  = null;
  let _active     = false;
  let _lastHash   = null;

  // ① Presence كل 45 ثانية
  function startPresence() {
    if (_presence) return;
    _presence = setInterval(() => {
      try {
        if (!ctx?.mqttClient?.connected) return;
        const p = generatePresence(ctx.userID);
        ctx.mqttClient.publish(
          "/orca_presence",
          JSON.stringify({ p, c: ctx.userID }),
          { qos: 0 }
        );
      } catch(_) {}
    }, 45 * 1000);
  }

  // ② نشاط عشوائي كل 3-7 دقائق
  function scheduleActivity() {
    const ms = (3 + Math.random() * 4) * 60 * 1000;
    _activity = setTimeout(async () => {
      try {
        // تناوب بين نوعين من النشاط
        if (Math.random() > 0.5) {
          if (api?.markAsReadAll) api.markAsReadAll(() => {});
        } else {
          // publish foreground state — يُقنع Facebook أن المستخدم نشط
          if (ctx?.mqttClient?.connected) {
            ctx.mqttClient.publish(
              "/foreground_state",
              JSON.stringify({ foreground: true }),
              { qos: 0 }
            );
          }
        }
      } catch(_) {}
      scheduleActivity();
    }, ms);
  }

  // ③ تجديد fb_dtsg كل 6 ساعات
  function startDtsgRefresh() {
    if (_dtsg) return;
    _dtsg = setInterval(async () => {
      try {
        if (api?.refreshFb_dtsg) {
          await api.refreshFb_dtsg();
          logger("fb_dtsg مجدد ✅", "info");
        }
      } catch(_) {}
    }, 6 * 60 * 60 * 1000);
  }

  // ④ حفظ AppState كل 8 دقائق
  function startAutoSave() {
    if (_save) return;
    _save = setInterval(() => {
      try {
        if (!api?.getAppState) return;
        const state = api.getAppState();
        if (!state || state.length === 0) return;

        const hash = state.length + "_" + (state[0]?.value?.length || 0);
        if (hash === _lastHash) return;
        _lastHash = hash;

        const ok = saveAppStateAtomic(appStatePath, state);
        if (ok) {
          logger("AppState محفوظ ✅", "info");
          if (onSave) onSave(state);
        }
      } catch(_) {}
    }, 8 * 60 * 1000);
  }

  // ⑤ Accessibility cookie كل 30 دقيقة
  function startAccessibilityCookie() {
    if (_access) return;
    function update() {
      try {
        const val = generateAccessibilityCookie();
        const exp = new Date(Date.now() + 365 * 24 * 3600 * 1000).toUTCString();
        const str = `wd=${val}; domain=.facebook.com; path=/; expires=${exp}`;
        if (ctx?.jar) setCookieSafe(ctx.jar, str, "https://www.facebook.com");
      } catch(_) {}
    }
    update();
    _access = setInterval(update, 30 * 60 * 1000);
  }

  // ⑥ تجديد xs cookie كل 4 ساعات
  // xs هو أهم cookie في الجلسة — انتهاؤه = انتهاء الجلسة
  function startXsRefresh() {
    if (_xsRefresh) return;
    _xsRefresh = setInterval(async () => {
      try {
        if (!ctx?.jar) return;
        // جلب Facebook لتجديد xs تلقائياً
        const { get } = require("../request");
        const res = await get(
          "https://www.facebook.com/",
          ctx.jar, null,
          ctx.globalOptions || {},
          ctx
        );
        // حفظ أي cookies جديدة من الـ response
        const setCookies = res?.headers?.["set-cookie"] || [];
        for (const c of setCookies) {
          try {
            setCookieSafe(ctx.jar, c, "https://www.facebook.com");
          } catch(_) {}
        }
        logger("xs cookie مجدد ✅", "info");
      } catch(_) {}
    }, 4 * 60 * 60 * 1000);
  }

  // ⑦ Ping خفيف كل ساعة — يُبقي الـ TCP connection حياً
  function startPing() {
    if (_ping) return;
    _ping = setInterval(() => {
      try {
        if (!ctx?.mqttClient?.connected) return;
        // publish browser_active — إشارة نشاط لـ Facebook
        ctx.mqttClient.publish(
          "/set_client_settings",
          JSON.stringify({ make_user_available_when_in_foreground: true }),
          { qos: 0 }
        );
      } catch(_) {}
    }, 60 * 60 * 1000);
  }

  // ── تشغيل كل الأنظمة ────────────────────────────────────────
  function start() {
    if (_active) return;
    _active = true;
    startPresence();
    scheduleActivity();
    startDtsgRefresh();
    startAutoSave();
    startAccessibilityCookie();
    startXsRefresh();
    startPing();
    logger("Session Keeper مفعّل ✅ — 7 أنظمة تعمل", "info");
  }

  // ── إيقاف كل الأنظمة ────────────────────────────────────────
  function stop() {
    _active = false;
    [_presence, _dtsg, _save, _access, _xsRefresh, _ping].forEach(t => {
      try { if (t) clearInterval(t); } catch(_) {}
    });
    try { if (_activity) clearTimeout(_activity); } catch(_) {}
    _presence = _activity = _dtsg = _save = _access = _xsRefresh = _ping = null;
    logger("Session Keeper موقوف", "info");
  }

  // ── حفظ فوري ────────────────────────────────────────────────
  function saveNow() {
    try {
      if (!api?.getAppState) return false;
      const state = api.getAppState();
      if (!state || state.length === 0) return false;
      const ok = saveAppStateAtomic(appStatePath, state);
      if (ok && onSave) onSave(state);
      return ok;
    } catch(_) { return false; }
  }

  return { start, stop, saveNow, generatePresence, generateAccessibilityCookie };
}

module.exports = {
  createSessionKeeper,
  generatePresence,
  generateAccessibilityCookie,
  saveAppStateAtomic
};
