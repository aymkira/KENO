// ============================================================
//  AYMAN-FCA v2.0 — Listen MQTT (Entry Point)
//  © 2025 Ayman. All Rights Reserved.
//
//  🔑 أسرار الاستمرارية:
//  • Cycle عشوائي بين 26-60 دقيقة (يخدع Facebook)
//  • UUID جديد لكل cycle
//  • Middleware system للفلترة
//  • تنظيف كامل للذاكرة عند الإيقاف
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

// ✅ من ws3: وقت cycle عشوائي بين 26-60 دقيقة
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

const RECONNECT_DEFAULT  = 3000;
const UNSUB_TIMEOUT      = 5000;

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
      .catch(e => {
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
    const t = setTimeout(() => { if (!fired) { fired = true; cb?.(); } }, UNSUB_TIMEOUT);
    topics.forEach(topic => {
      try {
        ctx.mqttClient.unsubscribe(topic, () => {
          if (--pending === 0 && !fired) { clearTimeout(t); fired = true; cb?.(); }
        });
      } catch {
        if (--pending === 0 && !fired) { clearTimeout(t); fired = true; cb?.(); }
      }
    });
  }

  function endQuietly(next) {
    const finish = () => {
      try { ctx.mqttClient?.removeAllListeners(); } catch (_) {}
      ctx.mqttClient          = undefined;
      ctx.lastSeqId           = null;
      ctx.syncToken           = undefined;
      ctx.t_mqttCalled        = false;
      ctx._ending             = false;
      ctx._cycling            = false;
      ctx._reconnectAttempts  = 0;
      delete process.env.AymanFcaOnline;

      if (ctx._reconnectTimer) { clearTimeout(ctx._reconnectTimer);  ctx._reconnectTimer = null; }
      if (ctx._rTimeout)       { clearTimeout(ctx._rTimeout);        ctx._rTimeout = null; }
      if (ctx.tasks instanceof Map) ctx.tasks.clear();
      (ctx._autoSaveInterval || []).forEach(i => { try { clearInterval(i); } catch (_) {} });
      ctx._autoSaveInterval = [];
      if (ctx._scheduler?.destroy) { try { ctx._scheduler.destroy(); } catch (_) {} ctx._scheduler = undefined; }
      if (ctx._sessionKeeper) { try { ctx._sessionKeeper.stop(); } catch (_) {} }
      next?.();
    };
    try {
      if (ctx.mqttClient) {
        if (isConnected()) { try { ctx.mqttClient.publish("/browser_close", "{}", { qos: 0 }); } catch (_) {} }
        ctx.mqttClient.end(true, finish);
      } else finish();
    } catch (_) { finish(); }
  }

  const delayedReconnect = () => setTimeout(() => getSeqIDWrapper(), conf.reconnectDelayMs);

  // ✅ Force cycle مع UUID جديد
  function forceCycle() {
    if (ctx._cycling) return;
    ctx._cycling = true;
    ctx._ending  = true;
    ctx.clientId = generateUUID();
    logger("[ AYMAN ] MQTT cycle — تجديد بـ UUID جديد", "warn");
    unsubAll(() => endQuietly(() => delayedReconnect()));
  }

  return function(callback) {
    class MessageEmitter extends EventEmitter {
      stopListening(cb2) {
        const cb = cb2 || noop;
        globalCallback = noop;
        if (ctx._autoCycleTimer) { clearTimeout(ctx._autoCycleTimer); ctx._autoCycleTimer = null; }
        if (ctx._reconnectTimer) { clearTimeout(ctx._reconnectTimer); ctx._reconnectTimer = null; }
        ctx._ending = true;
        // ✅ حفظ AppState عند الإيقاف
        try { if (ctx._sessionKeeper) ctx._sessionKeeper.saveNow(); } catch (_) {}
        unsubAll(() => endQuietly(() => {
          logger("[ AYMAN ] MQTT توقف ✅", "info");
          cb();
          conf = mqttConf(ctx, conf);
          if (conf.reconnectAfterStop) delayedReconnect();
        }));
      }
      async stopListeningAsync() {
        return new Promise(resolve => this.stopListening(resolve));
      }
    }

    const msgEmitter = new MessageEmitter();
    const origCb = callback || function(error, message) {
      if (error) { logger("[ AYMAN ] MQTT خطأ في الرسالة", "error"); return msgEmitter.emit("error", error); }
      msgEmitter.emit("message", message);
    };

    globalCallback = mw.count > 0 ? mw.wrapCallback(origCb) : origCb;
    conf = mqttConf(ctx, conf);
    installPostGuard();

    if (!ctx.firstListen) ctx.lastSeqId = null;
    ctx.syncToken    = undefined;
    ctx.t_mqttCalled = false;

    // ✅ Cycle عشوائي بين 26-60 دقيقة
    if (ctx._autoCycleTimer) { clearTimeout(ctx._autoCycleTimer); ctx._autoCycleTimer = null; }
    function scheduleCycle() {
      const ms = getRandomCycleMs();
      logger(`[ AYMAN ] MQTT cycle جديد بعد ${Math.round(ms / 60000)} دقيقة`, "info");
      ctx._autoCycleTimer = setTimeout(() => { forceCycle(); scheduleCycle(); }, ms);
    }
    scheduleCycle();

    if (!ctx.firstListen || !ctx.lastSeqId) getSeqIDWrapper();
    else listenMqttCore(defaultFuncs, api, ctx, globalCallback);

    api.stopListening      = msgEmitter.stopListening.bind(msgEmitter);
    api.stopListeningAsync = msgEmitter.stopListeningAsync.bind(msgEmitter);

    // Middleware API
    let curOrig = origCb, curGlobal = globalCallback;
    const rewrap = () => {
      if (!ctx.mqttClient || ctx._ending) return;
      const has = mw.count > 0, wrapped = curGlobal !== curOrig;
      if (has && !wrapped)       { curGlobal = mw.wrapCallback(curOrig); globalCallback = curGlobal; }
      else if (!has && wrapped)  { curGlobal = curOrig; globalCallback = curGlobal; }
    };

    api.useMiddleware        = (fn, f) => { const r = mw.use(fn, f);          rewrap(); return r; };
    api.removeMiddleware     = id      => { const r = mw.remove(id);           rewrap(); return r; };
    api.clearMiddleware      = ()      => { const r = mw.clear();              rewrap(); return r; };
    api.listMiddleware       = ()      => mw.list();
    api.setMiddlewareEnabled = (n, e)  => { const r = mw.setEnabled(n, e);    rewrap(); return r; };

    const desc = Object.getOwnPropertyDescriptor(api, "middlewareCount");
    if (!desc || desc.configurable) {
      Object.defineProperty(api, "middlewareCount", {
        configurable: true, enumerable: false,
        get: () => (ctx._middleware?.count) || 0
      });
    }

    return msgEmitter;
  };
};
