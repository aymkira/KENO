const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
  name: "ربط",
  version: "1.0",
  hasPermssion: 0,
  credits: "Somi + ChatGPT",
  description: "يرفع أي GIF يرسله المستخدم إلى ImgBB ويعطي رابط مباشر",
  commandCategory: "📤 رفع صور",
  usages: ".رفعGIF",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  try {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return api.sendMessage("⚠️ الرجاء الرد على صورة GIF لإرسالها.", event.threadID, event.messageID);
    }

    const gifUrl = event.messageReply.attachments[0].url;
    const response = await axios.get(gifUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    const form = new FormData();
    form.append("image", buffer.toString("base64"));

    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?key=7fad6de293f1056f3717c21422a27783`,
      form,
      { headers: form.getHeaders() }
    );

    if (upload.data && upload.data.data && upload.data.data.url) {
      api.sendMessage(`✅ تم رفع GIF بنجاح!\n🔗 رابط مباشر: ${upload.data.data.url}`, event.threadID, event.messageID);
    } else {
      api.sendMessage("❌ فشل رفع GIF.", event.threadID, event.messageID);
    }

  } catch (err) {
    console.error(err);
    api.sendMessage("⚠️ حدث خطأ أثناء رفع GIF.", event.threadID, event.messageID);
  }
};
