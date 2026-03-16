// يوت v4

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
  name: "يوت",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "بحث يوتيوب وتنزيل فيديو",
  commandCategory: "media",
  usages: "يوت [اسم الفيديو]",
  cooldowns: 15
};

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬";
const BOT = "C_5BOT";
global.يوتSessions = global.يوتSessions || {};

async function searchYouTube(query) {
  try {
    var res = await axios.get("https://weeb-api.vercel.app/ytsearch?query=" + encodeURIComponent(query), { timeout: 10000 });
    if (Array.isArray(res.data) && res.data.length > 0) return res.data.slice(0, 5);
  } catch(e) {}
  try {
    var yt = require("yt-search");
    var r = await yt(query);
    return (r.videos || []).slice(0, 5).map(function(v) {
      return { title: v.title, url: v.url, timestamp: v.timestamp, views: v.views, author: v.author ? v.author.name : "" };
    });
  } catch(e) { return []; }
}

module.exports.run = async function({ api, event, args }) {
  var threadID = event.threadID;
  var messageID = event.messageID;
  var senderID = event.senderID;
  var query = args.join(" ").trim();

  if (!query) return api.sendMessage(HEADER + "\n\n🔍 اكتب اسم الفيديو", threadID, messageID);

  try { if (api.setMessageReaction) api.setMessageReaction("🔎", messageID, function() {}, true); } catch(e) {}

  try {
    var results = await searchYouTube(query);
    if (!results || results.length === 0) {
      try { if (api.setMessageReaction) api.setMessageReaction("❌", messageID, function() {}, true); } catch(e) {}
      return api.sendMessage(HEADER + "\n\n❌ لا نتائج", threadID, messageID);
    }

    var listText = "🔍 \"" + query + "\"\n\n";
    for (var i = 0; i < results.length; i++) {
      var v = results[i];
      var t = v.title.length > 40 ? v.title.substring(0, 40) + "..." : v.title;
      listText += (i + 1) + ". " + t + (v.timestamp ? " (" + v.timestamp + ")" : "") + "\n";
    }
    listText += "\n↩️ رد برقم";

    try { if (api.setMessageReaction) api.setMessageReaction("✅", messageID, function() {}, true); } catch(e) {}

    api.sendMessage(listText, threadID, function(err, info) {
      if (err || !info) return;
      global.يوتSessions[info.messageID] = { results: results, senderID: senderID, listMsgID: info.messageID };
      global.client.handleReply.push({ messageID: info.messageID, threadID: threadID, name: "يوت", author: senderID });
      setTimeout(function() {
        try { api.unsendMessage(info.messageID); } catch(e) {}
        delete global.يوتSessions[info.messageID];
        global.client.handleReply = global.client.handleReply.filter(function(h) { return h.messageID !== info.messageID; });
      }, 60000);
    }, messageID);
  } catch(e) {
    try { if (api.setMessageReaction) api.setMessageReaction("❌", messageID, function() {}, true); } catch(e2) {}
    api.sendMessage(HEADER + "\n\n❌ فشل البحث\n" + e.message, threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  var threadID = event.threadID;
  var messageID = event.messageID;
  var sentMsgID = handleReply.messageID;
  var session = global.يوتSessions[sentMsgID];
  if (!session) return;

  var results = session.results;
  var listMsgID = session.listMsgID;
  var choiceNum = parseInt((event.body || "").trim());

  if (!choiceNum || choiceNum < 1 || choiceNum > results.length)
    return api.sendMessage("❌ اختر بين 1 و " + results.length, threadID, messageID);

  delete global.يوتSessions[sentMsgID];
  global.client.handleReply = global.client.handleReply.filter(function(h) { return h.messageID !== sentMsgID; });
  try { api.unsendMessage(listMsgID); } catch(e) {}

  var selected = results[choiceNum - 1];
  try { if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, function() {}, true); } catch(e) {}

  try {
    if (typeof global.getTgClient !== "function") throw new Error("SESSION_REQUIRED");
    var client = await global.getTgClient();
    var botEntity = await client.getEntity(BOT);
    var botId = botEntity.id.toString();

    await client.sendMessage(BOT, { message: selected.url });
    var btnsMsg = await waitForButtons(client, botId, 90000);
    var buttons = extractButtons(btnsMsg);

    // دائماً اضغط زر الفيديو
    var videoBtn = null;
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].text.indexOf("فيديو") !== -1 ||
          buttons[i].text.indexOf("video") !== -1 ||
          buttons[i].text.indexOf("مقطع") !== -1) {
        videoBtn = buttons[i];
        break;
      }
    }
    if (!videoBtn) videoBtn = buttons[0];
    if (!videoBtn) throw new Error("لم يتم إيجاد زر الفيديو");

    await clickBtn(client, botEntity, btnsMsg, videoBtn);

    // انتظر فيديو فقط
    var fileMsg = await waitForVideo(client, botId, 90000);
    var label = selected.title.length > 30 ? selected.title.substring(0, 30) + "..." : selected.title;
    await downloadAndSend(api, client, fileMsg, threadID, messageID, label);

    try { if (api.setMessageReaction) api.setMessageReaction("✅", messageID, function() {}, true); } catch(e) {}
  } catch(e) {
    try { if (api.setMessageReaction) api.setMessageReaction("❌", messageID, function() {}, true); } catch(e2) {}
    api.sendMessage(
      e.message.indexOf("SESSION_REQUIRED") !== -1
        ? "❌ سجّل دخول: .tglogin +964XXXXXXXXXX"
        : "❌ فشل التنزيل\n" + e.message,
      threadID, messageID
    );
  }
};
