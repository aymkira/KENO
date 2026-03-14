const fs = global.nodemodule["fs-extra"];
const axios = global.nodemodule["axios"];
const path = global.nodemodule["path"];
const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports.config = {
  name: "حضن",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "عمر",
  description: "حضن شخص بتاغ 🥰",
  commandCategory: "ترفية",
  usages: "[@منشن]",
  cooldowns: 5,
  dependencies: {
      "axios": "",
      "fs-extra": "",
      "path": "",
      "@napi-rs/canvas": ""
  }
};

module.exports.onLoad = async() => {
  const { resolve } = path;
  const dirMaterial = __dirname + `/cache/canvas/`;
  const filePath = resolve(__dirname, 'cache/canvas', 'hugv1.png');
  if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
  if (!fs.existsSync(filePath)) {
    await global.utils.downloadFile("https://i.ibb.co/3YN3T1r/q1y28eqblsr21.jpg", filePath);
  }
}

async function makeImage({ one, two }) {
  const __root = path.resolve(__dirname, "cache", "canvas");
  await fs.ensureDir(__root);

  const templatePath = path.join(__root, 'hugv1.png');
  const outPath = path.join(__root, `hug_${one}_${two}_${Date.now()}.png`);

  // تحميل صورة القالب
  const template = await loadImage(templatePath);

  // جلب صور اللاعبين
  const fbToken = '6628568379%7Cc1e620fa708a1d5696fb991c1bde5662';
  const [avatarOneBuffer, avatarTwoBuffer] = await Promise.all([
    axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=${fbToken}`, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data)),
    axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=${fbToken}`, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data))
  ]);

  // دالة لتقطيع الصورة كدائرة
  async function makeCircle(buf, size) {
    const img = await loadImage(buf);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();
    const ratio = Math.min(img.width, img.height);
    const sx = (img.width - ratio)/2;
    const sy = (img.height - ratio)/2;
    ctx.drawImage(img, sx, sy, ratio, ratio, 0, 0, size, size);
    return canvas;
  }

  const circleOne = await makeCircle(avatarOneBuffer, 150);
  const circleTwo = await makeCircle(avatarTwoBuffer, 130);

  // إنشاء كانفاس نهائي
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext('2d');

  // رسم الخلفية
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  // رسم صور اللاعبين على القالب
  ctx.drawImage(circleOne, 320, 100, 150, 150);
  ctx.drawImage(circleTwo, 280, 280, 130, 130);

  // حفظ الصورة النهائية
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  return outPath;
}

module.exports.run = async function ({ event, api }) {    
  const { threadID, messageID, senderID } = event;
  const mention = Object.keys(event.mentions);
  if (!mention[0]) return api.sendMessage("منشن شخص لتقوم بحضنه 🥰", threadID, messageID);
  else {
      const one = senderID, two = mention[0];
      try {
        const pathImg = await makeImage({ one, two });
        return api.sendMessage({ body: "", attachment: fs.createReadStream(pathImg) }, threadID, () => {
          try { fs.unlinkSync(pathImg); } catch(e){}
        }, messageID);
      } catch(e) {
        console.error(e);
        return api.sendMessage("❌ حدث خطأ أثناء إنشاء الصورة.", threadID, messageID);
      }
  }
}
