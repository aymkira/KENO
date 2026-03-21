// ============================================================
//  AYMAN-FCA — Listen MQTT Entry
//  مكتبة KIRA بوت | المطور: Ayman
//  ميزات جديدة: cycle عشوائي من ws3 + UUID جديد كل cycle
// ============================================================
"use strict";

const mqtt            = require("mqtt");
const WebSocket       = require("ws");
const HttpsProxyAgent = require("https-proxy-agent");
const EventEmitter    = require("events");
const logger          = require("../../../func/logger");
const { parseAndCheckLogin }  = require("../../utils/client");
const { buildProxy, buildStream } = require("./detail/buildStream");
const { topics }      = require("./detail/constants");
const createParseDelta   = require("./core/parseDelta");
const createListenMqtt   = require("./core/connectMqtt");
const createGetSeqID     = require("./core/getSeqID");
const getTaskResponseData = require("./core/getTaskResponseData");
const createEmitAuth     = require("./core/emitAuth");
const createMiddlewareSystem = require("./middleware");

// ✅ من ws3: وقت cycle عشوائي بين 26-60 دقيقة
function getRandomCycleTime() {
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

const RECONNECT_DELAY_MS_DEFAULT = 3000;
const UNSUB_ALL_TIMEOUT_MS       = 5000;

const parseDelta      = createParseDelta({ parseAndCheckLogin });
const emitAuth        = createEmitAuth({ logger });
const listenMqtt      = createListenMqtt({ WebSocket, mqtt, HttpsProxyAgent, buildStream, buildProxy, topics, parseDelta, getTaskResponseData, logger, emitAuth });
const getSeqIDFactory = createGetSeqID({ parseAndCheckLogin, listenMqtt, logger, emitAuth });

const MQTT_DEFAULTS = {
  reconnectDelayMs: RECONNECT_DELAY_MS_DEFAULT,
  autoReconnect: true,
  reconnectAfterStop: false
};

function mqttConf(ctx, overrides) {
  ctx._mqttOpt = Object.assign({}, MQTT_DEFAULTS, ctx._mqttOpt || {}, overrides || {});
  if (typeof ctx._mqttOpt.autoReconnect === "boolean")
    ctx.globalOptions.autoReconnect = ctx._mqttOpt.autoReconnect;
  return ctx._mqttOpt;
}

module.exports = function (defaultFuncs, api, ctx, opts) {
  const identity = () => {};
  let globalCallback = identity;

  if (!ctx._middleware) ctx._middleware = createMiddlewareSystem();
  const middleware = ctx._middleware;

  function installPostGuard() {
    if (ctx._postGuarded) return;
    const rawPost = defaultFuncs.post?.bind(defaultFuncs);
    if (!rawPost) return;
    defaultFuncs.post = function postSafe(...args) {
      return rawPost(...args).catch(err => {
        const msg = (err?.error) || (err?.message) || String(err || "");
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
      av: ctx.globalOptions.pageID,
      queries: JSON.stringify({
        o0: {
          doc_id: "3336396659757871",
          query_params: { limit: 1, before: null, tags: ["INBOX"], includeDeliveryReceipts: false, includeSeqID: true }
        }
      })
    };
    logger("[ KIRA ] MQTT جلب SeqID...", "info");
    return getSeqIDFactory(defaultFuncs, api, ctx, globalCallback, form)
      .then(() => { logger("[ KIRA ] SeqID ✅", "info"); ctx._cycling = false; })
      .catch(e => {
        ctx._cycling = false;
        if (ctx._ending) return;
        if (ctx.globalOptions.autoReconnect) {
          const d = conf.reconnectDelayMs;
          setTimeout(() => { if (!ctx._ending) getSeqIDWrapper(); }, d);
        }
      });
  }

  function isConnected() {
    return !!(ctx.mqttClient?.connected);
  }

  function unsubAll(cb) {
    if (!isConnected()) { if (cb) setTimeout(cb, 0); return; }
    let pending = topics.length;
    if (!pending) { if (cb) setTimeout(cb, 0); return; }
    let fired = false;
    const timeout = setTimeout(() => { if (!fired) { fired = true; if (cb) cb(); } }, UNSUB_ALL_TIMEOUT_MS);
    topics.forEach(t => {
      try {
        ctx.mqttClient.unsubscribe(t, () => {
          if (--pending === 0 && !fired) { clearTimeout(timeout); fired = true; if (cb) cb(); }
        });
      } catch {
        if (--pending === 0 && !fired) { clearTimeout(timeout); fired = true; if (cb) cb(); }
      }
    });
  }

  function endQuietly(next) {
    const finish = () => {
      try { ctx.mqttClient?.removeAllListeners(); } catch (_) {}
      ctx.mqttClient = undefined;
      ctx.lastSeqId = null;
      ctx.syncToken = undefined;
      ctx.t_mqttCalled = false;
      ctx._ending = false;
      ctx._cycling = false;
      ctx._reconnectAttempts = 0;
      if (ctx._reconnectTimer) { clearTimeout(ctx._reconnectTimer); ctx._reconnectTimer = null; }
      if (ctx._rTimeout)       { clearTimeout(ctx._rTimeout); ctx._rTimeout = null; }
      if (ctx.tasks instanceof Map) ctx.tasks.clear();
      (ctx._autoSaveInterval || []).forEach(i => { try { clearInterval(i); } catch (_) {} });
      ctx._autoSaveInterval = [];
      if (ctx._scheduler?.destroy) { try { ctx._scheduler.destroy(); } catch (_) {} ctx._scheduler = undefined; }
      next?.();
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

  function forceCycle() {
    if (ctx._cycling) return;
    ctx._cycling = true;
    ctx._ending  = true;
    // ✅ من ws3: clientID جديد عند كل cycle
    ctx.clientId = generateUUID();
    logger("[ KIRA ] MQTT cycle — تحديث الاتصال بـ UUID جديد", "warn");
    unsubAll(() => endQuietly(() => delayedReconnect()));
  }

  return function (callback) {
    class MessageEmitter extends EventEmitter {
      stopListening(cb2) {
        const cb = cb2 || (() => {});
        globalCallback = identity;
        if (ctx._autoCycleTimer) { clearTimeout(ctx._autoCycleTimer); ctx._autoCycleTimer = null; }
        if (ctx._reconnectTimer) { clearTimeout(ctx._reconnectTimer); ctx._reconnectTimer = null; }
        ctx._ending = true;
        unsubAll(() => endQuietly(() => {
          logger("[ KIRA ] MQTT توقف ✅", "info");
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
    const originalCallback = callback || function (error, message) {
      if (error) { logger("[ KIRA ] MQTT خطأ", "error"); return msgEmitter.emit("error", error); }
      msgEmitter.emit("message", message);
    };

    globalCallback = middleware.count > 0
      ? middleware.wrapCallback(originalCallback)
      : originalCallback;

    conf = mqttConf(ctx, conf);
    installPostGuard();

    if (!ctx.firstListen) ctx.lastSeqId = null;
    ctx.syncToken    = undefined;
    ctx.t_mqttCalled = false;

    // ✅ من ws3: جدول cycle بوقت عشوائي
    if (ctx._autoCycleTimer) { clearTimeout(ctx._autoCycleTimer); ctx._autoCycleTimer = null; }
    function scheduleCycle() {
      const cycleMs = getRandomCycleTime();
      logger(`[ KIRA ] MQTT cycle جديد بعد ${Math.round(cycleMs / 60000)} دقيقة`, "info");
      ctx._autoCycleTimer = setTimeout(() => {
        forceCycle();
        scheduleCycle();
      }, cycleMs);
    }
    scheduleCycle();

    if (!ctx.firstListen || !ctx.lastSeqId) getSeqIDWrapper();
    else listenMqtt(defaultFuncs, api, ctx, globalCallback);

    api.stopListening      = msgEmitter.stopListening.bind(msgEmitter);
    api.stopListeningAsync = msgEmitter.stopListeningAsync.bind(msgEmitter);

    let curOriginal = originalCallback;
    let curGlobal   = globalCallback;

    function rewrapIfNeeded() {
      if (!ctx.mqttClient || ctx._ending) return;
      const has     = middleware.count > 0;
      const wrapped = curGlobal !== curOriginal;
      if (has && !wrapped)       { curGlobal = middleware.wrapCallback(curOriginal); globalCallback = curGlobal; }
      else if (!has && wrapped)  { curGlobal = curOriginal; globalCallback = curGlobal; }
    }

    api.useMiddleware        = (fn, f) => { const r = middleware.use(fn, f); rewrapIfNeeded(); return r; };
    api.removeMiddleware     = id      => { const r = middleware.remove(id); rewrapIfNeeded(); return r; };
    api.clearMiddleware      = ()      => { const r = middleware.clear();    rewrapIfNeeded(); return r; };
    api.listMiddleware       = ()      => middleware.list();
    api.setMiddlewareEnabled = (n, e)  => { const r = middleware.setEnabled(n, e); rewrapIfNeeded(); return r; };

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
