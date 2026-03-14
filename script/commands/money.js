module.exports.config = {
  name: "رصيدي",
  version: "1.0",
  hasPermssion: 0,
  credits: "DRX + Somi",
  description: "يعرض رصيد المستخدم الكامل من بنك سومي",
  commandCategory: "بنك سومي 💳",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Users }) {
  const { createCanvas, loadImage } = require("@napi-rs/canvas");
  const fs = require("fs-extra");
  const axios = require("axios");
  const path = require("path");

  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const outputPath = path.join(cacheDir, `balance_${Date.now()}.png`);

    const id = event.senderID;
    const name = await Users.getNameUser(id) || `User ${id}`;

    // جلب الرصيد من Users.getData
    let balance = 0, cash = 0;
    try {
      const data = await Users.getData(id) || {};
      balance = Number(data.bank || 0);
      cash = Number(data.money || 0);
    } catch(e){}

    // صورة البروفايل
    const avatarURL = `https://graph.facebook.com/${id}/picture?width=720&height=720`;
    const tmpAvatarPath = path.join(cacheDir, `${id}_avatar.png`);
    const res = await axios.get(avatarURL, { responseType: "arraybuffer" });
    await fs.writeFile(tmpAvatarPath, Buffer.from(res.data, "binary"));
    const avatarImg = await loadImage(tmpAvatarPath);

    // إعداد الكانفاس
    const width = 1100;
    const height = 700;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // خلفية وردية مع تدرج
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#ffd6e0");
    gradient.addColorStop(1, "#ffb6c1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // إطار مزين
    ctx.strokeStyle = "#ff9800";
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, width - 10, height - 10);

    // شعار البنك
    ctx.font = "bold 72px Arial";
    ctx.fillStyle = "#0d47a1";
    ctx.textAlign = "center";
    ctx.fillText("Bank Somi 🏦", width / 2, 100);

    // مربع البروفايل
    const imgSize = 300;
    const imgX = 80;
    const imgY = 180;
    ctx.drawImage(avatarImg, imgX, imgY, imgSize, imgSize);

    // الاسم تحت الصورة
    ctx.fillStyle = "#fff";
    ctx.font = "700 32px Arial";
    ctx.textAlign = "left";
    ctx.fillText(name, imgX, imgY + imgSize + 40);

    // الرصيد
    ctx.font = "bold 50px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText(`رصيد البنك: ${balance} $`, imgX + imgSize + 50, imgY + 50);
    ctx.fillText(`النقد: ${cash} $`, imgX + imgSize + 50, imgY + 150);
    ctx.fillText(`الإجمالي: ${balance + cash} $`, imgX + imgSize + 50, imgY + 250);

    // توقيع البنك
    ctx.font = "20px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.fillText("© Somi Financial System 2025", width / 2, height - 30);

    // حفظ الصورة وإرسالها
    await fs.writeFile(outputPath, canvas.toBuffer());
    await api.sendMessage({
      body: `💖 رصيدك الكامل: ${balance + cash} $`,
      attachment: fs.createReadStream(outputPath)
    }, event.threadID, () => fs.unlinkSync(outputPath), event.messageID);

  } catch(err){
    console.error(err);
    api.sendMessage("❌ حدث خطأ أثناء عرض رصيدك.", event.threadID);
  }
};
