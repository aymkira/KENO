// تروكلر v4 — يأخذ أطول رسالة (30+ حرف)
const { NewMessage } = require("telegram/events");

module.exports.config = {
  name: "تروكلر",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "البحث عن معلومات رقم الهاتف",
  commandCategory: "tools",
  usages: "تروكلر [رقم]",
  cooldowns: 10
};

const BOT     = "Truecallertobot";
const WAIT_MS = 40000;

async function askBot(client, botId, phone) {
  return new Promise(async function(resolve, reject) {
    var messages = [];
    var collectTimer = null;

    var timer = setTimeout(function() {
      client.removeEventHandler(handler, new NewMessage({}));
      if (messages.length > 0) {
        // أرجع أطول رسالة
        var longest = messages.reduce(function(a, b) { return a.length >= b.length ? a : b; });
        resolve(longest);
      } else {
        reject(new Error("البوت لم يرد — تأكد من صحة الرقم"));
      }
    }, WAIT_MS);

    async function handler(ev) {
      var msg = ev.message;
      if (!msg.peerId || msg.peerId.userId == null) return;
      if (msg.peerId.userId.toString() !== botId) return;
      if (!msg.message || msg.message.length < 3) return;

      var lower = msg.message.toLowerCase();
      if (lower.indexOf("searching") !== -1 ||
          lower.indexOf("please wait") !== -1 ||
          lower.indexOf("loading") !== -1 ||
          lower.indexOf("جاري") !== -1 ||
          lower.indexOf("انتظر") !== -1) return;

      // قبول فقط رسائل 30+ حرف
      if (msg.message.length < 30) return;

      messages.push(msg.message);

      if (collectTimer) clearTimeout(collectTimer);
      collectTimer = setTimeout(function() {
        clearTimeout(timer);
        client.removeEventHandler(handler, new NewMessage({}));
        // أرجع أطول رسالة
        var longest = messages.reduce(function(a, b) { return a.length >= b.length ? a : b; });
        resolve(longest);
      }, 4000);
    }

    client.addEventHandler(handler, new NewMessage({ fromUsers: [BOT] }));

    try {
      await client.sendMessage(BOT, { message: phone });
    } catch(e) {
      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("فشل الإرسال: " + e.message));
    }
  });
}

module.exports.run = async function({ api, event, args }) {
  var threadID = event.threadID;
  var messageID = event.messageID;
  var phone = args.join("").trim();

  if (!phone) return api.sendMessage(
    "📞 البحث عن معلومات رقم الهاتف\n\nتروكلر [رقم]\n\nمثال:\nتروكلر +9647XXXXXXXXX",
    threadID, messageID
  );

  if (phone.indexOf("00") === 0) phone = "+" + phone.slice(2);
  else if (phone.indexOf("+") !== 0) phone = "+" + phone;

  if (typeof global.getTgClient !== "function")
    return api.sendMessage("❌ سجّل دخول: .tglogin +964XXXXXXXXXX", threadID, messageID);

  try { if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, function() {}, true); } catch(e) {}
  api.sendMessage("🔍 جاري البحث عن: " + phone + "...", threadID, messageID);

  try {
    var client = await global.getTgClient();
    var botEntity = await client.getEntity(BOT);
    var botId = botEntity.id.toString();
    var result = await askBot(client, botId, phone);
    api.sendMessage("📞 نتيجة البحث:\n\n" + result, threadID, messageID);
    try { if (api.setMessageReaction) api.setMessageReaction("✅", messageID, function() {}, true); } catch(e) {}
  } catch(e) {
    try { if (api.setMessageReaction) api.setMessageReaction("❌", messageID, function() {}, true); } catch(e2) {}
    api.sendMessage("❌ فشل البحث\n\n" + e.message, threadID, messageID);
  }
};
