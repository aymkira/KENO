module.exports.config = {
  name: "مطلوب",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Somi",
  description: "ضع صورتك أو صورة شخص آخر على بوستر مطلوب 🔥",
  commandCategory: "صور",
  usages: "[تاغ أو رد]",
  cooldowns: 5,
  dependencies: {
    "@napi-rs/canvas": "",
    "axios": "",
    "fs-extra": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, type, messageReply, mentions } = event;
  const axios = require("axios");
  const fs = require("fs-extra");
  const { createCanvas, loadImage } = require("@napi-rs/canvas");

  try {
    // تحديد المستخدم الهدف
    let uid;
    if (type === "message_reply") uid = messageReply.senderID;
    else if (Object.keys(mentions).length > 0) uid = Object.keys(mentions)[0];
    else uid = senderID;

    // تحميل صورة المستخدم من فيسبوك
    const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const avatarBuffer = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;

    // تحميل خلفية "مطلوب"
    const bgURL = "https://i.postimg.cc/xTwrcng4/received-852158153129459.jpg";
    const bgBuffer = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;

    // تحميل الصور داخل الكانفاس
    const baseImage = await loadImage(bgBuffer);
    const avatar = await loadImage(avatarBuffer);

    // إنشاء الكانفاس بنفس حجم الخلفية
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    // رسم الخلفية
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // رسم صورة المستخدم على البوستر في الإحداثيات المناسبة
    ctx.save();
    ctx.beginPath();
    ctx.arc(289, 374, 145, 0, Math.PI * 2, true); // دائرة للصورة
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 144, 229, 290, 290);
    ctx.restore();

    // حفظ الصورة النهائية
    const outputPath = __dirname + `/cache/wanted_${uid}.png`;
    fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));

    // إرسال الصورة فقط
    return api.sendMessage({ attachment: fs.createReadStream(outputPath) }, threadID, () => fs.unlinkSync(outputPath), messageID);

  } catch (err) {
    console.error("❌ خطأ:", err);
    return api.sendMessage("⚠️ حدث خطأ أثناء إنشاء الصورة.", threadID, messageID);
  }
};
