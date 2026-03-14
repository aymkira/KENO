module.exports.config = {
  name: "عناق",
  version: "8.0.0",
  hasPermssion: 0,
  credits: "عمر & Somi",
  description: "حضن بمنشن 🤗",
  commandCategory: "صور",
  usages: "[@منشن]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "@napi-rs/canvas": ""
  }
};

module.exports.onLoad = async () => {
  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");
  const dir = path.join(__dirname, "cache", "canvas");
  const imgPath = path.join(dir, "hugv3.png");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(imgPath)) {
    const image = (await axios.get("https://scontent.xx.fbcdn.net/v/t1.15752-9/579437342_1210674817570290_6993543708514770780_n.jpg?stp=dst-jpg_p480x480_tt6&_nc_cat=107&ccb=1-7&_nc_sid=9f807c&_nc_ohc=LwrgBo7ny8sQ7kNvwGDZb93&_nc_oc=AdkZTpUoDnhOxrUrrFvuwlT2A5RheZLVRt77yo93lvWgAlyfaxVllyWFvKjfsG52H6I&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.xx&oh=03_Q7cD3wHeNWrh0dE9FeC79Tuq82SN2VealuNIH9b8c6zYV8b_8Q&oe=6938939A", { responseType: "arraybuffer" })).data;
    fs.writeFileSync(imgPath, image);
  }
};

async function makeImage({ one, two }) {
  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");
  const { createCanvas, loadImage } = require("@napi-rs/canvas");

  const __root = path.resolve(__dirname, "cache", "canvas");
  const bgPath = path.join(__root, "hugv3.png");

  // تحميل الخلفية
  const background = await loadImage(bgPath);

  // تحميل صور البروفايلات
  async function getAvatar(uid) {
    const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const res = (await axios.get(url, { responseType: "arraybuffer" })).data;
    return await loadImage(res);
  }

  const avatar1 = await getAvatar(one);
  const avatar2 = await getAvatar(two);

  // إنشاء الكانفاس
  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext("2d");

  // رسم الخلفية
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // دالة رسم الصور بشكل دائري
  function drawCircleImage(ctx, image, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, x, y, size, size);
    ctx.restore();
  }

  // تحديد أماكن الصور (كما بالكود الأصلي)
  drawCircleImage(ctx, avatar1, 200, 50, 220);
  drawCircleImage(ctx, avatar2, 490, 200, 220);

  // حفظ الصورة النهائية
  const outPath = path.join(__root, `hug_${one}_${two}.png`);
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

  return outPath;
}

module.exports.run = async function ({ event, api }) {
  const fs = require("fs-extra");
  const { threadID, messageID, senderID, mentions } = event;
  const mention = Object.keys(mentions);

  if (!mention[0])
    return api.sendMessage("🤗 منشن الشخص اللي تبي تحضنه!", threadID, messageID);

  const one = senderID;
  const two = mention[0];

  try {
    const imgPath = await makeImage({ one, two });
    return api.sendMessage(
      { body: "", attachment: fs.createReadStream(imgPath) },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ حصل خطأ أثناء إنشاء الصورة.", threadID, messageID);
  }
};
