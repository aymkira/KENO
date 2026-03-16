// نزل v8 — ينزل فيديو فقط

const { NewMessage } = require("telegram/events");
const { Raw }        = require("telegram/events");
const { Api }        = require("telegram");
const fs             = require("fs-extra");
const path           = require("path");
const axios          = require("axios");

// ══ انتظار رسالة فيها أزرار فقط ══
function waitForButtons(client, botId, timeout) {
  timeout = timeout || 90000;
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      reject(new Error("البوت لم يرد بأزرار"));
    }, timeout);
    var resolved = false;
    function finish(msg) {
      if (resolved) return;
      if ((msg.replyMarkup && msg.replyMarkup.rows && msg.replyMarkup.rows.length > 0) === false) return;
      if (!msg.replyMarkup || !msg.replyMarkup.rows || msg.replyMarkup.rows.length === 0) return;
      resolved = true;
      clearTimeout(timer);
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      resolve(msg);
    }
    async function onNew(ev) {
      var msg = ev.message;
      if (!msg || msg.peerId == null) return;
      if (msg.peerId.userId == null) return;
      if (msg.peerId.userId.toString() !== botId) return;
      finish(msg);
    }
    async function onRaw(update) {
      try {
        if ((update.className || "").indexOf("Edit") === -1) return;
        var msg = update.message;
        if (!msg) return;
        var sid = (msg.peerId && msg.peerId.userId) ? msg.peerId.userId.toString() :
                  (msg.fromId && msg.fromId.userId) ? msg.fromId.userId.toString() : "";
        if (sid !== botId) return;
        finish(msg);
      } catch(e) {}
    }
    client.addEventHandler(onNew, new NewMessage({ fromUsers: [BOT] }));
    client.addEventHandler(onRaw, new Raw({}));
  });
}

// ══ انتظار فيديو فقط (مش صوت) ══
function waitForVideo(client, botId, timeout) {
  timeout = timeout || 90000;
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      reject(new Error("البوت لم يرسل الفيديو"));
    }, timeout);
    var resolved = false;
    function finish(msg) {
      if (resolved) return;
      // قبول فيديو فقط — مش صوت
      var mimeType = (msg.document && msg.document.mimeType) ? msg.document.mimeType : "";
      var hasVideo = msg.video || mimeType.indexOf("video") !== -1;
      if (!hasVideo) return;
      resolved = true;
      clearTimeout(timer);
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      resolve(msg);
    }
    async function onNew(ev) {
      var msg = ev.message;
      if (!msg || msg.peerId == null) return;
      if (msg.peerId.userId == null) return;
      if (msg.peerId.userId.toString() !== botId) return;
      finish(msg);
    }
    async function onRaw(update) {
      try {
        if ((update.className || "").indexOf("Edit") === -1) return;
        var msg = update.message;
        if (!msg) return;
        var sid = (msg.peerId && msg.peerId.userId) ? msg.peerId.userId.toString() :
                  (msg.fromId && msg.fromId.userId) ? msg.fromId.userId.toString() : "";
        if (sid !== botId) return;
        finish(msg);
      } catch(e) {}
    }
    client.addEventHandler(onNew, new NewMessage({ fromUsers: [BOT] }));
    client.addEventHandler(onRaw, new Raw({}));
  });
}

// ══ انتظار أي ملف (فيديو أو صوت) ══
function waitForFile(client, botId, timeout) {
  timeout = timeout || 90000;
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      reject(new Error("البوت لم يرسل الملف"));
    }, timeout);
    var resolved = false;
    function finish(msg) {
      if (resolved) return;
      var mimeType = (msg.document && msg.document.mimeType) ? msg.document.mimeType : "";
      var hasVideo = msg.video || mimeType.indexOf("video") !== -1;
      var hasAudio = msg.audio || mimeType.indexOf("audio") !== -1;
      if (!hasVideo && !hasAudio) return;
      resolved = true;
      clearTimeout(timer);
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      resolve(msg);
    }
    async function onNew(ev) {
      var msg = ev.message;
      if (!msg || msg.peerId == null) return;
      if (msg.peerId.userId == null) return;
      if (msg.peerId.userId.toString() !== botId) return;
      finish(msg);
    }
    async function onRaw(update) {
      try {
        if ((update.className || "").indexOf("Edit") === -1) return;
        var msg = update.message;
        if (!msg) return;
        var sid = (msg.peerId && msg.peerId.userId) ? msg.peerId.userId.toString() :
                  (msg.fromId && msg.fromId.userId) ? msg.fromId.userId.toString() : "";
        if (sid !== botId) return;
        finish(msg);
      } catch(e) {}
    }
    client.addEventHandler(onNew, new NewMessage({ fromUsers: [BOT] }));
    client.addEventHandler(onRaw, new Raw({}));
  });
}

// ══ استخراج الأزرار ══
function extractButtons(msg) {
  var rows = (msg.replyMarkup && msg.replyMarkup.rows) ? msg.replyMarkup.rows : [];
  var btns = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    for (var j = 0; j < (row.buttons || []).length; j++) {
      var btn = row.buttons[j];
      var t = btn.text ? btn.text.trim() : "";
      if (t.length > 0) btns.push({ text: t, data: btn.data });
    }
  }
  return btns;
}

// ══ ضغط زر ══
async function clickBtn(client, botEntity, msg, btn) {
  try {
    await client.invoke(new Api.messages.GetBotCallbackAnswer({
      peer:  botEntity,
      msgId: msg.id,
      data:  btn.data || Buffer.from(btn.text)
    }));
  } catch(e) {
    try { await msg.click({ text: btn.text }); } catch(e2) {}
  }
}

