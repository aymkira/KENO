  const axios = require('axios');
const FormData = require('form-data');

module.exports.config = {
  name: "رك",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "رفع حتى 10 صور أو فيديوهات دفعة واحدة على Catbox",
  commandCategory: "utility",
  usages: "رد على رسالة بها ملفات بـ .ارفع",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, type, messageReply } = event;

  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage("⚠️ يا رعاك الله، رد على رسالة تحتوي على صور أو فيديوهات.", threadID, messageID);
  }

  const attachments = messageReply.attachments;
  const limit = Math.min(attachments.length, 10); // حد أقصى 10 ملفات
  
  const waitingMsg = await api.sendMessage(`⏳ جاري رفع (${limit}) ملفات... انتظر قليلاً.`, threadID);
  
  let results = [];
  let errors = 0;

  try {
    // مصفوفة من الوعود (Promises) لمعالجة الرفع المتوازي
    const uploadPromises = attachments.slice(0, limit).map(async (attachment, index) => {
      try {
        const fileUrl = attachment.url;

        // 1. جلب الملف كـ Buffer
        const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(res.data);

        // 2. تحديد الامتداد
        const ext = attachment.type === "photo" ? "jpg" : 
                    attachment.type === "video" ? "mp4" : 
                    attachment.type === "audio" ? "mp3" : "bin";
        const filename = `file${index}.${ext}`;

        // 3. إعداد الفورم
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', buffer, { filename });

        // 4. الرفع
        const uploadRes = await axios.post('https://catbox.moe/user/api.php', formData, {
          headers: formData.getHeaders()
        });

        return { success: true, url: uploadRes.data };
      } catch (e) {
        errors++;
        return { success: false };
      }
    });

    const responses = await Promise.all(uploadPromises);
    
    // تجميع الروابط الناجحة
    let msg = `⌬ ━━ 𝗖𝗔𝗧𝗕𝗢𝗫 𝗨𝗣𝗟𝗢𝗔𝗗 ━━ ⌬\n\n`;
    responses.forEach((res, i) => {
      if (res.success) {
        msg += `📄 ملف ${i + 1}: ${res.url}\n`;
      }
    });

    if (errors > 0) {
      msg += `\n⚠️ فشل رفع ${errors} ملفات.`;
    }

    api.unsendMessage(waitingMsg.messageID);
    return api.sendMessage(msg, threadID, messageID);

  } catch (error) {
    console.error("خطأ ارفع:", error);
    api.unsendMessage(waitingMsg.messageID);
    return api.sendMessage(`❌ حدث خطأ غير متوقع أثناء المعالجة.`, threadID, messageID);
  }
};
