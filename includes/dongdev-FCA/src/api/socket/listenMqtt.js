// ============================================================
//  AYMAN-FCA v2.0 — Listen MQTT (Entry Point)
//  © 2025 Ayman. All Rights Reserved.
//
//  🔑 أسرار الاستمرارية:
//  • Cycle عشوائي بين 26-60 دقيقة (يخدع Facebook)
//  • UUID جديد لكل cycle
//  • Middleware system للفلترة
//  • تنظيف كامل للذاكرة عند الإيقاف
//  • Guardian System — مضاد تسجيل الخروج
//  • Stealth Engine — تمويه كامل
// ============================================================
"use strict";

const mqtt            = require("mqtt");
const WebSocket       = require("ws");
const HttpsProxyAgent = require("https-proxy-agent");
const EventEmitter    = require("events");
const logger          = require("../../../func/logger");
const { parseAndCheckLogin }      = require("../../utils/client");
const { buildProxy, buildStream } = require("./detail/buildStream");
const { topics }                  = require("./detail/constants");
const createParseDelta            = require("./core/parseDelta");
const createListenMqtt            = require("./core/connectMqtt");
const createGetSeqID              = require("./core/getSeqID");
const getTaskResponseData         = require("./core/getTaskResponseData");
const createEmitAuth              = require("./core/emitAuth");
const createMiddlewareSystem      = require("./middleware");

// ── تحميل Stealth و Guardian بأمان ─────────────────────────
let stealth  = null;
let Guardian = null;
try { stealth  = require("../../../func/stealth");  } catch (_) {}
try { Guardian = require("../../../func/guardian"); } catch (_) {}

