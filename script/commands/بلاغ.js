const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "قبلة",
  version: "5.0.3",
  hasPermssion: 0,
  credits: "Somi",
  description: "يضع صورتك وصورة المنشن داخل خلفية قبلة أنمي بخاصية توهج متحرك خرافي 💋",
  commandCategory: "صور",
  usages: "قبلة @الاسم أو رد على رسالة",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
  try {
    const mention = Object.keys(event.mentions)[0];
    let targetID;

    if (mention) targetID = mention;
    else if (event.type === "message_reply") targetID = event.messageReply.senderID;
    else return api.sendMessage("💋 | منشن الشخص الذي تريد تقبيله أو رد على رسالته.", event.threadID, event.messageID);

    const senderID = event.senderID;

    const senderName = await Users.getNameUser(senderID);
    const targetName = await Users.getNameUser(targetID);

    const backgroundURL = "https://i.imgur.com/OoiyQmP.jpeg";

    const [background, userLeft, userRight] = await Promise.all([
      loadImage(backgroundURL),
      loadImage(`https://graph.facebook.com/${senderID}/picture?width=512&height=512`),
      loadImage(`https://graph.facebook.com/${targetID}/picture?width=512&height=512`)
    ]);

    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');

    // الخلفية
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // فلتر ضباب وردي
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 50, canvas.width / 2, canvas.height / 2, 600);
    gradient.addColorStop(0, "rgba(255,182,193,0.15)");
    gradient.addColorStop(1, "rgba(255,105,180,0.05)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // إعداد حجم أيقونات صغيرة جدًا
    const iconSize = 30;

    // 🧑‍🎨 المرسل - أيقونة صغيرة مع توهج
    ctx.save();
    ctx.beginPath();
    ctx.arc(260, 420, iconSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(userLeft, 260 - iconSize / 2, 420 - iconSize / 2, iconSize, iconSize);
    // توهج حول الصورة
    ctx.shadowColor = "rgba(255,192,203,0.8)";
    ctx.shadowBlur = 15;
    ctx.strokeStyle = "rgba(255,182,193,0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // 👩‍🎨 المنشن - أيقونة صغيرة مع توهج
    ctx.save();
    ctx.beginPath();
    ctx.arc(530, 400, iconSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(userRight, 530 - iconSize / 2, 400 - iconSize / 2, iconSize, iconSize);
    ctx.shadowColor = "rgba(255,105,180,0.8)";
    ctx.shadowBlur = 15;
    ctx.strokeStyle = "rgba(255,105,180,0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // لمعة بيضاء ناعمة في المنتصف
    const shine = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, 400);
    shine.addColorStop(0, "rgba(255,255,255,0.15)");
    shine.addColorStop(1, "transparent");
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // كتابة الأسماء
    ctx.font = "bold 36px Sans";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(255,192,203,0.8)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`💙 ${senderName}`, 260, 330);
    ctx.fillText(`❤️ ${targetName}`, 530, 310);

    // نص فخم أسفل الصورة
    ctx.font = "bold 40px Sans";
    ctx.fillStyle = "#ff4da6";
    ctx.shadowColor = "rgba(255,0,100,0.7)";
    ctx.shadowBlur = 10;
    ctx.fillText("💞 قبلة أسطورية تجمع القلوب 💞", canvas.width / 2, canvas.height - 40);

    // حفظ الصورة
    const outPath = path.join(__dirname, `kiss_${senderID}_${targetID}.png`);
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));

    // إرسال الصورة
    api.sendMessage({
      body: `💋 ${senderName} منح ${targetName} قبلة أسطورية 😳❤️🔥`,
      attachment: fs.createReadStream(outPath)
    }, event.threadID, () => fs.unlinkSync(outPath), event.messageID);

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ | حدث خطأ أثناء معالجة الصورة.", event.threadID, event.messageID);
  }
};
