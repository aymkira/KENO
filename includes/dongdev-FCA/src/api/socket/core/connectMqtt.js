"use strict";
/**
 * MQTT/WebSocket listener for Facebook Messenger real-time events.
 * Connects to edge-chat.facebook.com, subscribes to topics, parses deltas and typing/presence.
 */
const { formatID } = require("../../../utils/format");

const DEFAULT_RECONNECT_DELAY_MS = 1000; // ⚡ أسرع من 2000
const MAX_RECONNECT_DELAY_MS     = 30000; // حد أقصى للانتظار
const T_MS_WAIT_TIMEOUT_MS       = 5000;

// ── حساب تأخير تصاعدي ذكي ──────────────────────────
function getBackoffDelay(attempt, base) {
  const delay = Math.min(base * Math.pow(1.5, attempt), MAX_RECONNECT_DELAY_MS);
  return delay + Math.floor(Math.random() * 500); // jitter لتجنب الحظر
}

module.exports = function createListenMqtt(deps) {
  const { WebSocket, mqtt, HttpsProxyAgent, buildStream, buildProxy,
    topics, parseDelta, getTaskResponseData, logger, emitAuth
  } = deps;

  return function listenMqtt(defaultFuncs, api, ctx, globalCallback) {

    // ── مضاد تسجيل الخروج مع backoff ذكي ─────────────
    ctx._reconnectAttempt = ctx._reconnectAttempt || 0;

    function scheduleReconnect(delayMs) {
      const base = (ctx._mqttOpt && ctx._mqttOpt.reconnectDelayMs) || DEFAULT_RECONNECT_DELAY_MS;
      const ms   = typeof delayMs === "number"
        ? delayMs
        : getBackoffDelay(ctx._reconnectAttempt, base);

      if (ctx._reconnectTimer) {
        logger("mqtt reconnect already scheduled", "warn");
        return;
      }
      if (ctx._ending) {
        logger("mqtt reconnect skipped - ending", "warn");
        return;
      }
      ctx._reconnectAttempt++;
      logger(`mqtt reconnect #${ctx._reconnectAttempt} in ${Math.round(ms)}ms`, "warn");
      ctx._reconnectTimer = setTimeout(() => {
        ctx._reconnectTimer = null;
        if (!ctx._ending) {
          listenMqtt(defaultFuncs, api, ctx, globalCallback);
        }
      }, ms);
    }

    // إعادة تصفير العداد عند الاتصال الناجح
    function resetReconnectCounter() {
      ctx._reconnectAttempt = 0;
    }
    function isEndingLikeError(msg) {
      return /No subscription existed|client disconnecting|socket hang up|ECONNRESET/i.test(msg || "");
    }

    const chatOn = ctx.globalOptions.online;
    const sessionID = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
    const username = {
      u: ctx.userID, s: sessionID, chat_on: chatOn, fg: false, d: ctx.clientId,
      ct: "websocket", aid: 219994525426954, aids: null, mqtt_sid: "",
      cp: 3, ecp: 10, st: [], pm: [], dc: "", no_auto_fg: true, gas: null, pack: [], p: null, php_override: ""
    };

    const cookies = api.getCookies();
    let host;
    if (ctx.mqttEndpoint) host = `${ctx.mqttEndpoint}&sid=${sessionID}&cid=${ctx.clientId}`;
    else if (ctx.region) host = `wss://edge-chat.facebook.com/chat?region=${ctx.region.toLowerCase()}&sid=${sessionID}&cid=${ctx.clientId}`;
    else host = `wss://edge-chat.facebook.com/chat?sid=${sessionID}&cid=${ctx.clientId}`;

    // ── stealth: تحديث المتصفح ─────────────────────────
    let stealth;
    try { stealth = require("../../../../func/stealth"); } catch(_) {}
    if (stealth) stealth.startBrowserRotation(ctx, 8);

    // ── Guardian: تشغيل نظام الحارس ───────────────────
    try {
      const Guardian = require("../../../../func/guardian");
      if (!ctx._guardian) {
        const appStatePath = require("path").join(process.cwd(), global.config?.APPSTATEPATH || "appstate.json");
        ctx._guardian = new Guardian(ctx, api, defaultFuncs, appStatePath);
        ctx._guardian.start();
      }
    } catch(e) {
      logger(`Guardian init error: ${e.message}`, "warn");
    }

    // ── تدوير User-Agent ────────────────────────────────
    const USER_AGENTS = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    ];
    const ua = ctx._browser?.ua || ctx.globalOptions.userAgent ||
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

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
          "User-Agent": ua,
          Referer: "https://www.facebook.com/",
          Host: "edge-chat.facebook.com",
          Connection: "Upgrade",
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
          Upgrade: "websocket",
          "Sec-WebSocket-Version": "13",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "ar,en;q=0.9",
          "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
          "Sec-Fetch-Dest": "websocket",
          "Sec-Fetch-Mode": "websocket",
          "Sec-Fetch-Site": "same-site",
        },
        origin: "https://www.facebook.com",
        protocolVersion: 13,
        binaryType: "arraybuffer",
        handshakeTimeout: 15000,
      },
      keepalive:       60,
      reschedulePings: true,
      reconnectPeriod: 0,
      connectTimeout:  15000,
    };
    if (ctx.globalOptions.proxy !== undefined) {
      const agent = new HttpsProxyAgent(ctx.globalOptions.proxy);
      options.wsOptions.agent = agent;
    }

    ctx.mqttClient = new mqtt.Client(
      () => buildStream(options, new WebSocket(host, options.wsOptions), buildProxy()),
      options
    );
    const mqttClient = ctx.mqttClient;

    mqttClient.on("error", function (err) {
      const msg = String(err && err.message ? err.message : err || "");
      if ((ctx._ending || ctx._cycling) && /No subscription existed|client disconnecting/i.test(msg)) {
        logger(`mqtt expected during shutdown: ${msg}`, "info");
        return;
      }

      if (/Not logged in|Not logged in.|blocked the login|401|403/i.test(msg)) {
        try {
          if (mqttClient && mqttClient.connected) {
            mqttClient.end(true);
          }
        } catch (_) { }
        return emitAuth(ctx, api, globalCallback,
          /blocked/i.test(msg) ? "login_blocked" : "not_logged_in",
          msg
        );
      }
      logger(`mqtt error: ${msg}`, "error");
      try {
        if (mqttClient && mqttClient.connected) {
          mqttClient.end(true);
        }
      } catch (_) { }
      if (ctx._ending || ctx._cycling) return;

      if (ctx.globalOptions.autoReconnect && !ctx._ending) {
        const d = (ctx._mqttOpt && ctx._mqttOpt.reconnectDelayMs) || DEFAULT_RECONNECT_DELAY_MS;
        logger(`mqtt autoReconnect listenMqtt() in ${d}ms`, "warn");
        scheduleReconnect(d);
      } else {
        globalCallback({ type: "stop_listen", error: msg || "Connection refused" }, null);
      }
    });

    mqttClient.on("connect", function () {
      if (process.env.OnStatus === undefined) {
        logger(`AYMAN-FCA متصل بنجاح ✓`, "success");
        process.env.OnStatus = true;
      }
      ctx._cycling = false;
      resetReconnectCounter(); // ✅ إعادة تصفير العداد

      topics.forEach(t => mqttClient.subscribe(t));


      const queue = {
        sync_api_version: 11, max_deltas_able_to_process: 100, delta_batch_size: 500,
        encoding: "JSON", entity_fbid: ctx.userID, initial_titan_sequence_id: ctx.lastSeqId, device_params: null
      };
      const topic = ctx.syncToken ? "/messenger_sync_get_diffs" : "/messenger_sync_create_queue";
      if (ctx.syncToken) { queue.last_seq_id = ctx.lastSeqId; queue.sync_token = ctx.syncToken; }
      mqttClient.publish(topic, JSON.stringify(queue), { qos: 1, retain: false });
      mqttClient.publish("/foreground_state", JSON.stringify({ foreground: chatOn }), { qos: 1 });
      mqttClient.publish("/set_client_settings", JSON.stringify({ make_user_available_when_in_foreground: true }), { qos: 1 });
      const d = (ctx._mqttOpt && ctx._mqttOpt.reconnectDelayMs) || DEFAULT_RECONNECT_DELAY_MS;
      let rTimeout = setTimeout(function () {
        rTimeout = null;
        if (ctx._ending) {
          logger("mqtt t_ms timeout skipped - ending", "warn");
          return;
        }
        logger(`mqtt t_ms timeout, cycling in ${d}ms`, "warn");
        try {
          if (mqttClient && mqttClient.connected) {
            mqttClient.end(true);
          }
        } catch (_) { }
        scheduleReconnect(d);
      }, T_MS_WAIT_TIMEOUT_MS);

      // Store timeout reference for cleanup
      ctx._rTimeout = rTimeout;

      ctx.tmsWait = function () {
        if (rTimeout) {
          clearTimeout(rTimeout);
          rTimeout = null;
        }
        if (ctx._rTimeout) {
          delete ctx._rTimeout;
        }
        if (ctx.globalOptions.emitReady) globalCallback({ type: "ready", error: null });
        delete ctx.tmsWait;
      };
    });

    mqttClient.on("message", function (topic, message) {
      if (ctx._ending) return; // Ignore messages if ending
      try {
        let jsonMessage = Buffer.isBuffer(message) ? Buffer.from(message).toString() : message;
        try {
          jsonMessage = JSON.parse(jsonMessage);
        } catch (parseErr) {
          logger(`mqtt message parse error for topic ${topic}: ${parseErr && parseErr.message ? parseErr.message : String(parseErr)}`, "warn");
          jsonMessage = {};
        }

        if (jsonMessage.type === "jewel_requests_add") {
          globalCallback(null, { type: "friend_request_received", actorFbId: jsonMessage.from.toString(), timestamp: Date.now().toString() });
        } else if (jsonMessage.type === "jewel_requests_remove_old") {
          globalCallback(null, { type: "friend_request_cancel", actorFbId: jsonMessage.from.toString(), timestamp: Date.now().toString() });
        } else if (topic === "/t_ms") {
          if (ctx.tmsWait && typeof ctx.tmsWait == "function") ctx.tmsWait();
          if (jsonMessage.firstDeltaSeqId && jsonMessage.syncToken) {
            ctx.lastSeqId = jsonMessage.firstDeltaSeqId;
            ctx.syncToken = jsonMessage.syncToken;
          }
          if (jsonMessage.lastIssuedSeqId) ctx.lastSeqId = parseInt(jsonMessage.lastIssuedSeqId);
          for (const dlt of (jsonMessage.deltas || [])) {
            parseDelta(defaultFuncs, api, ctx, globalCallback, { delta: dlt });
          }
        } else if (topic === "/thread_typing" || topic === "/orca_typing_notifications") {
          const typ = {
            type: "typ",
            isTyping: !!jsonMessage.state,
            from: jsonMessage.sender_fbid.toString(),
            threadID: formatID((jsonMessage.thread || jsonMessage.sender_fbid).toString())
          };
          globalCallback(null, typ);
        } else if (topic === "/orca_presence") {
          if (!ctx.globalOptions.updatePresence) {
            for (const data of (jsonMessage.list || [])) {
              const presence = { type: "presence", userID: String(data.u), timestamp: data.l * 1000, statuses: data.p };
              globalCallback(null, presence);
            }
          }
        } else if (topic === "/ls_resp") {
          const parsedPayload = JSON.parse(jsonMessage.payload);
          const reqID = jsonMessage.request_id;
          const tasks = ctx.tasks;
          if (tasks && tasks instanceof Map && tasks.has(reqID)) {
            const taskData = tasks.get(reqID);
            const { type: taskType, callback: taskCallback } = taskData;
            const taskRespData = getTaskResponseData(taskType, parsedPayload);
            if (taskRespData == null) taskCallback("error", null);
            else taskCallback(null, Object.assign({ type: taskType, reqID }, taskRespData));
          }
        }
      } catch (ex) {
        const errMsg = ex && ex.message ? ex.message : String(ex || "Unknown error");
        logger(`mqtt message handler error: ${errMsg}`, "error");
        // Don't crash on message parsing errors, just log and continue
      }
    });

    mqttClient.on("close", function () {
      if (ctx._ending || ctx._cycling) {
        logger("mqtt close expected", "info");
        return;
      }
      logger("mqtt connection closed", "warn");
    });

    mqttClient.on("disconnect", () => {
      if (ctx._ending || ctx._cycling) {
        logger("mqtt disconnect expected", "info");
        return;
      }
      logger("mqtt disconnected", "warn");
    });
  };
};
