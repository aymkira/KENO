module.exports.config = {
  name: "فيس",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "عمر",
  description: "ينزل من الفيس",
  commandCategory: "خدمات",
  usages: "فيس صوت/فيديو [رابط]",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, args }) {
  const axios = global.nodemodule['axios'];
  const fs = global.nodemodule["fs-extra"];

  if (!event.attachments || !event.attachments[0] || !event.attachments[0].playableUrl) {
    return api.sendMessage("❌ الرجاء إرسال الأمر مع مرفق صوت أو فيديو من فيسبوك.", event.threadID, event.messageID);
  }

  const url = event.attachments[0].playableUrl;

  // -------------------- تحميل صوت --------------------
  if (args[0] === 'صوت') {
    try {
      api.sendMessage(`جارٍ معالجة الطلب...`, event.threadID, (err, info) => {
        setTimeout(() => api.unsendMessage(info.messageID), 400);
      }, event.messageID);

      const path = __dirname + `/cache/2.mp3`;
      const data = (await axios.get(url, { responseType: 'arraybuffer' })).data;

      fs.writeFileSync(path, Buffer.from(data, "utf-8"));

      return api.sendMessage({
        body: `✅ تم تنزيل الصوت بنجاح بواسطة بوت سومي`,
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path), event.messageID);

    } catch (e) {
      return api.sendMessage(`❌ غير قادر على معالجة الصوت`, event.threadID, event.messageID);
    }
  }

  // -------------------- تحميل فيديو --------------------
  if (args[0] === 'فيديو') {
    try {
      api.sendMessage(`⏳ اصبر شوي...`, event.threadID, (err, info) => {
        setTimeout(() => api.unsendMessage(info.messageID), 500);
      }, event.messageID);

      const path = __dirname + `/cache/1.mp4`;
      const data = (await axios.get(url, { responseType: 'arraybuffer' })).data;

      fs.writeFileSync(path, Buffer.from(data, "utf-8"));

      return api.sendMessage({
        body: `🎬 تم تحميل الفيديو بواسطة بوت سومي`,
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path), event.messageID);

    } catch (e) {
      return api.sendMessage(`❌ غير قادر على تحميل الفيديو — ربما الخصوصية ليست عامة`, event.threadID, event.messageID);
    }
  }

  return api.sendMessage(`❌ استخدم: فيس صوت أو فيس فيديو`, event.threadID, event.messageID);
};
