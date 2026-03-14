const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "رابط",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "DRX",
  description: "رفع صورة على imgbb وإعطاء رابط مباشر",
  commandCategory: "أدوات",
  usages: "",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  if (!event.messageReply || !event.messageReply.attachments || !event.messageReply.attachments[0] || !["photo","sticker"].includes(event.messageReply.attachments[0].type)) {
    return api.sendMessage("❌ رد على صورة للحصول على الرابط.", event.threadID, event.messageID);
  }

  const imageUrl = event.messageReply.attachments[0].url;
  const tempPath = path.join(__dirname, `temp_${Date.now()}.jpg`);

  api.setMessageReaction("🫧", event.messageID, () => {}, true);

  try {
    // تحميل الصورة مؤقتًا
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(tempPath, Buffer.from(response.data, "binary"));

    // رفع الصورة على imgbb
    const form = new FormData();
    form.append("image", fs.createReadStream(tempPath));

    const imgbbApiKey = "dfd2852b47644237ab72246caaed63ba"; // مفتاحك هنا
    const upload = await axios.post(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, form, { headers: form.getHeaders() });

    fs.unlinkSync(tempPath); // حذف الصورة المؤقتة

    if (upload.data && upload.data.data && upload.data.data.url) {
      const link = upload.data.data.url;
      api.sendMessage(`✅ تم رفع الصورة بنجاح:\n${link}`, event.threadID, event.messageID);
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } else {
      api.sendMessage("❌ فشل رفع الصورة.", event.threadID, event.messageID);
      api.setMessageReaction("😔", event.messageID, () => {}, true);
    }
  } catch (error) {
    console.error(error);
    api.sendMessage("❌ حدث خطأ أثناء رفع الصورة.", event.threadID, event.messageID);
    api.setMessageReaction("😔", event.messageID, () => {}, true);
  }
};
