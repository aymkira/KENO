const axios = require('axios');
const FormData = require('form-data');

module.exports.config = {
  name: "ارفع",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "رفع الصور والفيديوهات على Catbox بطريقة الـ Buffer المستقرة",
  commandCategory: "utility",
  usages: "رد على ملف بـ .ارفع",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, type, messageReply } = event;

  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage("⚠️ يا رعاك الله، رد على (صورة أو فيديو) لرفعها.", threadID, messageID);
  }

  try {
    const waitingMsg = await api.sendMessage("⏳ جاري الرفع... قد يستغرق الأمر ثوانٍ حسب حجم الملف.", threadID);

    const attachment = messageReply.attachments[0];
    const fileUrl = attachment.url;

    // 1. جلب الملف كـ Buffer (أكثر استقراراً من Stream لتجنب خطأ 500)
    const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data);

    // 2. تحديد اسم الملف مع امتداده الصحيح
    const ext = attachment.type === "photo" ? "jpg" : 
                attachment.type === "video" ? "mp4" : 
                attachment.type === "audio" ? "mp3" : "bin";
    const filename = `file.${ext}`;

    // 3. إعداد فورم البيانات
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', buffer, { filename });

    // 4. إرسال الطلب
    const uploadRes = await axios.post('https://catbox.moe/user/api.php', formData, {
      headers: formData.getHeaders()
    });

    api.unsendMessage(waitingMsg.messageID);

    return api.sendMessage(
      `⌬ ━━ 𝗖𝗔𝗧𝗕𝗢𝗫 𝗨𝗣𝗟𝗢𝗔𝗗 ━━ ⌬\n\n✅ تم الرفع بنجاح!\n🔗 الرابط المباشر:\n${uploadRes.data}`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("خطأ ارفع:", error);
    return api.sendMessage(`❌ فشل الرفع. السبب: ${error.message}\n💡 حاول مرة أخرى مع ملف أصغر.`, threadID, messageID);
  }
};
