module.exports.config = {
  name: "ضغط",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "أيمن",
  description: "تقليل حجم الصور بتنسيق كيرا",
  commandCategory: "pic",
  usages: "[رد على صورة]",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const sharp = require("sharp");
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");

  if (event.type !== "message_reply" || !event.messageReply.attachments[0]) {
    return api.sendMessage("⚠️ رُد على صورة يا بطل!", event.threadID);
  }

  try {
    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    
    const imgUrl = event.messageReply.attachments[0].url;
    const res = await axios.get(imgUrl, { responseType: 'arraybuffer' });
    
    const buffer = await sharp(res.data)
      .jpeg({ quality: 50, mozjpeg: true })
      .toBuffer();

    const cachePath = path.join(__dirname, 'cache', `compressed_${Date.now()}.jpg`);
    fs.outputFileSync(cachePath, buffer);

    const oldSize = (res.data.length / 1024).toFixed(1);
    const newSize = (buffer.length / 1024).toFixed(1);

    // --- الزخرفة المتفق عليها ---
    const msg = {
      body: `⌬ ━━━ 𝗞𝗜𝗥𝗔 𝗧𝗢𝗢𝗟𝗦 ━━━ ⌬\n\n` +
            `📉 تـم ضـغـط الـصـورة بنـجـاح!\n\n` +
            `📁 قـبـل: ${oldSize} KB\n` +
            `✅ بـعـد: ${newSize} KB\n` +
            `✨ الـتـوفـيـر: ${(((oldSize-newSize)/oldSize)*100).toFixed(0)}%\n\n` +
            `⌬ ━━━━━━━━━━━━━━ ⌬`,
      attachment: fs.createReadStream(cachePath)
    };

    api.sendMessage(msg, event.threadID, () => fs.unlinkSync(cachePath));
    api.setMessageReaction("✅", event.messageID, () => {}, true);

  } catch (e) { api.sendMessage("❌ فشل الضغط", event.threadID); }
};
