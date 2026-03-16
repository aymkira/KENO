// ══════════════════════════════════════════════════════════════
//   تاكد — التحقق من الروابط عبر @DrWebBot
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");

module.exports.config = {
  name: "تاكد",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "التحقق من أمان الروابط",
  commandCategory: "tools",
  usages: "تاكد [رابط]",
  cooldowns: 10
};

const BOT     = "DrWebBot";
const WAIT_MS = 40000;

async function askBot(client, botId, url) {
  return new Promise(async (resolve, reject) => {
    const messages   = [];
    let collectTimer = null;

    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({}));
      if (messages.length > 0) {
        resolve(messages.join("\n\n─────────────\n\n"));
      } else {
        reject(new Error("البوت لم يرد"));
      }
    }, WAIT_MS);

    const handler = async (ev) => {
      const msg = ev.message;
      if (msg.peerId?.userId?.toString() !== botId) return;
      if (!msg.message || msg.message.length < 3) return;

      // تجاهل رسائل الانتظار
      const lower = msg.message.toLowerCase();
      if (
        lower.includes("searching") ||
        lower.includes("please wait") ||
        lower.includes("loading") ||
        lower.includes("جاري") ||
        lower.includes("انتظر") ||
        lower.includes("checking")
      ) return;

      messages.push(msg.message);

      // انتظر 4 ثواني لجمع باقي الرسائل
      if (collectTimer) clearTimeout(collectTimer);
      collectTimer = setTimeout(() => {
        clearTimeout(timer);
        client.removeEventHandler(handler, new NewMessage({}));
        resolve(messages.join("\n\n─────────────\n\n"));
      }, 4000);
    };

    client.addEventHandler(handler, new NewMessage({ fromUsers: [BOT] }));

    try {
      await client.sendMessage(BOT, { message: url });
    } catch(e) {
      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("فشل الإرسال: " + e.message));
    }
  });
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  const url = args.join(" ").trim() ||
    event.messageReply?.body?.match(/https?:\/\/[^\s]+/)?.[0];

  if (!url || !url.startsWith("http")) {
    return api.sendMessage(
      "🔍 التحقق من أمان الروابط\n\n" +
      "الاستخدام:\n" +
      "تاكد [رابط]\n\n" +
      "مثال:\n" +
      "تاكد https://example.com",
      threadID, messageID
    );
  }

  if (typeof global.getTgClient !== "function") {
    return api.sendMessage(
      "❌ سجّل دخول تيليجرام أولاً:\n.tglogin +964XXXXXXXXXX",
      threadID, messageID
    );
  }

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);
  api.sendMessage("🔍 جاري التحقق من: " + url + "\n⏳ انتظر...", threadID, messageID);

  try {
    const client    = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId     = botEntity.id.toString();

    const result = await askBot(client, botId, url);

    api.sendMessage(
      "🛡️ نتيجة الفحص:\n\n" + result,
      threadID, messageID
    );

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("❌ تاكد:", e.message);
    api.sendMessage("❌ فشل الفحص\n\n" + e.message, threadID, messageID);
  }
};
