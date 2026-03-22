// ============================================================
//  AYMAN-FCA v2.0 — Group Member Management via MQTT
//  © 2025 Ayman. All Rights Reserved.
//  مستوحى من: ws3-fca
//
//  api.gcmember("add",    userID,  threadID) — إضافة عضو
//  api.gcmember("remove", userID,  threadID) — إزالة عضو
//  api.gcrule("admin",   userID,  threadID) — ترقية لمشرف
//  api.gcrule("unadmin", userID,  threadID) — إزالة مشرف
//  api.emoji(emoji, threadID)               — تغيير الإيموجي
// ============================================================
"use strict";

const { generateOfflineThreadingID } = require("../../utils/format");
const logger = require("../../../func/logger");

// ──────────────────────────────────────────────────────────
// gcmember — إضافة/إزالة أعضاء
// ──────────────────────────────────────────────────────────
module.exports.gcmember = function(defaultFuncs, api, ctx) {
  return async function gcmember(action, userIDs, threadID, callback) {
    let _cb;
    if (typeof threadID === "function") { _cb = threadID; threadID = null; }
    else if (typeof callback === "function") { _cb = callback; }

    let resolve, reject;
    const p = new Promise((res, rej) => { resolve = res; reject = rej; });
    if (!_cb) _cb = (err, data) => err ? reject(err) : resolve(data);

    try {
      if (!["add","remove"].includes((action || "").toLowerCase()))
        return _cb(null, { type: "error_gc", error: "action يجب أن يكون add أو remove" });
      if (!userIDs || !threadID)
        return _cb(null, { type: "error_gc", error: "userIDs و threadID مطلوبان" });
      if (!ctx.mqttClient)
        return _cb(null, { type: "error_gc", error: "MQTT غير متصل" });

      const users   = Array.isArray(userIDs) ? userIDs : [userIDs];
      const info    = await api.getThreadInfo(threadID);
      if (!info?.isGroup) return _cb(null, { type: "error_gc", error: "يعمل فقط مع مجموعات" });

      const members = info.participantIDs || [];
      ctx.wsReqNumber  = (ctx.wsReqNumber  || 0) + 1;
      ctx.wsTaskNumber = (ctx.wsTaskNumber || 0) + 1;

      let payload, label, qname;

      if (action === "add") {
        const toAdd = users.filter(id => !members.includes(id));
        if (!toAdd.length) return _cb(null, { type: "error_gc", error: "الأعضاء موجودون مسبقاً" });
        payload = { thread_key: parseInt(threadID), contact_ids: toAdd.map(Number), sync_group: 1 };
        label   = "7";
        qname   = "add_participants";
      } else {
        const toRm = users.filter(id => members.includes(id));
        if (!toRm.length) return _cb(null, { type: "error_gc", error: "الأعضاء غير موجودين" });
        payload = { thread_key: parseInt(threadID), contact_id: parseInt(toRm[0]), sync_group: 1 };
        label   = "8";
        qname   = "remove_participant";
      }

      const content = {
        app_id:     "2220391788200892",
        payload:    JSON.stringify({
          epoch_id:  parseInt(generateOfflineThreadingID()),
          tasks:     [{ failure_count: null, label, payload: JSON.stringify(payload), queue_name: qname, task_id: ctx.wsTaskNumber }],
          version_id: "24631415369801570"
        }),
        request_id: ctx.wsReqNumber,
        type:       3
      };

      ctx.mqttClient.publish("/ls_req", JSON.stringify(content), { qos: 1, retain: false }, err => {
        if (err) return _cb(err);
        _cb(null, { type: "gc_member_update", action, threadID, userIDs: users, timestamp: Date.now() });
      });
    } catch (e) {
      _cb(null, { type: "error_gc", error: e?.message || String(e) });
    }

    return p;
  };
};