// ══ تنزيل وإرسال الفيديو للمسنجر ══
async function downloadAndSend(api, client, msg, threadID, messageID, label) {
  var mimeType = (msg.document && msg.document.mimeType) ? msg.document.mimeType : "";
  var isAudio = msg.audio || mimeType.indexOf("audio") !== -1;
  var ext = isAudio ? ".mp3" : ".mp4";
  var tmpDir = path.join(process.cwd(), "tmp");
  var file = path.join(tmpDir, "dl_" + Date.now() + ext);
  await fs.ensureDir(tmpDir);

  await client.downloadMedia(msg, { outputFile: file });

  var stat = null;
  try { stat = await fs.stat(file); } catch(e) {}
  if (!stat || stat.size === 0) {
    try { await fs.remove(file); } catch(e) {}
    throw new Error("فشل التنزيل — الملف فارغ");
  }

  var sizeMB = (stat.size / 1024 / 1024).toFixed(2);

  await new Promise(function(resolve, reject) {
    api.sendMessage(
      { body: (label || "✅") + " | " + sizeMB + " MB",
        attachment: require("fs").createReadStream(file) },
      threadID,
      function(err, info) {
        fs.remove(file).catch(function() {});
        if (err) reject(new Error("فشل إرسال الملف: " + err));
        else resolve(info);
      },
      messageID
    );
  });
}

module.exports.config = {
  name: "نزل",
  version: "8.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "تنزيل فيديو من كل مواقع التواصل",
  commandCategory: "media",
  usages: "نزل [رابط]",
  cooldowns: 15
};

const BOT = "C_5BOT";
global.نزلSessions = global.نزلSessions || {};

module.exports.run = async function({ api, event, args }) {
  var threadID = event.threadID;
  var messageID = event.messageID;
  var senderID = event.senderID;

  var url = args.join(" ").trim();
  if (!url && event.messageReply && event.messageReply.body) {
    var m = event.messageReply.body.match(/https?:\/\/[^\s]+/);
    if (m) url = m[0];
  }

  if (!url || url.indexOf("http") !== 0)
    return api.sendMessage("⬇️ تنزيل فيديو\n\nnزل [رابط]", threadID, messageID);

  if (typeof global.getTgClient !== "function")
    return api.sendMessage("❌ سجّل دخول: .tglogin +964XXXXXXXXXX", threadID, messageID);

  try { if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, function() {}, true); } catch(e) {}

  try {
    var client = await global.getTgClient();
    var botEntity = await client.getEntity(BOT);
    var botId = botEntity.id.toString();

    await client.sendMessage(BOT, { message: url });
    var btnsMsg = await waitForButtons(client, botId, 90000);
    var buttons = extractButtons(btnsMsg);

    var listText = "⬇️ اختر نوع التنزيل:\n\n";
    for (var i = 0; i < buttons.length; i++) {
      listText += (i + 1) + ". " + buttons[i].text + "\n";
    }
    listText += "\n↩️ رد برقم";

    api.sendMessage(listText, threadID, function(err, info) {
      if (err || !info) return;
      global.نزلSessions[info.messageID] = { btnsMsg: btnsMsg, buttons: buttons, client: client, botId: botId, botEntity: botEntity };
      global.client.handleReply.push({
        messageID: info.messageID, threadID: threadID, name: "نزل", author: senderID
      });
    }, messageID);

    try { if (api.setMessageReaction) api.setMessageReaction("✅", messageID, function() {}, true); } catch(e) {}
  } catch(e) {
    try { if (api.setMessageReaction) api.setMessageReaction("❌", messageID, function() {}, true); } catch(e2) {}
    api.sendMessage("❌ فشل\n" + e.message, threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  var threadID = event.threadID;
  var messageID = event.messageID;
  var sentMsgID = handleReply.messageID;
  var session = global.نزلSessions[sentMsgID];
  if (!session) return api.sendMessage("❌ انتهت الجلسة", threadID, messageID);

  var btnsMsg = session.btnsMsg;
  var buttons = session.buttons;
  var client = session.client;
  var botId = session.botId;
  var botEntity = session.botEntity;
  var choiceNum = parseInt((event.body || "").trim());

  if (!choiceNum || choiceNum < 1 || choiceNum > buttons.length)
    return api.sendMessage("❌ اختر بين 1 و " + buttons.length, threadID, messageID);

  delete global.نزلSessions[sentMsgID];
  global.client.handleReply = global.client.handleReply.filter(function(h) { return h.messageID !== sentMsgID; });

  try { if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, function() {}, true); } catch(e) {}

  var selectedBtn = buttons[choiceNum - 1];
  var isVideoChoice = selectedBtn.text.indexOf("فيديو") !== -1 ||
                      selectedBtn.text.indexOf("video") !== -1 ||
                      selectedBtn.text.indexOf("مقطع") !== -1;

  try {
    await clickBtn(client, botEntity, btnsMsg, selectedBtn);
    // إذا اختار فيديو — انتظر فيديو فقط، غير ذلك انتظر أي ملف
    var fileMsg = isVideoChoice
      ? await waitForVideo(client, botId, 90000)
      : await waitForFile(client, botId, 90000);

    await downloadAndSend(api, client, fileMsg, threadID, messageID, selectedBtn.text);
    try { if (api.setMessageReaction) api.setMessageReaction("✅", messageID, function() {}, true); } catch(e) {}
  } catch(e) {
    try { if (api.setMessageReaction) api.setMessageReaction("❌", messageID, function() {}, true); } catch(e2) {}
    api.sendMessage("❌ فشل التنزيل\n" + e.message, threadID, messageID);
  }
};
