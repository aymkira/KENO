const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "ارسل",
  version: "1.5.0",
  hasPermssion: 2,
  credits: "ايمن",
  description: "إرسال رسالة جماعية للمجموعات (نص + وسائط)",
  commandCategory: "developer",
  usages: "ارسل [النص] أو بالرد على صورة/فيديو",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, type, messageReply } = event;

  // التحقق من المطور
  if (!global.config.ADMINBOT.includes(senderID)) {
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n⚠️ هذا الأمر مخصص للمطور فقط.", threadID, messageID);
  }

  let content = args.join(" ");
  if (!content && type !== "message_reply") {
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n⚠️ يرجى كتابة نص الرسالة أو الرد على صورة/فيديو.", threadID, messageID);
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);

  // جلب قائمة المجموعات
  const allThreads = await api.getThreadList(500, null, ["INBOX"]);
  const groupIDs = allThreads.filter(t => t.isGroup && t.threadID !== threadID).map(g => g.threadID);
  
  let count = 0;
  let errorCount = 0;
  let attachmentData = [];
  const cachePath = path.join(__dirname, "cache", `broadcast_${Date.now()}`);

  // معالجة المرفقات إذا وجد رد على رسالة
  if (type === "message_reply" && messageReply.attachments.length > 0) {
    for (let i = 0; i < messageReply.attachments.length; i++) {
      const att = messageReply.attachments[i];
      const ext = att.type === "photo" ? "jpg" : att.type === "video" ? "mp4" : att.type === "audio" ? "mp3" : "bin";
      const filePath = `${cachePath}_${i}.${ext}`;
      const getFile = (await axios.get(att.url, { responseType: "arraybuffer" })).data;
      fs.ensureDirSync(path.join(__dirname, "cache"));
      fs.writeFileSync(filePath, Buffer.from(getFile));
      attachmentData.push(fs.createReadStream(filePath));
    }
  }

  // إرسال الرسالة للجميع
  for (const id of groupIDs) {
    try {
      let msgObject = { 
        body: `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗕𝗥𝗢𝗔𝗗𝗖𝗔𝗦𝗧 ━━ ⌬\n\n📢 رسالة من المطور:\n\n${content}` 
      };
      if (attachmentData.length > 0) msgObject.attachment = attachmentData;
      
      await api.sendMessage(msgObject, id);
      count++;
      // تأخير بسيط لتجنب حظر البوت
      await new Promise(resolve => setTimeout(resolve, 500)); 
    } catch (e) {
      errorCount++;
    }
  }

  // تنظيف الكاش
  if (attachmentData.length > 0) {
    const files = fs.readdirSync(path.join(__dirname, "cache"));
    files.filter(f => f.startsWith("broadcast_")).forEach(f => fs.unlinkSync(path.join(__dirname, "cache", f)));
  }

  api.setMessageReaction("✅", messageID, () => {}, true);
  return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم الإرسال بنجاح:\n مجموعات: ${count}\n فشل: ${errorCount}`, threadID, messageID);
};
