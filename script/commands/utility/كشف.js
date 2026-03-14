const axios = require("axios");
const fs = require("fs-extra");
const Tesseract = require("tesseract.js");

module.exports.config = {
  name: "كشف",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "استخراج النصوص من الصور (OCR)",
  commandCategory: "utility",
  usages: "رد على صورة بـ .كشف",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, type, messageReply } = event;

  // التأكد أن المستخدم رد على صورة
  if (type !== "message_reply" || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("يا رعاك الله، يجب أن ترد على 'صورة' تحتوي على نص بهذا الأمر.", threadID, messageID);
  }

  const imageUrl = messageReply.attachments[0].url;
  const path = __dirname + `/cache/ocr_${messageID}.png`;

  try {
    api.sendMessage("جاري فحص الصورة واستخراج النصوص.. انتظر قليلاً يا زوجي.", threadID, messageID);

    // 1. تحميل الصورة
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    await fs.outputFile(path, Buffer.from(response.data));

    // 2. معالجة الصورة باستخدام Tesseract
    const { data: { text } } = await Tesseract.recognize(path, 'ara+eng', {
      logger: m => console.log(m) // لمتابعة التقدم في الكونسول
    });

    // 3. مسح الملف المؤقت وإرسال النتيجة
    await fs.unlink(path);

    if (!text || text.trim() === "") {
      return api.sendMessage("تعذر العثور على نص واضح في هذه الصورة.", threadID, messageID);
    }

    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗦𝗖𝗔𝗡𝗡𝗘𝗥 ━━ ⌬\n\n📄 النص المستخرج:\n\n${text}`, threadID, messageID);

  } catch (e) {
    if (fs.existsSync(path)) await fs.unlink(path);
    console.error(e);
    return api.sendMessage("حدث خطأ أثناء قراءة الصورة، حاول مرة أخرى.", threadID, messageID);
  }
};
