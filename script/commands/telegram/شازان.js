// ══════════════════════════════════════════════════════════════
//   شازام v2 — يستقبل الـ edit من البوت
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage }       = require("telegram/events");
const { EditedMessage }    = require("telegram/events");

module.exports.config = {
  name: "شازام",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "البحث عن أغنية بكلماتها",
  commandCategory: "media",
  usages: "شازام [كلمات الأغنية]",
  cooldowns: 15
};

const BOT     = "Lyrics23_bot";
const WAIT_MS = 40000;

// ── انتظار رسالة جديدة أو edit من البوت ──
function waitForBotResponse(client, botId, timeout = WAIT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(newHandler, new NewMessage({}));
      client.removeEventHandler(editHandler, new EditedMessage({}));
      reject(new Error("البوت لم يرد"));
    }, timeout);

    const onMsg = async (ev) => {
      const msg = ev.message;
      if (msg.peerId?.userId?.toString() !== botId) return;
      if (!msg.message && !msg.replyMarkup) return;

      // تجاهل رسالة الانتظار ⏳
      if (msg.message?.trim() === "⏳" || msg.message?.length < 5) return;

      clearTimeout(timer);
      client.removeEventHandler(newHandler, new NewMessage({}));
      client.removeEventHandler(editHandler, new EditedMessage({}));
      resolve(msg);
    };

    const newHandler  = { callback: onMsg };
    const editHandler = { callback: onMsg };

    client.addEventHandler(onMsg, new NewMessage({ fromUsers: [BOT] }));
    client.addEventHandler(onMsg, new EditedMessage({ fromUsers: [BOT] }));
  });
}

// ── استخراج الأزرار ──
function extractButtons(msg) {
  const rows = msg.replyMarkup?.rows || [];
  const buttons = [];
  for (const row of rows) {
    for (const btn of (row.buttons || [])) {
      if (btn.text) buttons.push(btn.text);
    }
  }
  return buttons;
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const lyrics = args.join(" ").trim();

  if (!lyrics) {
    return api.sendMessage(
      "🎵 البحث عن أغنية بكلماتها\n\n" +
      "الاستخدام:\n" +
      "شازام [كلمات الأغنية]\n\n" +
      "مثال:\n" +
      "شازام never gonna give you up",
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
  api.sendMessage("🎵 جاري البحث عن: " + lyrics + "\n⏳ انتظر...", threadID, messageID);

  try {
    const client    = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId     = botEntity.id.toString();

    // ── إرسال الكلمات وانتظار الرد النهائي (بعد الـ edit) ──
    await client.sendMessage(BOT, { message: lyrics });
    const listMsg = await waitForBotResponse(client, botId, WAIT_MS);

    const buttons = extractButtons(listMsg);

    if (buttons.length === 0) {
      return api.sendMessage(
        "🎵 النتيجة:\n\n" + (listMsg.message || "لم يتم العثور على نتائج"),
        threadID, messageID
      );
    }

    // ── بناء وإرسال القائمة للمستخدم ──
    let listText = "🎵 نتائج البحث عن:\n\"" + lyrics + "\"\n\n";
    buttons.forEach((btn, i) => {
      listText += `${i + 1}. ${btn}\n`;
    });
    listText += "\n↩️ رد على هذه الرسالة برقم الأغنية";

    // إرسال القائمة وحفظ الـ messageID
    api.sendMessage(listText, threadID, async (err, info) => {
      if (err || !info) return;

      const listMsgID = info.messageID;

      // ── تسجيل handleReply لانتظار رد المستخدم ──
      global.client.handleReply.push({
        messageID: listMsgID,
        threadID,
        type: "reply",
        author: senderID,
        callback: async ({ event: replyEvent }) => {
          const choiceNum = parseInt(replyEvent.body?.trim());

          if (!choiceNum || choiceNum < 1 || choiceNum > buttons.length) {
            return api.sendMessage(
              "❌ اختر رقماً بين 1 و " + buttons.length,
              threadID, replyEvent.messageID
            );
          }

          if (api.setMessageReaction) api.setMessageReaction("⏳", replyEvent.messageID, () => {}, true);
          api.sendMessage("⏳ جاري جلب الأغنية رقم " + choiceNum + "...", threadID, replyEvent.messageID);

          const selectedBtn = buttons[choiceNum - 1];

          try {
            // ── ضغط الزر المناسب ──
            await listMsg.click({ text: selectedBtn });

            // ── انتظار رد البوت بعد الضغط ──
            const resultMsg = await waitForBotResponse(client, botId, 30000);

            api.sendMessage(
              "🎵 " + selectedBtn + "\n\n" + (resultMsg.message || "✅ تم"),
              threadID, replyEvent.messageID
            );

            if (api.setMessageReaction) api.setMessageReaction("✅", replyEvent.messageID, () => {}, true);

          } catch(e) {
            if (api.setMessageReaction) api.setMessageReaction("❌", replyEvent.messageID, () => {}, true);
            api.sendMessage("❌ فشل جلب الأغنية\n\n" + e.message, threadID, replyEvent.messageID);
          }
        }
      });

    }, messageID);

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("❌ شازام:", e.message);
    api.sendMessage("❌ فشل البحث\n\n" + e.message, threadID, messageID);
  }
};
