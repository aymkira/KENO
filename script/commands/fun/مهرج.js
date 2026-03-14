const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "مهرج",
  version: "2.5.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "رمي  (نظام تبديل تلقائي مستقر)",
  commandCategory: "fun",
  usages: "مهرج [@منشن/ID/رد]",
  cooldowns: 5
};

module.exports.handleEvent = async function({ api, event }) {
  const { messageID, reaction, messageReply } = event;
  if (reaction === "👍" && messageReply?.senderID === api.getCurrentUserID()) {
    return api.unsendMessage(messageReply.messageID);
  }
};

module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;
  const cacheDir = path.join(__dirname, 'cache');
  const imagePath = path.join(cacheDir, `toilet_${senderID}.png`);

  let targetID;
  if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else if (type === "message_reply") {
    targetID = messageReply.senderID;
  } else if (args[0] && !isNaN(args[0])) {
    targetID = args[0];
  }

  if (!targetID) {
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nمن تريد رميه في الحمام؟ قم بالإشارة إليه أو الرد عليه", threadID, messageID);
  }

  try {
    const senderName = await Users.getNameUser(senderID);
    const targetName = await Users.getNameUser(targetID);
    const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    let response;
    try {
      // المحاولة الأولى: المصدر الأساسي
      response = await axios.get(`https://www.api.vyturex.com/toilet?userid=${targetID}`, { responseType: 'arraybuffer', timeout: 5000 });
    } catch (e) {
      // المحاولة الثانية (Fallback): إذا فشل الأول نستخدم قالب Clown أو Wanted لضمان استمرار اللعب
      const fallbackUrl = `https://api.popcat.xyz/clown?image=${encodeURIComponent(avatarUrl)}`;
      response = await axios.get(fallbackUrl, { responseType: 'arraybuffer' });
    }
    
    fs.ensureDirSync(cacheDir);
    fs.writeFileSync(imagePath, Buffer.from(response.data, 'utf-8'));

    return api.sendMessage({
      body: `⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\n${senderName} يرمي ${targetName} في الحمام`,
      attachment: fs.createReadStream(imagePath)
    }, threadID, () => {
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }, messageID);

  } catch (error) {
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nعذراً، محرك الصور تحت الصيانة حالياً.`, threadID, messageID);
  }
};
