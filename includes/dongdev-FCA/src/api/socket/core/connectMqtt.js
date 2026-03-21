// ============================================================
//  AYMAN-FCA — MQTT Core
//  مكتبة KIRA بوت | المطور: Ayman
//  مستوحى من: ws3-fca + fca-unofficial
//  ميزات جديدة: reconnect عشوائي + clientID جديد كل دورة
// ============================================================
"use strict";

const { formatID } = require("../../../utils/format");

const DEFAULT_RECONNECT_DELAY_MS = 3000;
const T_MS_WAIT_TIMEOUT_MS       = 12000;
const MAX_RECONNECT_ATTEMPTS     = 15;

// ✅ من ws3: reconnect بوقت عشوائي بين 26-60 دقيقة
function getRandomCycleTime() {
  const min = 26 * 60 * 1000;
  const max = 60 * 60 * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ✅ من ws3: UUID جديد لكل دورة اتصال
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

module.exports = function createListenMqtt(deps) {
  const {
    WebSocket, mqtt, HttpsProxyAgent, buildStream, buildProxy,
    topics, parseDelta, getTaskResponseData, logger, emitAuth
  } = deps;

  return function listenMqtt(defaultFuncs, api, ctx, globalCallback) {

    if (!ctx._reconnectAttempts) ctx._reconnectAttempts = 0;

    function scheduleReconnect(delayMs) {
      if (ctx._reconnectTimer) return;
      if (ctx._ending) return;

      if (ctx._reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        logger(`[ KIRA ] MQTT وصل للحد الأقصى (${MAX_RECONNECT_ATTEMPTS}) — إيقاف`, "error");
        globalCallback({ type: "stop_listen", error: "Max reconnect attempts reached" }, null);
        ctx._reconnectAttempts = 0;
        return;
      }

      const d = (ctx._mqttOpt?.reconnectDelayMs) || DEFAULT_RECONNECT_DELAY_MS;
      const ms = typeof delayMs === "number" ? delayMs : d;
      ctx._reconnectAttempts++;
      logger(`[ KIRA ] MQTT إعادة اتصال بعد ${ms}ms (${ctx._reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`, "warn");

      ctx._reconnectTimer = setTimeout(() => {
        ctx._reconnectTimer = null;
        // ✅ من ws3: غيّر clientID عند كل إعادة اتصال
        ctx.clientId = generateUUID();
        if (!ctx._ending) listenMqtt(defaultFuncs, api, ctx, globalCallback);
      }, ms);
    }

    const chatOn    = ctx.globalOptions.online;
    const sessionID = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
    const username  = {
      u: ctx.userID, s: sessionID, chat_on: chatOn, fg: false,
      d: ctx.clientId, ct: "websocket", aid: 219994525426954,
      aids: null, mqtt_sid: "", cp: 3, ecp: 10, st: [], pm: [],
      dc: "", no_auto_fg: true, gas: null, pack: [], p: null, php_override: ""
    };

    const cookies = api.getCookies();
    let host;
    if (ctx.mqttEndpoint)
      host = `${ctx.mqttEndpoint}&sid=${sessionID}&cid=${ctx.clientId}`;
    else if (ctx.region)
      host = `wss://edge-chat.facebook.com/chat?region=${ctx.region.toLowerCase()}&sid=${sessionID}&cid=${ctx.clientId}`;
    else
      host = `wss://edge-chat.facebook.com/chat?sid=${sessionID}&cid=${ctx.clientId}`;

    const options = {
      clientId: "mqttwsclient",
      protocolId: "MQIsdp",
      protocolVersion: 3,
      username: JSON.stringify(username),
      clean: true,
      wsOptions: {
        headers: {
          Cookie: cookies,
          Origin: "https://www.facebook.com",
          "User-Agent": ctx.globalOptions.userAgent ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: "https://www.facebook.com/",
          Host: "edge-chat.facebook.com",
          Connection: "Upgrade",
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
          Upgrade: "websocket",
          "Sec-WebSocket-Version": "13",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "ar,en;q=0.9",
          "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits"
        },
        origin: "https://www.facebook.com",
        protocolVersion: 13,
        binaryType: "arraybuffer",
        handshakeTimeout: 15000
      },
      keepalive: 60,
      reschedulePings: true,
      reconnectPeriod: 0,
      connectTimeout: 15000
    };

    if (ctx.globalOptions.proxy !== undefined) {
      options.wsOptions.agent = new HttpsProxyAgent(ctx.globalOptions.proxy);
    }

    ctx.mqttClient = new mqtt.Client(
      () => buildStream(options, new WebSocket(host, options.wsOptions), buildProxy()),
      options
    );
    const mqttClient = ctx.mqttClient;

    mqttClient.on("error", function (err) {
      const msg = String(err?.message || err || "");
      if ((ctx._ending || ctx._cycling) && /No subscription existed|client disconnecting/i.test(msg)) return;

      if (/Not logged in|blocked the login|401|403/i.test(msg)) {
        try { if (mqttClient?.connected) mqttClient.end(true); } catch (_) {}
        return emitAuth(ctx, api, globalCallback,
          /blocked/i.test(msg) ? "login_blocked" : "not_logged_in", msg);
      }

      logger(`[ KIRA ] MQTT خطأ: ${msg}`, "error");
      try { if (mqttClient?.connected) mqttClient.end(true); } catch (_) {}
      if (ctx._ending || ctx._cycling) return;
      if (ctx.globalOptions.autoReconnect) scheduleReconnect();
      else globalCallback({ type: "stop_listen", error: msg }, null);
    });

    mqttClient.on("connect", function () {
      // ✅ إعادة تصفير عداد المحاولات
      ctx._reconnectAttempts = 0;

      if (!process.env.KiraOnline) {
        logger("[ AYMAN-FCA ] KIRA متصل ✅", "info");
        process.env.KiraOnline = "1";
      }
      ctx._cycling = false;
      topics.forEach(t => mqttClient.subscribe(t));

      const queue = {
        sync_api_version: 11,
        max_deltas_able_to_process: 100,
        delta_batch_size: 500,
        encoding: "JSON",
        entity_fbid: ctx.userID,
        initial_titan_sequence_id: ctx.lastSeqId,
        device_params: null
      };
      const topic = ctx.syncToken ? "/messenger_sync_get_diffs" : "/messenger_sync_create_queue";
      if (ctx.syncToken) { queue.last_seq_id = ctx.lastSeqId; queue.sync_token = ctx.syncToken; }

      mqttClient.publish(topic, JSON.stringify(queue), { qos: 1, retain: false });
      mqttClient.publish("/foreground_state", JSON.stringify({ foreground: chatOn }), { qos: 1 });
      mqttClient.publish("/set_client_settings", JSON.stringify({ make_user_available_when_in_foreground: true }), { qos: 1 });

      const d = (ctx._mqttOpt?.reconnectDelayMs) || DEFAULT_RECONNECT_DELAY_MS;
      let rTimeout = setTimeout(() => {
        rTimeout = null;
        if (ctx._ending) return;
        logger("[ KIRA ] MQTT t_ms timeout — إعادة اتصال", "warn");
        try { if (mqttClient?.connected) mqttClient.end(true); } catch (_) {}
        scheduleReconnect(d);
      }, T_MS_WAIT_TIMEOUT_MS);

      ctx._rTimeout = rTimeout;
      ctx.tmsWait = function () {
        if (rTimeout) { clearTimeout(rTimeout); rTimeout = null; }
        if (ctx._rTimeout) delete ctx._rTimeout;
        if (ctx.globalOptions.emitReady) globalCallback({ type: "ready", error: null });
        delete ctx.tmsWait;
      };
    });

    mqttClient.on("message", function (topic, message) {
      if (ctx._ending) return;
      try {
        let j = Buffer.isBuffer(message) ? Buffer.from(message).toString() : message;
        try { j = JSON.parse(j); } catch { j = {}; }

        if (j.type === "jewel_requests_add") {
          globalCallback(null, { type: "friend_request_received", actorFbId: j.from.toString(), timestamp: Date.now().toString() });
        } else if (j.type === "jewel_requests_remove_old") {
          globalCallback(null, { type: "friend_request_cancel", actorFbId: j.from.toString(), timestamp: Date.now().toString() });
        } else if (topic === "/t_ms") {
          if (ctx.tmsWait && typeof ctx.tmsWait === "function") ctx.tmsWait();
          if (j.firstDeltaSeqId && j.syncToken) { ctx.lastSeqId = j.firstDeltaSeqId; ctx.syncToken = j.syncToken; }
          if (j.lastIssuedSeqId) ctx.lastSeqId = parseInt(j.lastIssuedSeqId);
          for (const dlt of (j.deltas || [])) parseDelta(defaultFuncs, api, ctx, globalCallback, { delta: dlt });
        } else if (topic === "/thread_typing" || topic === "/orca_typing_notifications") {
          globalCallback(null, {
            type: "typ",
            isTyping: !!j.state,
            from: j.sender_fbid.toString(),
            threadID: formatID((j.thread || j.sender_fbid).toString())
          });
        } else if (topic === "/orca_presence") {
          if (!ctx.globalOptions.updatePresence) {
            for (const d of (j.list || [])) {
              globalCallback(null, { type: "presence", userID: String(d.u), timestamp: d.l * 1000, statuses: d.p });
            }
          }
        } else if (topic === "/ls_resp") {
          const parsed = JSON.parse(j.payload);
          const reqID  = j.request_id;
          if (ctx.tasks instanceof Map && ctx.tasks.has(reqID)) {
            const { type: taskType, callback: cb } = ctx.tasks.get(reqID);
            const data = getTaskResponseData(taskType, parsed);
            cb(data == null ? "error" : null, data == null ? null : Object.assign({ type: taskType, reqID }, data));
          }
        }
      } catch (ex) {
        logger(`[ KIRA ] MQTT رسالة خاطئة: ${ex?.message || ex}`, "error");
      }
    });

    mqttClient.on("close", function () {
      if (ctx._ending || ctx._cycling) return;
      logger("[ KIRA ] MQTT انقطع — إعادة اتصال", "warn");
      if (ctx.globalOptions.autoReconnect && !ctx._reconnectTimer) scheduleReconnect();
    });

    mqttClient.on("offline", () => {
      if (ctx._ending) return;
      logger("[ KIRA ] MQTT offline", "warn");
    });

    mqttClient.on("disconnect", () => {
      if (ctx._ending || ctx._cycling) return;
      logger("[ KIRA ] MQTT disconnect", "warn");
    });
  };
};
