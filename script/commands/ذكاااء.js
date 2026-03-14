const axios = require("axios");

module.exports.config = {
  name: "ذكاء",
  version: "3.0",
  hasPermssion: 0,
  credits: "SOMI",
  description: "ذكاء اصطناعي يتابع معك بالردود عبر handleReply",
  commandCategory: "AI",
  usages: ".ذكاء [النص]",
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  // لو ما كتب شيء بعد الأمر
  if (args.length === 0) {
    return api.sendMessage("⚡ اكتب نص بعد الأمر للتجربة", threadID, messageID);
  }

  const prompt = args.join(" ");

  try {
    const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
    const answer = response.data?.trim() || "❌ لم يتم الحصول على رد";

    // البوت يرسل الرد + يسجل handleReply
    return api.sendMessage(answer, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        type: "aiChat",
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ حدث خطأ أثناء التجربة", threadID, messageID);
  }
};

// متابعة الردود
module.exports.handleReply = async ({ api, event, handleReply }) => {
  try {
    const { threadID, messageID, senderID, body } = event;

    // لو تبغى تقيّد الرد على نفس الشخص اللي بدأ المحادثة
    if (handleReply.author && handleReply.author !== senderID) {
      return api.sendMessage("⚠️ هذه المحادثة ليست لك", threadID, messageID);
    }

    const prompt = body;
    if (!prompt) return;

    const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
    const answer = response.data?.trim() || "❌ لم يتم الحصول على رد";

    // إرسال رد جديد وتسجيله مرة أخرى للاستمرار
    return api.sendMessage(answer, threadID, (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        type: "aiChat",
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ حدث خطأ", event.threadID, event.messageID);
  }
};
