const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports.config = {
  name: "مطلوب",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "بوستر مطلوب للعدالة مع ضمان ظهور الصورة",
  commandCategory: "fun",
  usages: "مطلوب [@منشن/ID/رد]",
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
  const cacheDir = path.join(__dirname, "cache");
  const pathImg = path.join(cacheDir, `wanted_${senderID}.png`);
  const pathAvt = path.join(cacheDir, `avt_${senderID}.png`);

  let targetID;
  if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else if (type === "message_reply") {
    targetID = messageReply.senderID;
  } else if (args[0] && !isNaN(args[0])) {
    targetID = args[0];
  }

  if (!targetID) {
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nعليك عمل منشن، أو رد، أو كتابة الأيدي للشخص المطلوب", threadID, messageID);
  }

  try {
    const targetName = await Users.getNameUser(targetID);
    fs.ensureDirSync(cacheDir);

    // الخطوة 1: جلب صورة البروفايل وحفظها للتأكد من أنها ليست فارغة
    const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const getAvt = (await axios.get(avatarUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathAvt, Buffer.from(getAvt, "utf-8"));

    // الخطوة 2: استخدام API لمعالجة البوستر (هذا الرابط أكثر استقراراً)
    const apiUrl = `https://api.popcat.xyz/wanted?image=https://www.facebook.com/messenger_media/?thread_id=${threadID}&message_id=${messageID}&attachment_id=1`; 
    // ملاحظة: سنستخدم الـ API المباشر مع الرابط المحفوظ إذا لزم الأمر، لكن الأفضل هو توجيه الصورة الخام
    
    // الحل الأضمن: استخدام API يقبل روابط مباشرة وسريعة
    const finalApiUrl = `https://api.popcat.xyz/wanted?image=${encodeURIComponent(avatarUrl)}`;
    
    const res = await axios.get(finalApiUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(pathImg, Buffer.from(res.data, 'utf-8'));

    return api.sendMessage({
      body: `⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nالمجرم الخطير ${targetName} مطلوب حياً أو ميتاً!`,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => {
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
      if (fs.existsSync(pathAvt)) fs.unlinkSync(pathAvt);
    }, messageID);

  } catch (error) {
    if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
    if (fs.existsSync(pathAvt)) fs.unlinkSync(pathAvt);
    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nعذراً، حدث خطأ في معالجة صورة المطلوب.`, threadID, messageID);
  }
};
