// ============================================================
//  AYMAN-FCA — MQTT Core Connection
//  مكتبة KIRA بوت | المطور: Ayman
//  تحسين: timeout أعلى + keepalive أقوى + reconnect ذكي
// ============================================================
"use strict";

const { formatID } = require("../../../utils/format");

// ✅ تم رفع التأخير الافتراضي لإعطاء وقت كافٍ للشبكة
const DEFAULT_RECONNECT_DELAY_MS = 3000;
// ✅ رفع T_MS_WAIT من 5s إلى 12s — يتحمل الشبكات البطيئة
const T_MS_WAIT_TIMEOUT_MS = 12000;
// ✅ حد أقصى لإعادة المحاولات قبل الاستسلام والإشعار
const MAX_RECONNECT_ATTEMPTS = 15;

module.exports = function createListenMqtt(deps) {
  const {
    WebSocket, mqtt, HttpsProxyAgent, buildStream, buildProxy,
    topics, parseDelta, getTaskResponseData, logger, emitAuth
  } = deps;

  return function listenMqtt(defaultFuncs, api, ctx, globalCallback) {

    // ✅ عداد إعادة المحاولات
    if (!ctx._reconnectAttempts) ctx._reconnectAttempts = 0;

    function scheduleReconnect(delayMs) {
      // ✅ debounce — لا تجدول اثنتين في نفس الوقت
      if (ctx._reconnectTimer) return;
      if (ctx._ending) return;

      // ✅ تحقق من الحد الأقصى للمحاولات
      if (ctx._reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        logger(`[ KIRA ] MQTT وصل للحد الأقصى من المحاولات (${MAX_RECONNECT_ATTEMPTS}). توقف.`, "error");
        globalCallback({ type: "stop_listen", error: "Max reconnect attempts reached" }, null);
        ctx._reconnectAttempts = 0;
        return;
      }

      const d = (ctx._mqttOpt && ctx._mqttOpt.reconnectDelayMs) || DEFAULT_RECONNECT_DELAY_MS;
      const ms = typeof delayMs === "number" ? delayMs : d;

      ctx._reconnectAttempts++;
      logger(`[ KIRA ] MQTT سيعيد الاتصال بعد ${ms}ms (محاولة ${ctx._reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`, "warn");

      ctx._reconnectTimer = setTimeout(() => {
        ctx._reconnectTimer = null;
        if (!ctx._ending) {
          listenMqtt(defaultFuncs, api, ctx, globalCallback);
        }
      }, ms);
    }

    const chatOn = ctx.globalOptions.online;
    const sessionID = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
    const username = {
      u: ctx.userID,
      s: sessionID,
      chat_on: chatOn,
      fg: false,
      d: ctx.clientId,
      ct: "websocket",
      aid: 219994525426954,
      aids: null,
      mqtt_sid: "",
      cp: 3,
      ecp: 10,
      st: [],
      pm: [],
      dc: "",
      no_auto_fg: true,
      gas: null,
      pack: [],
      p: null,
      php_override: ""
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
          // ✅ User-Agent محدّث لـ Chrome 124
          "User-Agent": ctx.globalOptions.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
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
        // ✅ handshake timeout أعلى
        handshakeTimeout: 15000
      },
      // ✅ keepalive رُفع من 30 إلى 60 ثانية — اتصال أكثر استقراراً
      keepalive: 60,
      reschedulePings: true,
      reconnectPeriod: 0,
      // ✅ connectTimeout رُفع من 5000 إلى 15000
      connectTimeout: 15000
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

    // ✅ معالجة الأخطاء
    mqttClient.on("error", function (err) {
      const msg = String(err && err.message ? err.message : err || "");

      // أخطاء متوقعة عند الإيقاف
      if ((ctx._ending || ctx._cycling) && /No subscription existed|client disconnecting/i.test(msg)) {
        logger(`[ KIRA ] MQTT خطأ متوقع عند الإيقاف: ${msg}`, "info");
        return;
      }

      // ✅ انتهت الجلسة — أشعر بالحدث
      if (/Not logged in|blocked the login|401|403/i.test(msg)) {
        try { if (mqttClient?.connected) mqttClient.end(true); } catch (_) {}
        return emitAuth(ctx, api, globalCallback,
          /blocked/i.test(msg) ? "login_blocked" : "not_logged_in",
          msg
        );
      }

      logger(`[ KIRA ] MQTT خطأ: ${msg}`, "error");
      try { if (mqttClient?.connected) mqttClient.end(true); } catch (_) {}

      if (ctx._ending || ctx._cycling) return;

      if (ctx.globalOptions.autoReconnect) {
        const d = (ctx._mqttOpt && ctx._mqttOpt.reconnectDelayMs) || DEFAULT_RECONNECT_DELAY_MS;
        scheduleReconnect(d);
      } else {
        globalCallback({ type: "stop_listen", error: msg || "Connection refused" }, null);
      }
    });

    // ✅ عند الاتصال الناجح
    mqttClient.on("connect", function () {
      // ✅ أعد تصفير عداد المحاولات عند نجاح الاتصال
      ctx._reconnectAttempts = 0;

      if (process.env.OnStatus === undefined) {
        logger("[ AYMAN-FCA ] KIRA بوت متصل بـ Facebook ✅", "info");
        process.env.OnStatus = "true";
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
      if (ctx.syncToken) {
        queue.last_seq_id = ctx.lastSeqId;
        queue.sync_token = ctx.syncToken;
      }
      mqttClient.publish(topic, JSON.stringify(queue), { qos: 1, retain: false });
      mqttClient.publish("/foreground_state", JSON.stringify({ foreground: chatOn }), { qos: 1 });
      mqttClient.publish("/set_client_settings", JSON.stringify({ make_user_available_when_in_foreground: true }), { qos: 1 });

      const d = (ctx._mqttOpt && ctx._mqttOpt.reconnectDelayMs) || DEFAULT_RECONNECT_DELAY_MS;
      let rTimeout = setTimeout(function () {
        rTimeout = null;
        if (ctx._ending) return;
        logger(`[ KIRA ] MQTT t_ms timeout — سيعيد الاتصال`, "warn");
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

    // ✅ معالجة الرسائل الواردة
    mqttClient.on("message", function (topic, message) {
      if (ctx._ending) return;
      try {
        let jsonMessage = Buffer.isBuffer(message)
          ? Buffer.from(message).toString()
          : message;
        try {
          jsonMessage = JSON.parse(jsonMessage);
        } catch {
          jsonMessage = {};
        }

        if (jsonMessage.type === "jewel_requests_add") {
          globalCallback(null, {
            type: "friend_request_received",
            actorFbId: jsonMessage.from.toString(),
            timestamp: Date.now().toString()
          });
        } else if (jsonMessage.type === "jewel_requests_remove_old") {
          globalCallback(null, {
            type: "friend_request_cancel",
            actorFbId: jsonMessage.from.toString(),
            timestamp: Date.now().toString()
          });
        } else if (topic === "/t_ms") {
          if (ctx.tmsWait && typeof ctx.tmsWait === "function") ctx.tmsWait();
          if (jsonMessage.firstDeltaSeqId && jsonMessage.syncToken) {
            ctx.lastSeqId = jsonMessage.firstDeltaSeqId;
            ctx.syncToken = jsonMessage.syncToken;
          }
          if (jsonMessage.lastIssuedSeqId)
            ctx.lastSeqId = parseInt(jsonMessage.lastIssuedSeqId);
          for (const dlt of (jsonMessage.deltas || [])) {
            parseDelta(defaultFuncs, api, ctx, globalCallback, { delta: dlt });
          }
        } else if (topic === "/thread_typing" || topic === "/orca_typing_notifications") {
          globalCallback(null, {
            type: "typ",
            isTyping: !!jsonMessage.state,
            from: jsonMessage.sender_fbid.toString(),
            threadID: formatID((jsonMessage.thread || jsonMessage.sender_fbid).toString())
          });
        } else if (topic === "/orca_presence") {
          if (!ctx.globalOptions.updatePresence) {
            for (const data of (jsonMessage.list || [])) {
              globalCallback(null, {
                type: "presence",
                userID: String(data.u),
                timestamp: data.l * 1000,
                statuses: data.p
              });
            }
          }
        } else if (topic === "/ls_resp") {
          const parsedPayload = JSON.parse(jsonMessage.payload);
          const reqID = jsonMessage.request_id;
          const tasks = ctx.tasks;
          if (tasks instanceof Map && tasks.has(reqID)) {
            const { type: taskType, callback: taskCallback } = tasks.get(reqID);
            const taskRespData = getTaskResponseData(taskType, parsedPayload);
            if (taskRespData == null) taskCallback("error", null);
            else taskCallback(null, Object.assign({ type: taskType, reqID }, taskRespData));
          }
        }
      } catch (ex) {
        // ✅ لا نوقف البوت بسبب رسالة واحدة تعطلت
        logger(`[ KIRA ] خطأ في معالجة رسالة MQTT: ${ex?.message || ex}`, "error");
      }
    });

    mqttClient.on("close", function () {
      if (ctx._ending || ctx._cycling) {
        logger("[ KIRA ] MQTT انتهى الاتصال (متوقع)", "info");
        return;
      }
      logger("[ KIRA ] MQTT انقطع الاتصال — سيعيد المحاولة", "warn");
      if (ctx.globalOptions.autoReconnect && !ctx._reconnectTimer) {
        scheduleReconnect(DEFAULT_RECONNECT_DELAY_MS);
      }
    });

    mqttClient.on("disconnect", () => {
      if (ctx._ending || ctx._cycling) return;
      logger("[ KIRA ] MQTT disconnect حدث", "warn");
    });

    // ✅ معالجة offline event
    mqttClient.on("offline", () => {
      if (ctx._ending) return;
      logger("[ KIRA ] MQTT offline — الشبكة منقطعة", "warn");
    });
  };
};
