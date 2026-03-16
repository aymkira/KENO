// لوكو — تصميم لوغو عبر @logokirabot
const { NewMessage } = require("telegram/events");
const { Raw }        = require("telegram/events");
const fs             = require("fs-extra");
const path           = require("path");

module.exports.config = {
  name: "لوكو",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "تصميم لوغو احترافي",
  commandCategory: "design",
  usages: "لوكو [اسم الشركة] / [الشعار]",
  cooldowns: 30
};

const BOT     = "logokirabot";
const WAIT_MS = 60000;

// انتظار رسالة فيها أزرار
function waitForButtons(client, botId, timeout) {
  timeout = timeout || WAIT_MS;
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      reject(new Error("البوت لم يرد"));
    }, timeout);
    var resolved = false;
    function finish(msg) {
      if (resolved) return;
      if (!msg.replyMarkup || !msg.replyMarkup.rows || msg.replyMarkup.rows.length === 0) return;
      resolved = true;
      clearTimeout(timer);
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      resolve(msg);
    }
    async function onNew(ev) {
      var msg = ev.message;
      if (!msg || !msg.peerId || msg.peerId.userId == null) return;
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

// انتظار أي رسالة من البوت (نص أو صورة)
function waitForMsg(client, botId, timeout) {
  timeout = timeout || WAIT_MS;
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      reject(new Error("البوت لم يرد"));
    }, timeout);
    var resolved = false;
    function finish(msg) {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      resolve(msg);
    }
    async function onNew(ev) {
      var msg = ev.message;
      if (!msg || !msg.peerId || msg.peerId.userId == null) return;
      if (msg.peerId.userId.toString() !== botId) return;
      finish(msg);
    }
    client.addEventHandler(onNew, new NewMessage({ fromUsers: [BOT] }));
  });
}

