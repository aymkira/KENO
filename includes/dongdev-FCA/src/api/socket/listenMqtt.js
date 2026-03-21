// ============================================================
//  AYMAN-FCA — MQTT Listen Entry
//  مكتبة KIRA بوت | المطور: Ayman
//  تحسين: cycle أذكى + reconnect أسرع
// ============================================================
"use strict";

const mqtt = require("mqtt");
const WebSocket = require("ws");
const HttpsProxyAgent = require("https-proxy-agent");
const EventEmitter = require("events");
const logger = require("../../../func/logger");
const { parseAndCheckLogin } = require("../../utils/client");
const { buildProxy, buildStream } = require("./detail/buildStream");
const { topics } = require("./detail/constants");
const createParseDelta = require("./core/parseDelta");
const createListenMqtt = require("./core/connectMqtt");
const createGetSeqID = require("./core/getSeqID");
const getTaskResponseData = require("./core/getTaskResponseData");
const createEmitAuth = require("./core/emitAuth");
const createMiddlewareSystem = require("./middleware");

// ✅ رفع cycle من ساعة إلى 3 ساعات — أقل استهلاكاً وأكثر استقراراً
const CYCLE_MS_DEFAULT = 3 * 60 * 60 * 1000;
// ✅ تقليل delay إعادة الاتصال
const RECONNECT_DELAY_MS_DEFAULT = 3000;
const UNSUB_ALL_TIMEOUT_MS = 5000;

const parseDelta = createParseDelta({ parseAndCheckLogin });
const emitAuth = createEmitAuth({ logger });
const listenMqtt = createListenMqtt({
  WebSocket, mqtt, HttpsProxyAgent, buildStream, buildProxy,
  topics, parseDelta, getTaskResponseData, logger, emitAuth
});
const getSeqIDFactory = createGetSeqID({
  parseAndCheckLogin, listenMqtt, logger, emitAuth
});

