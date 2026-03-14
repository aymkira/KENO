const fs = require("fs-extra");
const axios = require("axios");
const jimp = require("jimp");
const Canvas = require("canvas");

module.exports.config = {
  name: "قبر",
  version: "1.1.0",
  role: 0,
  author: "ايمن",
  description: "صنع صورة قبر للشخص المنشن أو بالرد على رسالته",
  category: "fun",
  usages: "[@منشن] او [رد على رسالة]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, type, messageReply, mentions } = event;
  
  // 🎯 تحديد المعرف (ID) - دعم الرد والمنشن
  let id;
  if (type === "message_reply") {
    id = messageReply.senderID;
  } else if (Object.keys(mentions).length > 0) {
    id = Object.keys(mentions)[0];
  } else {
    id = senderID;
  }

  const pathImg = __dirname + `/cache/grave_${id}.png`;

  try {
    api.sendMessage("⏳ | جاري تحضير القبر في نظام KIRA...", threadID, messageID);

    // جلب الصورة الشخصية
    const avatarUrl = `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    
    // معالجة الصورة دائرية باستخدام Jimp
    const avatarRaw = await jimp.read(avatarUrl);
    avatarRaw.circle();
    const avatarBuffer = await avatarRaw.getBufferAsync(jimp.MIME_PNG);

    // إعداد Canvas لدمج الصور
    const canvas = Canvas.createCanvas(500, 670);
    const ctx = canvas.getContext('2d');
    
    // تحميل الخلفية وصورة الشخص
    const background = await Canvas.loadImage('https://i.imgur.com/A4quyh3.jpg');
    const avatarImg = await Canvas.loadImage(avatarBuffer);

    // رسم الخلفية
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
    // رسم الصورة الشخصية داخل القبر
    ctx.drawImage(avatarImg, 160, 70, 160, 160);

    // 💡 إضافة لمسة KIRA (نص أبيض ساطع)
    ctx.font = "bold 25px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("RIP", 240, 260);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    return api.sendMessage({
      body: "⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nاللهم ارحمه واغفر له.. اقرأ الفاتحة 🤲",
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => {
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
    }, messageID);

  } catch (error) {
    console.error("❌ KIRA Grave Error:", error);
    return api.sendMessage("❌ حدث خطأ أثناء تجهيز القبر، حاول لاحقاً.", threadID, messageID);
  }
};