// انتظار صورة
function waitForPhoto(client, botId, timeout) {
  timeout = timeout || 90000;
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      reject(new Error("البوت لم يرسل الصورة"));
    }, timeout);
    var resolved = false;
    function finish(msg) {
      if (resolved) return;
      var hasPhoto = msg.photo || (msg.document && (msg.document.mimeType || "").indexOf("image") !== -1);
      if (!hasPhoto) return;
      resolved = true;
      clearTimeout(timer);
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      resolve(msg);
    }
    async function onNew(ev) {
      var msg = ev.message;
      if (!msg || !msg.peerId || msg.peerId.userId == null) return;
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

module.exports.run = async function({ api, event, args }) {
  var threadID = event.threadID;
  var messageID = event.messageID;

  var input = args.join(" ").trim();

  if (!input || input.indexOf("/") === -1) {
    return api.sendMessage(
      "🎨 تصميم لوغو\n\n" +
      "الاستخدام:\n" +
      "لوكو [اسم الشركة] / [الشعار]\n\n" +
      "مثال:\n" +
      "لوكو Kira / أسرع بوت",
      threadID, messageID
    );
  }

  var parts = input.split("/");
  var company = parts[0].trim();
  var slogan  = parts[1] ? parts[1].trim() : "";

  if (!company) return api.sendMessage("❌ اكتب اسم الشركة", threadID, messageID);
  if (!slogan)  return api.sendMessage("❌ اكتب الشعار بعد /", threadID, messageID);

  if (typeof global.getTgClient !== "function")
    return api.sendMessage("❌ سجّل دخول: .tglogin +964XXXXXXXXXX", threadID, messageID);

  try { if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, function() {}, true); } catch(e) {}
  api.sendMessage("🎨 جاري تصميم لوغو لـ: " + company + "\n⏳ انتظر...", threadID, messageID);

  var imgPath = null;

  try {
    var client    = await global.getTgClient();
    var botEntity = await client.getEntity(BOT);
    var botId     = botEntity.id.toString();

    // 1. إرسال /start
    await client.sendMessage(BOT, { message: "/start" });

    // 2. انتظار زر "إنشاء لوغو جديد"
    var startMsg = await waitForButtons(client, botId, 15000);
    var rows = startMsg.replyMarkup.rows || [];
    var newLogoBtn = null;
    for (var i = 0; i < rows.length; i++) {
      for (var j = 0; j < (rows[i].buttons || []).length; j++) {
        if ((rows[i].buttons[j].text || "").indexOf("إنشاء") !== -1 ||
            (rows[i].buttons[j].text || "").indexOf("جديد") !== -1 ||
            (rows[i].buttons[j].text || "").indexOf("لوغو") !== -1) {
          newLogoBtn = rows[i].buttons[j];
        }
      }
    }
    // اضغط أول زر إذا ما لقينا
    if (!newLogoBtn && rows[0] && rows[0].buttons && rows[0].buttons[0]) {
      newLogoBtn = rows[0].buttons[0];
    }
    if (newLogoBtn) {
      try {
        var { Api } = require("telegram");
        await client.invoke(new Api.messages.GetBotCallbackAnswer({
          peer: botEntity, msgId: startMsg.id,
          data: newLogoBtn.data || Buffer.from(newLogoBtn.text)
        }));
      } catch(e) { try { await startMsg.click({ text: newLogoBtn.text }); } catch(e2) {} }
      await new Promise(function(r) { setTimeout(r, 1500); });
    }

    // 3. انتظار زرين (بدون شعار / مع شعار)
    var typeMsg = await waitForButtons(client, botId, 15000);
    var typeRows = typeMsg.replyMarkup.rows || [];
    var sloganBtn = null;
    for (var i = 0; i < typeRows.length; i++) {
      for (var j = 0; j < (typeRows[i].buttons || []).length; j++) {
        var btnText = typeRows[i].buttons[j].text || "";
        if (btnText.indexOf("شعار") !== -1 || btnText.indexOf("مع") !== -1) {
          sloganBtn = typeRows[i].buttons[j];
        }
      }
    }
    if (!sloganBtn && typeRows[0] && typeRows[0].buttons) {
      // اختر الزر الأخير (غالباً "مع الشعار")
      var lastRow = typeRows[typeRows.length - 1];
      sloganBtn = lastRow.buttons[lastRow.buttons.length - 1];
    }
    if (sloganBtn) {
      try {
        var { Api } = require("telegram");
        await client.invoke(new Api.messages.GetBotCallbackAnswer({
          peer: botEntity, msgId: typeMsg.id,
          data: sloganBtn.data || Buffer.from(sloganBtn.text)
        }));
      } catch(e) { try { await typeMsg.click({ text: sloganBtn.text }); } catch(e2) {} }
      await new Promise(function(r) { setTimeout(r, 1500); });
    }

    // 4. انتظار "أرسل اسم الشركة" ثم أرسله
    await waitForMsg(client, botId, 10000).catch(function() {});
    await client.sendMessage(BOT, { message: company });
    await new Promise(function(r) { setTimeout(r, 1000); });

    // 5. انتظار "أرسل الشعار" ثم أرسله
    await waitForMsg(client, botId, 10000).catch(function() {});
    await client.sendMessage(BOT, { message: slogan });

    // 6. انتظار الصورة
    var photoMsg = await waitForPhoto(client, botId, 90000);

    // 7. تنزيل وإرسال الصورة
    imgPath = path.join(process.cwd(), "tmp", "logo_" + Date.now() + ".jpg");
    await fs.ensureDir(path.dirname(imgPath));
    await client.downloadMedia(photoMsg, { outputFile: imgPath });

    var stat = await fs.stat(imgPath).catch(function() { return null; });
    if (!stat || stat.size === 0) throw new Error("الصورة فارغة");

    await new Promise(function(resolve, reject) {
      api.sendMessage(
        { body: "🎨 " + company + " | " + slogan, attachment: require("fs").createReadStream(imgPath) },
        threadID,
        function(err, info) {
          fs.remove(imgPath).catch(function() {});
          if (err) reject(new Error("فشل إرسال الصورة"));
          else resolve(info);
        },
        messageID
      );
    });

    try { if (api.setMessageReaction) api.setMessageReaction("✅", messageID, function() {}, true); } catch(e) {}

  } catch(e) {
    try { if (api.setMessageReaction) api.setMessageReaction("❌", messageID, function() {}, true); } catch(e2) {}
    if (imgPath) fs.remove(imgPath).catch(function() {});
    api.sendMessage("❌ فشل تصميم اللوغو\n\n" + e.message, threadID, messageID);
  }
};