// ✅ وقت cycle عشوائي بين 26-60 دقيقة
function getRandomCycleMs() {
  const min = 26 * 60 * 1000;
  const max = 60 * 60 * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const RECONNECT_DEFAULT = 3000;
const UNSUB_TIMEOUT     = 5000;

const parseDelta      = createParseDelta({ parseAndCheckLogin });
const emitAuth        = createEmitAuth({ logger });
const listenMqttCore  = createListenMqtt({ WebSocket, mqtt, HttpsProxyAgent, buildStream, buildProxy, topics, parseDelta, getTaskResponseData, logger, emitAuth });
const getSeqIDFactory = createGetSeqID({ parseAndCheckLogin, listenMqtt: listenMqttCore, logger, emitAuth });

const MQTT_DEFAULTS = { reconnectDelayMs: RECONNECT_DEFAULT, autoReconnect: true, reconnectAfterStop: false };

function mqttConf(ctx, overrides) {
  ctx._mqttOpt = Object.assign({}, MQTT_DEFAULTS, ctx._mqttOpt || {}, overrides || {});
  if (typeof ctx._mqttOpt.autoReconnect === "boolean")
    ctx.globalOptions.autoReconnect = ctx._mqttOpt.autoReconnect;
  return ctx._mqttOpt;
}

module.exports = function(defaultFuncs, api, ctx, opts) {
  const noop = () => {};
  let globalCallback = noop;

  if (!ctx._middleware) ctx._middleware = createMiddlewareSystem();
  const mw = ctx._middleware;

  // ✅ تشغيل Stealth Engine
  if (stealth) {
    try { stealth.startBrowserRotation(ctx, 8); } catch (_) {}
  }

  // ✅ تشغيل Guardian System
  function startGuardian() {
    if (!Guardian || ctx._guardian) return;
    try {
      const path = require("path");
      const appStatePath = path.join(process.cwd(), global.config?.APPSTATEPATH || "appstate.json");
      ctx._guardian = new Guardian(ctx, api, defaultFuncs, appStatePath);
      ctx._guardian.start();
    } catch (e) {
      logger(`Guardian init error: ${e.message}`, "warn");
    }
  }

  // ✅ Post Guard — يكشف انتهاء الجلسة أثناء الإرسال
  function installPostGuard() {
    if (ctx._postGuarded) return;
    const rawPost = defaultFuncs.post?.bind(defaultFuncs);
    if (!rawPost) return;
    defaultFuncs.post = function postSafe(...args) {
      return rawPost(...args).catch(err => {
        const msg = err?.error || err?.message || String(err || "");
        if (/Not logged in|blocked the login/i.test(msg)) {
          emitAuth(ctx, api, globalCallback, /blocked/i.test(msg) ? "login_blocked" : "not_logged_in", msg);
        }
        throw err;
      });
    };
    ctx._postGuarded = true;
  }

  let conf = mqttConf(ctx, opts);

  function getSeqIDWrapper() {
    if (ctx._ending && !ctx._cycling) return Promise.resolve();
    const form = {
      av: ctx.globalOptions?.pageID,
      queries: JSON.stringify({
        o0: {
          doc_id: "3336396659757871",
          query_params: { limit: 1, before: null, tags: ["INBOX"], includeDeliveryReceipts: false, includeSeqID: true }
        }
      })
    };
    logger("[ AYMAN ] MQTT جلب SeqID...", "info");
    return getSeqIDFactory(defaultFuncs, api, ctx, globalCallback, form)
      .then(() => { ctx._cycling = false; })
      .catch(() => {
        ctx._cycling = false;
        if (ctx._ending) return;
        if (ctx.globalOptions?.autoReconnect !== false) {
          setTimeout(() => { if (!ctx._ending) getSeqIDWrapper(); }, conf.reconnectDelayMs);
        }
      });
  }

  const isConnected = () => !!(ctx.mqttClient?.connected);

  function unsubAll(cb) {
    if (!isConnected()) { if (cb) setTimeout(cb, 0); return; }
    let pending = topics.length;
    if (!pending) { if (cb) setTimeout(cb, 0); return; }
    let fired = false;
    const t = setTimeout(() => { if (!fired) { fired = true; if (cb) cb(); } }, UNSUB_TIMEOUT);
    topics.forEach(topic => {
      try {
        ctx.mqttClient.unsubscribe(topic, () => {
          if (--pending === 0 && !fired) { clearTimeout(t); fired = true; if (cb) cb(); }
        });
      } catch (_) {
        if (--pending === 0 && !fired) { clearTimeout(t); fired = true; if (cb) cb(); }
      }
    });
  }

  function endQuietly(next) {
    const finish = () => {
      // ✅ إيقاف Guardian
      if (ctx._guardian) {
        try { ctx._guardian.stop(); } catch (_) {}
        ctx._guardian = null;
      }
      // ✅ تنظيف Stealth
      if (stealth) {
        try { stealth.clearStealthTimers(ctx); } catch (_) {}
      }

      try { if (ctx.mqttClient) ctx.mqttClient.removeAllListeners(); } catch (_) {}
      ctx.mqttClient          = undefined;
      ctx.lastSeqId           = null;
      ctx.syncToken           = undefined;
      ctx.t_mqttCalled        = false;
      ctx._ending             = false;
      ctx._cycling            = false;
      ctx._reconnectAttempts  = 0;
      delete process.env.AymanFcaOnline;

      if (ctx._reconnectTimer) { clearTimeout(ctx._reconnectTimer); ctx._reconnectTimer = null; }
      if (ctx._rTimeout)       { clearTimeout(ctx._rTimeout);       ctx._rTimeout = null; }
      if (ctx.tasks instanceof Map) ctx.tasks.clear();
      (ctx._autoSaveInterval || []).forEach(i => { try { clearInterval(i); } catch (_) {} });
      ctx._autoSaveInterval = [];
      if (ctx._scheduler && typeof ctx._scheduler.destroy === "function") {
        try { ctx._scheduler.destroy(); } catch (_) {}
        ctx._scheduler = undefined;
      }
      if (ctx._sessionKeeper) { try { ctx._sessionKeeper.stop(); } catch (_) {} }
      if (next) next();
    };
    try {
      if (ctx.mqttClient) {
        if (isConnected()) { try { ctx.mqttClient.publish("/browser_close", "{}", { qos: 0 }); } catch (_) {} }
        ctx.mqttClient.end(true, finish);
      } else finish();
    } catch (_) { finish(); }
  }

  function delayedReconnect() {
    setTimeout(() => getSeqIDWrapper(), conf.reconnectDelayMs);
  }

  // ✅ Force cycle مع UUID جديد
  function forceCycle() {
    if (ctx._cycling) return;
    ctx._cycling = true;
    ctx._ending  = true;
    ctx.clientId = generateUUID();
    // ✅ حفظ AppState قبل الـ cycle
    if (ctx._guardian) { try { ctx._guardian._saveAppState(); } catch (_) {} }
    logger("[ AYMAN ] MQTT cycle — تجديد بـ UUID جديد 🔄", "warn");
    unsubAll(() => endQuietly(() => {
      startGuardian();
      delayedReconnect();
    }));
  }

  return function(callback) {
    var MessageEmitter = (function(_EventEmitter) {
      function MessageEmitter() { _EventEmitter.call(this); }
      MessageEmitter.prototype = Object.create(_EventEmitter.prototype);
      MessageEmitter.prototype.constructor = MessageEmitter;
      MessageEmitter.prototype.stopListening = function(cb2) {
        var cb = cb2 || noop;
        globalCallback = noop;
        if (ctx._autoCycleTimer) { clearTimeout(ctx._autoCycleTimer); ctx._autoCycleTimer = null; }
        if (ctx._reconnectTimer) { clearTimeout(ctx._reconnectTimer); ctx._reconnectTimer = null; }
        ctx._ending = true;
        if (ctx._guardian) { try { ctx._guardian._saveAppState(); } catch (_) {} }
        if (ctx._sessionKeeper) { try { ctx._sessionKeeper.saveNow(); } catch (_) {} }
        unsubAll(() => endQuietly(() => {
          logger("[ AYMAN ] MQTT توقف ✅", "info");
          cb();
          conf = mqttConf(ctx, conf);
          if (conf.reconnectAfterStop) delayedReconnect();
        }));
      };
      MessageEmitter.prototype.stopListeningAsync = function() {
        var self = this;
        return new Promise(function(resolve) { self.stopListening(resolve); });
      };
      return MessageEmitter;
    }(EventEmitter));

    var msgEmitter = new MessageEmitter();
    var origCb = callback || function(error, message) {
      if (error) { logger("[ AYMAN ] MQTT خطأ في الرسالة", "error"); return msgEmitter.emit("error", error); }
      msgEmitter.emit("message", message);
    };

    globalCallback = mw.count > 0 ? mw.wrapCallback(origCb) : origCb;
    conf = mqttConf(ctx, conf);
    installPostGuard();

    // ✅ تشغيل Guardian بعد الاتصال
    startGuardian();

    if (!ctx.firstListen) ctx.lastSeqId = null;
    ctx.syncToken    = undefined;
    ctx.t_mqttCalled = false;

    // ✅ Cycle عشوائي بين 26-60 دقيقة
    if (ctx._autoCycleTimer) { clearTimeout(ctx._autoCycleTimer); ctx._autoCycleTimer = null; }
    function scheduleCycle() {
      var ms = getRandomCycleMs();
      logger("[ AYMAN ] MQTT cycle قادم بعد " + Math.round(ms / 60000) + " دقيقة ⏱", "info");
      ctx._autoCycleTimer = setTimeout(function() { forceCycle(); scheduleCycle(); }, ms);
    }
    scheduleCycle();

    if (!ctx.firstListen || !ctx.lastSeqId) getSeqIDWrapper();
    else listenMqttCore(defaultFuncs, api, ctx, globalCallback);

    api.stopListening      = msgEmitter.stopListening.bind(msgEmitter);
    api.stopListeningAsync = msgEmitter.stopListeningAsync.bind(msgEmitter);

    // Middleware API
    var curOrig = origCb, curGlobal = globalCallback;
    function rewrap() {
      if (!ctx.mqttClient || ctx._ending) return;
      var has = mw.count > 0, wrapped = curGlobal !== curOrig;
      if (has && !wrapped)      { curGlobal = mw.wrapCallback(curOrig); globalCallback = curGlobal; }
      else if (!has && wrapped) { curGlobal = curOrig; globalCallback = curGlobal; }
    }

    api.useMiddleware        = function(fn, f) { var r = mw.use(fn, f);       rewrap(); return r; };
    api.removeMiddleware     = function(id)    { var r = mw.remove(id);        rewrap(); return r; };
    api.clearMiddleware      = function()      { var r = mw.clear();           rewrap(); return r; };
    api.listMiddleware       = function()      { return mw.list(); };
    api.setMiddlewareEnabled = function(n, e)  { var r = mw.setEnabled(n, e); rewrap(); return r; };

    var desc = Object.getOwnPropertyDescriptor(api, "middlewareCount");
    if (!desc || desc.configurable) {
      Object.defineProperty(api, "middlewareCount", {
        configurable: true, enumerable: false,
        get: function() { return (ctx._middleware && ctx._middleware.count) || 0; }
      });
    }

    return msgEmitter;
  };
};
