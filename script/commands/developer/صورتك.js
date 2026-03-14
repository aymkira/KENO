 module.exports.config = {
  name: "صورتك",
  version: "1.1.0",
  hasPermssion: 2,
  credits: "ايمن",
  description: "تغيير صورة بروفايل البوت عبر الرد على صورة",
  commandCategory: "developer",
  usages: "صورتك [بالرد على صورة]",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");
  const { threadID, messageID, senderID, messageReply, type } = event;

  // التحقق من أن المرسل هو الأدمن (المطور)
  if (!global.config.ADMINBOT.includes(senderID)) {
    return api.sendMessage("❌ هذا الأمر مخصص لمطوري فقط.", threadID, messageID);
  }

  let photoUrl = "";

  // استخراج رابط الصورة سواء بالرد أو بالإرسال المباشر مع الأمر
  if (type === "message_reply" && messageReply.attachments && messageReply.attachments.length > 0) {
    photoUrl = messageReply.attachments[0].url;
  } else if (event.attachments && event.attachments.length > 0) {
    photoUrl = event.attachments[0].url;
  }

  if (!photoUrl) {
    api.setMessageReaction("⚠️", messageID, () => {}, true);
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\nيرجى الرد على صورة لتغيير بروفايل البوت!", threadID, messageID);
  }

  api.setMessageReaction("⌛", messageID, () => {}, true);

  const pathImg = path.join(__dirname, "cache", `bot_avt_${Date.now()}.png`);

  try {
    // جلب الصورة وتحويلها لمخزن مؤقت
    const response = await axios.get(photoUrl, { responseType: "arraybuffer" });
    fs.ensureDirSync(path.join(__dirname, "cache"));
    fs.writeFileSync(pathImg, Buffer.from(response.data));

    // تنفيذ تغيير الصورة
    api.changeAvatar(fs.createReadStream(pathImg), "تحديث بواسطة المطور", (err) => {
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
      
      if (err) {
        console.error(err);
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n❌ فشل التغيير. قد يكون السبب حظر مؤقت من فيسبوك أو حجم الصورة كبير.", threadID, messageID);
      }
      
      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم تحديث صورة بروفايل البوت بنجاح!", threadID, messageID);
    });

  } catch (error) {
    if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
    console.error(error);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n❌ حدث خطأ تقني أثناء تحميل الصورة.", threadID, messageID);
  }
};
