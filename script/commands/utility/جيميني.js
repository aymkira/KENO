const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "جيميني",
  aliases: ["geminigen", "gen"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "RIFAT + Saim",
  description: "توليد وتعديل الصور بالذكاء الاصطناعي",
  commandCategory: "image generator",
  usages: "<وصف الصورة> | رد على صورة لتعديلها",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;

  // ── help ──────────────────────────────────────────────────
  if (args[0]?.toLowerCase() === "help") {
    return api.sendMessage(
`╔══ 🎨 𝗝𝗘𝗠𝗜𝗡𝗜𝗚𝗘𝗡 ══╗
┃
┃ ✏️ .جيميني [وصف]
┃ 📎 أو رد على صورة مع وصف
┃
┃ 🔧 أمثلة:
┃ ━━━━━━━━━━━━━━━
┃ .جيميني قط محارب
┃ .جيميني وجه أنمي
┃ .جيميني صورة كارتون
┃ .جيميني خلفية نارية
┃
╚════════════════════╝`,
      threadID, messageID
    );
  }

  // ── prompt ────────────────────────────────────────────────
  let prompt = args.join(" ");
  if (!prompt && messageReply?.body) prompt = messageReply.body;

  if (!prompt) {
    return api.sendMessage(
      "⚠️ اكتب وصف الصورة\nمثال: .جيميني قط في الفضاء\nأو رد على صورة مع وصف\nاكتب .جيميني help لأمثلة أكثر",
      threadID, messageID
    );
  }

  // ── صورة مرفقة للتعديل ────────────────────────────────────
  let imageURL = null;
  if (messageReply?.attachments?.[0]?.type === "photo") {
    imageURL = messageReply.attachments[0].url;
  }

  const apiUrl = imageURL
    ? `https://edit-and-gen.onrender.com/gen?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(imageURL)}`
    : `https://edit-and-gen.onrender.com/gen?prompt=${encodeURIComponent(prompt)}`;

  api.setMessageReaction("🎨", messageID, () => {}, true);

  // ── رسالة انتظار ──────────────────────────────────────────
  const waitMsg = await new Promise(resolve =>
    api.sendMessage("🎨 جاري المعالجة، انتظر...", threadID, (err, info) => resolve(info), messageID)
  );

  try {
    const res = await axios.get(apiUrl, { responseType: "stream", timeout: 60000 });

    try { await api.unsendMessage(waitMsg.messageID); } catch (_) {}

    api.setMessageReaction("✅", messageID, () => {}, true);

    api.sendMessage({
      body: `✅ ${imageURL ? "تم تعديل" : "تم توليد"} الصورة\n🖋️ "${prompt}"`,
      attachment: res.data
    }, threadID, messageID);

  } catch (err) {
    try { await api.unsendMessage(waitMsg.messageID); } catch (_) {}
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("❌ فشل في معالجة الصورة، حاول لاحقاً", threadID, messageID);
  }
};
