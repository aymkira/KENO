const axios = require("axios");

module.exports.config = {
  name: "صفع",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Mustafa 🥷",
  description: "صفعة مؤخرة بأسلوب ساخر وGIF!",
  commandCategory: "🎭 ترفيه",
  usages: "@شخص",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Users }) {
  const mentionID = Object.keys(event.mentions)[0];

  if (!mentionID) {
    return api.sendMessage("✋ من تريد صفعه؟ استخدم الأمر مع الإشارة إلى الشخص.", event.threadID, event.messageID);
  }

  const senderName = (await Users.getData(event.senderID)).name;
  const targetName = event.mentions[mentionID].replace("@", "");

  // جُمل عشوائية مضحكة
  const lines = [
    `💥 ${senderName} صفع ${targetName} صفعة أسطورية على المؤخرة! 🍑`,
    `🍑 ${targetName} تلقى صفعة محترمة من ${senderName}… الصوت وصل للحي المجاور!`,
    `😱 ${senderName} صفع ${targetName} بقوة… المؤخرة الآن تطلب اللجوء الطبي.`,
    `😂 ${targetName} انصدم من صفعة ${senderName}… فينك يا كبرياء؟`,
    `🔥 ${senderName} ما رحم ${targetName} وصفعه صفعة ما ينساها بحياته!`
  ];

  // روابط GIF عشوائية (تقدر تضيف أو تعدل)
  const gifs = [
    "https://media.tenor.com/FMbF2Tq6urUAAAAC/anime-slap.gif",
    "https://media.tenor.com/IN9F9Z2FsYIAAAAC/slap.gif",
    "https://media.tenor.com/YgIl_Gk6g-0AAAAd/slap-anime.gif",
    "https://media.tenor.com/VtK9zLArYpMAAAAC/slap-angry.gif",
    "https://media.tenor.com/jjHh5vP2bCIAAAAC/slap-face.gif"
  ];

  const randomLine = lines[Math.floor(Math.random() * lines.length)];
  const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

  try {
    const response = await axios.get(randomGif, { responseType: "stream" });

    api.sendMessage({
      body: randomLine,
      mentions: [{
        tag: targetName,
        id: mentionID
      }],
      attachment: response.data
    }, event.threadID, event.messageID);

  } catch (err) {
    console.error("❌ خطأ في تحميل الصورة:", err.message);
    return api.sendMessage(randomLine, event.threadID, event.messageID);
  }
};
