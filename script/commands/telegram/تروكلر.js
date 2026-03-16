// ══════════════════════════════════════════════════════════════
//   TRUECALLER — البحث عن معلومات رقم هاتف عبر @Truecallertobot
//   by Ayman v3
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");

module.exports.config = {
  name: "تروكلر",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "البحث عن معلومات رقم الهاتف",
  commandCategory: "tools",
  usages: "تروكلر [رقم الهاتف]",
  cooldowns: 10
};

const BOT     = "Truecallertobot";
const WAIT_MS = 40000;

async function askBot(client, botId, phone) {
  return new Promise(async (resolve, reject) => {
    const messages   = [];
    let collectTimer = null;

    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({}));
      // إذا جمعنا رسائل ارجعها حتى لو انتهى الوقت
      if (messages.length > 0) {
        resolve(messages.join("\n\n"));
      } else {
        reject(new Error("البوت لم يرد — تأكد من صحة الرقم"));
      }
    }, WAIT_MS);

    const handler = async (ev) => {
      const msg = ev.message;
      if (msg.peerId?.userId?.toString() !== botId) return;
      if (!msg.message || msg.message.length < 3) return;

      const lower = msg.message.toLowerCase();

      // تجاهل رسائل الانتظار
      if (
        lower.includes("searching") ||
        lower.includes("please wait") ||
        lower.includes("loading") ||
        lower.includes("جاري") ||
        lower.includes("انتظر")
      ) return;

      // أضف الرسالة للمجموعة
      messages.push(msg.message);

      // بعد أول رسالة حقيقية — انتظر 4 ثواني لجمع باقي الرسائل
      if (collectTimer) clearTimeout(collectTimer);
      collectTimer = setTimeout(() => {
        clearTimeout(timer);
        client.removeEventHandler(handler, new NewMessage({}));
        resolve(messages.join("\n\n─────────────\n\n"));
      }, 4000);
    };

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
  const { threadID, messageID } = event;

  const phone = args.join("").trim();

  if (!phone) {
    return api.sendMessage(
      "📞 البحث عن معلومات رقم الهاتف\n\n" +
      "الاستخدام:\n" +
      "تروكلر [رقم]\n\n" +
      "مثال:\n" +
      "تروكلر +9647XXXXXXXXX\n" +
      "تروكلر 009647XXXXXXXXX",
      threadID, messageID
    );
  }

  // تنسيق الرقم
  let formattedPhone = phone;
  if (phone.startsWith("00")) {
    formattedPhone = "+" + phone.slice(2);
  } else if (!phone.startsWith("+")) {
    formattedPhone = "+" + phone;
  }

  if (typeof global.getTgClient !== "function") {
    return api.sendMessage(
      "❌ سجّل دخول تيليجرام أولاً:\n.tglogin +964XXXXXXXXXX",
      threadID, messageID
    );
  }

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);
  api.sendMessage("🔍 جاري البحث عن: " + formattedPhone + "...", threadID, messageID);

  try {
    const client    = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId     = botEntity.id.toString();

    const result = await askBot(client, botId, formattedPhone);

    api.sendMessage(
      "📞 نتيجة البحث:\n\n" + result,
      threadID, messageID
    );

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("❌ تروكلر:", e.message);
    api.sendMessage(
      "❌ فشل البحث\n\n" + e.message,
      threadID, messageID
    );
  }
};
