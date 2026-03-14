const axios = require("axios");
const fs = require("fs-extra");
const FormData = require("form-data");

module.exports.config = {
  name: "زيرو",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "تحويل البصمات إلى نص باستخدام Whisper Turbo",
  commandCategory: "utility",
  usages: "رد على بصمة بـ .زيرو",
  cooldowns: 5
};

const GROQ_API_KEY = "Gsk_5xXabJMctRfDGK7i3cc4WGdyb3FYAhrMgglcp5sPAY7N6lOm01fz";

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, type, messageReply } = event;

  // التأكد أن المستخدم رد على رسالة صوتية
  if (type !== "message_reply" || !messageReply.attachments[0] || messageReply.attachments[0].type !== "audio") {
    return api.sendMessage("يا رعاك الله، يجب أن ترد على 'بصمة صوتية' بهذا الأمر.", threadID, messageID);
  }

  const audioUrl = messageReply.attachments[0].url;
  const path = __dirname + `/cache/voice_${messageID}.m4a`;

  try {
    api.sendMessage("جاري الاستماع للبصمة.. لحظة من فضلك.", threadID, messageID);

    // 1. تحميل ملف الصوت
    const response = await axios.get(audioUrl, { responseType: "arraybuffer" });
    await fs.outputFile(path, Buffer.from(response.data));

    // 2. إرسال الملف لـ Groq Whisper
    const formData = new FormData();
    formData.append("file", fs.createReadStream(path));
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("temperature", "0");

    const res = await axios.post("https://api.groq.com/openai/v1/audio/transcriptions", formData, {
      headers: {
        ...formData.getHeaders(),
        "Authorization": `Bearer ${GROQ_API_KEY}`
      }
    });

    // 3. مسح الملف المؤقت وإرسال النص
    await fs.unlink(path);
    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗨𝗗𝗜𝗢 ━━ ⌬\n\n📝 النص المستخرج:\n"${res.data.text}"`, threadID, messageID);

  } catch (e) {
    if (fs.existsSync(path)) await fs.unlink(path);
    return api.sendMessage("حدث خطأ أثناء معالجة الصوت، تأكد من مفتاح الـ API.", threadID, messageID);
  }
};
