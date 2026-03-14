const fs = global.nodemodule['fs-extra'];
const axios = global.nodemodule['axios'];
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports.config = {
  name: "سجن",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "عمر",
  description: "حط صورتك خلف القضبان او الي تمنشنه او الي ترد عليه",
  commandCategory: "صور",
  usages: " ",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": "",
    "@napi-rs/canvas": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  try {
    let { senderID, threadID, messageID } = event;
    let uid = senderID;

    // تحديد اليوزر الهدف: رد على رسالة أو منشن أو الافتراضي المرسل
    if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) {
      uid = event.messageReply.senderID;
    } else if (args.join().includes('@') && event.mentions && Object.keys(event.mentions).length) {
      uid = Object.keys(event.mentions)[0];
    }

    const cacheDir = path.join(__dirname, 'cache');
    await fs.ensureDir(cacheDir);
    const pathImg = path.join(cacheDir, `wiinted_${Date.now()}.png`);
    const pathAva = path.join(cacheDir, `avt_${Date.now()}.png`);

    // صورة خلفية ثابتة أو افتراضية
    const backgroundURL = 'https://i.postimg.cc/1zmxGQTS/8uv38cfmc74ur1p5rtntitrddi.png';
    const bgResp = await axios.get(backgroundURL, { responseType: 'arraybuffer' });
    await fs.writeFile(pathAva, Buffer.from(bgResp.data));

    // جلب صورة المستخدم من جراف فيسبوك (احذف التوكن أو غَيّره إن لزم)
    const fbURL = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const userResp = await axios.get(fbURL, { responseType: 'arraybuffer' });
    await fs.writeFile(pathImg, Buffer.from(userResp.data));

    // تحميل الصور عبر @napi-rs/canvas
    const baseImage = await loadImage(pathImg);   // صورة الهدف (الصورة التي سنضع خلف القضبان)
    const baseAva = await loadImage(pathAva);     // صورة الخلفية/قالب القضبان

    // انشئ كانفاس بحجم صورة الهدف (أو يمكنك تحديد حجم ثابت)
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext('2d');

    // ارسم صورة الهدف كاملة
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // ارسم قالب "القضبان" أو الخلفية فوق (يمكن تعديل المقاسات)
    // هنا نرسم قالب الخلفية بنفس أبعاد الكانفاس ليتغطى بالكامل
    ctx.drawImage(baseAva, 0, 0, canvas.width, canvas.height);

    // يمكنك إضافة أي تأثير إضافي هنا (تظليل، غلق، نص...).
    // مثال: إضافة ظل خفيف في الأعلى
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, canvas.width, 60);

    // حفظ النتيجة إلى ملف مؤقت
    const outPath = path.join(cacheDir, `result_${Date.now()}.png`);
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outPath, buffer);

    // إرسال الصورة ثم تنظيف الملفات المؤقتة
    return api.sendMessage(
      { attachment: fs.createReadStream(outPath) },
      threadID,
      () => {
        // حذف الملفات المؤقتة بأمان
        try { fs.unlinkSync(pathImg); } catch (e) {}
        try { fs.unlinkSync(pathAva); } catch (e) {}
        try { fs.unlinkSync(outPath); } catch (e) {}
      },
      messageID
    );

  } catch (error) {
    console.error('ERROR in command سجن =>', error);
    return api.sendMessage('❌ حدث خطأ أثناء معالجة الصورة. الرجاء المحاولة لاحقًا.', event.threadID, event.messageID);
  }
};
