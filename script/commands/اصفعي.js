module.exports.config = {
  name: "اصفعي",
  version: "3.1.2",
  hasPermssion: 0,
  credits: "عمر + DRX Fix",
  description: "تصفع حد بالمنشن",
  commandCategory: "ترفية",
  usages: "@منشن",
  cooldowns: 5
};

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

module.exports.onLoad = async () => {
  const dir = path.join(__dirname, "cache/canvas");
  const img = path.join(dir, "sato.png");

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(img)) {
    const data = (
      await axios.get("https://i.imgur.com/dsrmtlg.jpg", { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(img, Buffer.from(data, "utf-8"));
  }
};

// دالة جلب صورة فيسبوك
async function getFB(id, dest) {
  const data = (
    await axios.get(
      `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    )
  ).data;
  fs.writeFileSync(dest, Buffer.from(data, "utf-8"));
}

// دالة رسم دائرة على الصورة مباشرة بـ canvas
async function drawCircle(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

module.exports.run = async function ({ event, api }) {
  const { threadID, senderID, messageID } = event;
  const mention = Object.keys(event.mentions);

  if (!mention[0])
    return api.sendMessage("تاغ للبني آدم 😒", threadID, messageID);

  const id1 = senderID;
  const id2 = mention[0];

  const canvasDir = path.join(__dirname, "cache/canvas");
  const bgPath = path.join(canvasDir, "sato.png");
  const outPath = path.join(canvasDir, `slap_${id1}_${id2}.png`);
  const avt1 = path.join(canvasDir, `avt_${id1}.png`);
  const avt2 = path.join(canvasDir, `avt_${id2}.png`);

  // جلب صور البروفايل
  await getFB(id1, avt1);
  await getFB(id2, avt2);

  // تحميل الصور
  const bg = await loadImage(bgPath);
  const a1 = await loadImage(avt1);
  const a2 = await loadImage(avt2);

  // إنشاء كانفس
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");

  // رسم الخلفية
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // رسم صورة المرسل داخل دائرة
  await drawCircle(ctx, a1, 80, 190, 150);

  // رسم صورة الضحية (المنشن) داخل دائرة
  await drawCircle(ctx, a2, 260, 80, 150);

  // حفظ الصورة
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

  // إرسال
  api.sendMessage(
    { attachment: fs.createReadStream(outPath) },
    threadID,
    () => {
      fs.unlinkSync(outPath);
      fs.unlinkSync(avt1);
      fs.unlinkSync(avt2);
    },
    messageID
  );
};
