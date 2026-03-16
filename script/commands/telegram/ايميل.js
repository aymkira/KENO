// ══════════════════════════════════════════════════════════════
//   EMAIL — إنشاء إيميل مؤقت عبر @smtpbot
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");

module.exports.config = {
  name: "email",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "إنشاء إيميل مؤقت عبر تيليجرام",
  commandCategory: "tools",
  usages: "email",
  cooldowns: 15
};

const BOT  = "smtpbot";
const WAIT = 30000;

async function askBot(client, message) {
  return new Promise(async (resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("البوت لم يرد"));
    }, WAIT);

    let botId;
    try { botId = (await client.getEntity(BOT)).id.toString(); }
    catch(e) { clearTimeout(timer); return reject(new Error("تعذر الوصول للبوت")); }

    const handler = async (ev) => {
      const msg = ev.message;
      if (msg.peerId?.userId?.toString() !== botId) return;
      if (!msg.message || msg.message.length < 5) return;

      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({}));
      resolve(msg.message);
    };

    client.addEventHandler(handler, new NewMessage({ fromUsers: [BOT] }));

    try {
      await client.sendMessage(BOT, { message });
    } catch(e) {
      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("فشل الإرسال: " + e.message));
    }
  });
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (typeof global.getTgClient !== "function") {
    return api.sendMessage(
      "❌ سجّل دخول تيليجرام أولاً:\n.tglogin +964XXXXXXXXXX",
      threadID, messageID
    );
  }

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);
  api.sendMessage("📧 جاري إنشاء إيميل مؤقت...", threadID, messageID);

  try {
    const client = await global.getTgClient();
    const result = await askBot(client, "/me");

    // استخراج الإيميل من الرد
    const emailMatch = result.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    const emailAddr  = emailMatch ? emailMatch[0] : null;

    const msg = emailAddr
      ? "📧 إيميلك المؤقت:\n\n" +
        "✉️ " + emailAddr + "\n\n" +
        "📋 انسخه واستخدمه في أي موقع\n" +
        "⚠️ قد ينتهي بعد فترة"
      : "📧 رد البوت:\n\n" + result;

    api.sendMessage(msg, threadID, messageID);
    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("❌ فشل إنشاء الإيميل\n\n" + e.message, threadID, messageID);
  }
};
