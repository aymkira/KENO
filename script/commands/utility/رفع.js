
const axios = require('axios');

module.exports.config = {
  name: "رابط",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "تحويل الوسائط إلى روابط دائمة",
  commandCategory: "utility",
  usages: "رابط [رد على صورة/فيديو]",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, messageReply, attachments } = event;

  let mediaLinks = [];

  if (messageReply?.attachments?.length > 0) {
    mediaLinks = messageReply.attachments.map(a => a.url);
  } else if (attachments?.length > 0) {
    mediaLinks = attachments.map(a => a.url);
  }

  if (mediaLinks.length === 0) {
    return api.sendMessage(
      "⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n⚠️ قم بالرد على صورة أو فيديو.",
      threadID, messageID
    );
  }

  api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n⏳ جاري رفع ${mediaLinks.length} ملف...`,
    threadID
  );

  try {
    const results = [];

    for (const url of mediaLinks) {
      try {
        const res = await axios.get(
          `https://api.vyturex.com/imgur?url=${encodeURIComponent(url)}`,
          { timeout: 15000 }
        );
        if (res.data?.image) results.push(res.data.image);
      } catch (e) {
        console.error("فشل رفع:", e.message);
      }
    }

    if (results.length === 0) throw new Error("فشل رفع جميع الملفات");

    const links = results.map((r, i) => `${i + 1}. 🔗 ${r}`).join("\n");

    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n✅ تم رفع ${results.length}/${mediaLinks.length} ملف:\n\n${links}`,
      threadID, messageID
    );

  } catch (e) {
    console.error(e);
    return api.sendMessage(
      "⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n❌ فشل الرفع، حاول لاحقاً.",
      threadID, messageID
    );
  }
};