const MQTT_DEFAULTS = {
  cycleMs: CYCLE_MS_DEFAULT,
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
  const identity = function () {};
  let globalCallback = identity;

  if (!ctx._middleware) ctx._middleware = createMiddlewareSystem();
  const middleware = ctx._middleware;

  function installPostGuard() {
    if (ctx._postGuarded) return defaultFuncs.post;
    const rawPost = defaultFuncs.post?.bind(defaultFuncs);
    if (!rawPost) return defaultFuncs.post;

    function postSafe(...args) {
      return rawPost(...args).catch(err => {
        const msg = (err && err.error) || (err && err.message) || String(err || "");
        if (/Not logged in|blocked the login/i.test(msg)) {
          emitAuth(ctx, api, globalCallback,
            /blocked/i.test(msg) ? "login_blocked" : "not_logged_in",
            msg
          );
        }
        throw err;
      });
    }
    defaultFuncs.post = postSafe;
    ctx._postGuarded = true;
    return postSafe;
  }

  let conf = mqttConf(ctx, opts);

  function getSeqIDWrapper() {
    if (ctx._ending && !ctx._cycling) {
      logger("[ KIRA ] MQTT getSeqID تخطى — البوت يوقف", "warn");
      return Promise.resolve();
    }
    const form = {
      av: ctx.globalOptions.pageID,
      queries: JSON.stringify({
        o0: {
          doc_id: "3336396659757871",
          query_params: {
            limit: 1,
            before: null,
            tags: ["INBOX"],
            includeDeliveryReceipts: false,
            includeSeqID: true
          }
        }
      })
    };
    logger("[ KIRA ] MQTT يجلب SeqID...", "info");
    return getSeqIDFactory(defaultFuncs, api, ctx, globalCallback, form)
      .then(() => {
        logger("[ KIRA ] MQTT SeqID جاهز ✅", "info");
        ctx._cycling = false;
      })
      .catch(e => {
        ctx._cycling = false;
        const errMsg = e?.message || String(e || "");
        logger(`[ KIRA ] MQTT خطأ في جلب SeqID: ${errMsg}`, "error");
        if (ctx._ending) return;
        if (ctx.globalOptions.autoReconnect) {
          const d = conf.reconnectDelayMs;
          logger(`[ KIRA ] MQTT سيحاول SeqID مجدداً بعد ${d}ms`, "warn");
          setTimeout(() => { if (!ctx._ending) getSeqIDWrapper(); }, d);
        }
      });
  }

  function isConnected() {
    return !!(ctx.mqttClient && ctx.mqttClient.connected);
  }

  function unsubAll(cb) {
    if (!isConnected()) { if (cb) setTimeout(cb, 0); return; }
    let pending = topics.length;
    if (!pending) { if (cb) setTimeout(cb, 0); return; }
    let fired = false;
    const timeout = setTimeout(() => {
      if (!fired) { fired = true; if (cb) cb(); }
    }, UNSUB_ALL_TIMEOUT_MS);
    topics.forEach(t => {
      try {
        ctx.mqttClient.unsubscribe(t, () => {
          if (--pending === 0 && !fired) {
            clearTimeout(timeout); fired = true; if (cb) cb();
          }
        });
      } catch {
        if (--pending === 0 && !fired) {
          clearTimeout(timeout); fired = true; if (cb) cb();
        }
      }
    });
  }

  function endQuietly(next) {
    const finish = () => {
      try { if (ctx.mqttClient) ctx.mqttClient.removeAllListeners(); } catch (_) {}
      ctx.mqttClient = undefined;
      ctx.lastSeqId = null;
      ctx.syncToken = undefined;
      ctx.t_mqttCalled = false;
      ctx._ending = false;
      ctx._cycling = false;
      ctx._reconnectAttempts = 0;
      if (ctx._reconnectTimer) { clearTimeout(ctx._reconnectTimer); ctx._reconnectTimer = null; }
      if (ctx._rTimeout) { clearTimeout(ctx._rTimeout); ctx._rTimeout = null; }
      if (ctx.tasks instanceof Map) ctx.tasks.clear();
      if (Array.isArray(ctx._autoSaveInterval)) {
        ctx._autoSaveInterval.forEach(i => { try { clearInterval(i); } catch (_) {} });
        ctx._autoSaveInterval = [];
      }
      if (ctx._scheduler?.destroy) {
        try { ctx._scheduler.destroy(); } catch (_) {}
        ctx._scheduler = undefined;
      }
      next && next();
    };
    try {
      if (ctx.mqttClient) {
        if (isConnected()) {
          try { ctx.mqttClient.publish("/browser_close", "{}", { qos: 0 }); } catch (_) {}
        }
        ctx.mqttClient.end(true, finish);
      } else finish();
    } catch (_) { finish(); }
  }

  function delayedReconnect() {
    const d = conf.reconnectDelayMs;
    logger(`[ KIRA ] MQTT سيعيد الاتصال بعد ${d}ms`, "info");
    setTimeout(() => getSeqIDWrapper(), d);
  }

  function forceCycle() {
    if (ctx._cycling) { logger("[ KIRA ] MQTT cycle قيد التنفيذ", "warn"); return; }
    ctx._cycling = true;
    ctx._ending = true;
    logger("[ KIRA ] MQTT cycle تلقائي — تحديث الاتصال", "warn");
    unsubAll(() => endQuietly(() => delayedReconnect()));
  }

  return function (callback) {
    class MessageEmitter extends EventEmitter {
      stopListening(callback2) {
        const cb = callback2 || function () {};
        logger("[ KIRA ] MQTT إيقاف الاستماع", "info");
        globalCallback = identity;
        if (ctx._autoCycleTimer) { clearInterval(ctx._autoCycleTimer); ctx._autoCycleTimer = null; }
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
        return new Promise(resolve => { this.stopListening(resolve); });
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
    ctx.syncToken = undefined;
    ctx.t_mqttCalled = false;

    if (ctx._autoCycleTimer) { clearInterval(ctx._autoCycleTimer); ctx._autoCycleTimer = null; }
    if (conf.cycleMs && conf.cycleMs > 0) {
      ctx._autoCycleTimer = setInterval(forceCycle, conf.cycleMs);
      logger(`[ KIRA ] MQTT تحديث تلقائي كل ${Math.round(conf.cycleMs / 3600000)} ساعة`, "info");
    }

    if (!ctx.firstListen || !ctx.lastSeqId) getSeqIDWrapper();
    else {
      logger("[ KIRA ] MQTT بدء الاستماع", "info");
      listenMqtt(defaultFuncs, api, ctx, globalCallback);
    }

    api.stopListening = msgEmitter.stopListening.bind(msgEmitter);
    api.stopListeningAsync = msgEmitter.stopListeningAsync.bind(msgEmitter);

    let currentOriginalCallback = originalCallback;
    let currentGlobalCallback = globalCallback;

    function rewrapIfNeeded() {
      if (!ctx.mqttClient || ctx._ending) return;
      const hasMiddleware = middleware.count > 0;
      const isWrapped = currentGlobalCallback !== currentOriginalCallback;
      if (hasMiddleware && !isWrapped) {
        currentGlobalCallback = middleware.wrapCallback(currentOriginalCallback);
        globalCallback = currentGlobalCallback;
      } else if (!hasMiddleware && isWrapped) {
        currentGlobalCallback = currentOriginalCallback;
        globalCallback = currentGlobalCallback;
      }
    }

    api.useMiddleware = (fn, f) => { const r = middleware.use(fn, f); rewrapIfNeeded(); return r; };
    api.removeMiddleware = (id) => { const r = middleware.remove(id); rewrapIfNeeded(); return r; };
    api.clearMiddleware = () => { const r = middleware.clear(); rewrapIfNeeded(); return r; };
    api.listMiddleware = () => middleware.list();
    api.setMiddlewareEnabled = (n, e) => { const r = middleware.setEnabled(n, e); rewrapIfNeeded(); return r; };

    const desc = Object.getOwnPropertyDescriptor(api, "middlewareCount");
    if (!desc || desc.configurable) {
      Object.defineProperty(api, "middlewareCount", {
        configurable: true,
        enumerable: false,
        get: () => (ctx._middleware && ctx._middleware.count) || 0
      });
    }

    return msgEmitter;
  };
};