// ──────────────────────────────────────────────────────────
// gcrule — ترقية/إزالة مشرف
// ──────────────────────────────────────────────────────────
module.exports.gcrule = function(defaultFuncs, api, ctx) {
  return async function gcrule(action, userID, threadID, callback) {
    let _cb;
    if (typeof threadID === "function") { _cb = threadID; threadID = null; }
    else if (typeof callback === "function") { _cb = callback; }

    let resolve, reject;
    const p = new Promise((res, rej) => { resolve = res; reject = rej; });
    if (!_cb) _cb = (err, data) => err ? reject(err) : resolve(data);

    try {
      action = (action || "").toLowerCase();
      if (!["admin","unadmin"].includes(action))
        return _cb(null, { type: "error_gc_rule", error: "action يجب أن يكون admin أو unadmin" });
      if (!userID || !threadID)
        return _cb(null, { type: "error_gc_rule", error: "userID و threadID مطلوبان" });
      if (!ctx.mqttClient)
        return _cb(null, { type: "error_gc_rule", error: "MQTT غير متصل" });

      const info    = await api.getThreadInfo(threadID);
      const admins  = (info?.adminIDs || []).map(a => a.id || a);
      const isAdmin = admins.includes(String(userID));

      if (action === "admin"   && isAdmin)  return _cb(null, { type: "error_gc_rule", error: "المستخدم مشرف مسبقاً" });
      if (action === "unadmin" && !isAdmin) return _cb(null, { type: "error_gc_rule", error: "المستخدم ليس مشرفاً" });

      ctx.wsReqNumber  = (ctx.wsReqNumber  || 0) + 1;
      ctx.wsTaskNumber = (ctx.wsTaskNumber || 0) + 1;

      const payload = {
        thread_key: parseInt(threadID),
        contact_id: parseInt(userID),
        is_admin:   action === "admin" ? 1 : 0
      };

      const content = {
        app_id:     "2220391788200892",
        payload:    JSON.stringify({
          epoch_id:   parseInt(generateOfflineThreadingID()),
          tasks:      [{ failure_count: null, label: "25", payload: JSON.stringify(payload), queue_name: "admin_status", task_id: ctx.wsTaskNumber }],
          version_id: "24631415369801570"
        }),
        request_id: ctx.wsReqNumber,
        type:       3
      };

      ctx.mqttClient.publish("/ls_req", JSON.stringify(content), { qos: 1, retain: false }, err => {
        if (err) return _cb(err);
        _cb(null, { type: "gc_rule_update", action, threadID, userID, timestamp: Date.now() });
      });
    } catch (e) {
      _cb(null, { type: "error_gc_rule", error: e?.message || String(e) });
    }

    return p;
  };
};

// ──────────────────────────────────────────────────────────
// emoji — تغيير إيموجي المجموعة
// ──────────────────────────────────────────────────────────
module.exports.emoji = function(defaultFuncs, api, ctx) {
  return function setEmoji(emoji, threadID, callback) {
    let resolve, reject;
    const p = new Promise((res, rej) => { resolve = res; reject = rej; });
    if (typeof callback !== "function") callback = (err, d) => err ? reject(err) : resolve(d);

    if (!emoji)     return callback(new Error("AYMAN-FCA: emoji مطلوب"));
    if (!threadID)  return callback(new Error("AYMAN-FCA: threadID مطلوب"));
    if (!ctx.mqttClient) return callback(new Error("AYMAN-FCA: MQTT غير متصل"));

    ctx.wsReqNumber  = (ctx.wsReqNumber  || 0) + 1;
    ctx.wsTaskNumber = (ctx.wsTaskNumber || 0) + 1;

    const payload = {
      thread_key:                        String(threadID),
      custom_emoji:                      emoji,
      avatar_sticker_instruction_key_id: null,
      sync_group:                        1
    };

    const content = {
      app_id:     "2220391788200892",
      payload:    JSON.stringify({
        epoch_id:   parseInt(generateOfflineThreadingID()),
        tasks:      [{ failure_count: null, label: "100003", payload: JSON.stringify(payload), queue_name: "thread_quick_reaction", task_id: ctx.wsTaskNumber }],
        version_id: "24631415369801570"
      }),
      request_id: ctx.wsReqNumber,
      type:       3
    };

    ctx.mqttClient.publish("/ls_req", JSON.stringify(content), { qos: 1, retain: false }, err => {
      if (err) return callback(err);
      callback(null, { type: "thread_emoji_update", threadID, emoji, timestamp: Date.now() });
    });

    return p;
  };
};
