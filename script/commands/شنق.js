const fs = global.nodemodule['fs-extra'];
const axios = global.nodemodule['axios'];
const path = global.nodemodule['path'];
const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports.config = {
  name: "شنق",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "عمر",
  description: "تشنق حد بمنشن",
  commandCategory: "العاب",
  usages: "[للشخص لتريده@حط]",
  cooldowns: 5,
  dependencies: {
      "axios": "",
      "fs-extra": "",
      "path": "",
      "@napi-rs/canvas": ""
  }
};

module.exports.onLoad = async() => {
  const { resolve } = global.nodemodule["path"];
  const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
  const { downloadFile } = global.utils;
  const dirMaterial = __dirname + `/cache/canvas/`;
  const pathFile = resolve(__dirname, 'cache/canvas', 'smto.png');
  if (!existsSync(dirMaterial)) mkdirSync(dirMaterial, { recursive: true });
  if (!existsSync(pathFile)) await downloadFile("https://i.postimg.cc/brq6rDDB/received-1417994055426496.jpg", pathFile);
}

async function makeImage({ one, two }) {
  try {
    const __root = path.resolve(__dirname, "cache", "canvas");
    await fs.ensureDir(__root);

    const templatePath = path.join(__root, "smto.png");
    if (!fs.existsSync(templatePath)) throw new Error('Template not found');

    // تحميل صورة القالب
    const template = await loadImage(templatePath);

    // جلب أفاتار اللاعبين كـ buffer
    const fbToken = '6628568379%7Cc1e620fa708a1d5696fb991c1bde5662'; // احتفظ كما في الكود الأصلي أو غيّره حسب الحاجة
    const avatarUrlOne = `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=${fbToken}`;
    const avatarUrlTwo = `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=${fbToken}`;

    const [respOne, respTwo] = await Promise.all([
      axios.get(encodeURI(avatarUrlOne), { responseType: 'arraybuffer' }),
      axios.get(encodeURI(avatarUrlTwo), { responseType: 'arraybuffer' })
    ]);
    const bufOne = Buffer.from(respOne.data);
    const bufTwo = Buffer.from(respTwo.data);

    // دوال مساعدة لإنشاء صورة دائرية من بافر
    async function makeCircleBuffer(buffer, size) {
      const img = await loadImage(buffer);
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      // رسم قناع دائري
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // حساب تناسب الصورة بحيث تغطي القناع بالكامل
      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
      // ملء المربع مع الحفاظ على النسبة
      const imgRatio = img.width / img.height;
      if (imgRatio > 1) {
        // أعرض أكبر من الارتفاع
        sWidth = img.height;
        sx = Math.floor((img.width - img.height) / 2);
        sHeight = img.height;
        sy = 0;
      } else if (imgRatio < 1) {
        sHeight = img.width;
        sy = Math.floor((img.height - img.width) / 2);
        sWidth = img.width;
        sx = 0;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
      return canvas.toBuffer('image/png');
    }

    // احجام الــ avatars كما في النسخة الأصلية (قابلة للتعديل)
    const sizeOne = 200; // حجم الصورة الأولى بعد التعديل
    const sizeTwo = 118; // حجم الصورة الثانية بعد التعديل

    const [circleBufOne, circleBufTwo] = await Promise.all([
      makeCircleBuffer(bufOne, sizeOne),
      makeCircleBuffer(bufTwo, sizeTwo)
    ]);

    // نجهز الكانفاس النهائي بحجم القالب
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');

    // نرسم القالب كخلفية
    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

    // نحمل الصور الدائرية كـ images ونرسمهم على المواضع المطلوبة
    const imgCircleOne = await loadImage(circleBufOne);
    const imgCircleTwo = await loadImage(circleBufTwo);

    // مواضع الرسم (قابلة للتعديل إن أردت تغيير الإحداثيات)
    const posOne = { x: 255, y: 250 }; // موضع الصورة الأولى
    const posTwo = { x: 350, y: 80 };  // موضع الصورة الثانية

    ctx.drawImage(imgCircleOne, posOne.x, posOne.y, sizeOne, sizeOne);
    ctx.drawImage(imgCircleTwo, posTwo.x, posTwo.y, sizeTwo, sizeTwo);

    // إن أردت إضافة تأثيرات إضافية (ظل، حدود) يمكنك فعل ذلك هنا
    // مثال: إطار أبيض رفيع حول الصورة الثانية
    ctx.beginPath();
    ctx.arc(posTwo.x + sizeTwo/2, posTwo.y + sizeTwo/2, sizeTwo/2 + 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // حفظ الصورة النهائية مؤقتًا
    const outPath = path.join(__root, `smto${one}_${two}_${Date.now()}.png`);
    await fs.writeFile(outPath, canvas.toBuffer('image/png'));

    return outPath;
  } catch (err) {
    throw err;
  }
}

module.exports.run = async function ({ event, api, args }) {    
  const { threadID, messageID, senderID } = event;
  const mention = Object.keys(event.mentions);
  if (!mention[0]) return api.sendMessage("تاغ للبني ادم", threadID, messageID);
  else {
      const one = senderID, two = mention[0];
      try {
        const pathImg = await makeImage({ one, two });
        return api.sendMessage({ body: "", attachment: fs.createReadStream(pathImg) }, threadID, () => {
          try { fs.unlinkSync(pathImg); } catch(e) {}
        }, messageID);
      } catch (e) {
        console.error(e);
        return api.sendMessage("❌ حدث خطأ أثناء إنشاء الصورة.", threadID, messageID);
      }
  }
}
