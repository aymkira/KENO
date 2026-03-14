module.exports.config = {
  name: "اطردني",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "أيمن",
  description: "مغادرة المجموعة عبر الطرد",
  commandCategory: "utility",
  usages: "اطردني",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, senderID, messageID } = event;
  const header = `⌬ ━━━━━━━━━━━━ ⌬\n      🚪 مـغـادرة الـنـظـام\n⌬ ━━━━━━━━━━━━ ⌬`;
  
  // جلب أيدي المطور من الكونسل للحماية
  const adminID = global.config.ADMINBOT[0];

  try {
    // حماية المطور: البوت يرفض طردك
    if (senderID === adminID) {
      return api.sendMessage(`${header}\n\n⚠️ لا يمكنني طرد المطور سيدي!`, threadID, (err, info) => {
          setTimeout(() => api.unsendMessage(info.messageID), 4000);
      }, messageID);
    }

    const info = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const isBotAdmin = info.adminIDs.some(e => e.id == botID);

    if (!isBotAdmin) {
      return api.sendMessage(`${header}\n\n❌ البوت ليس مسؤولاً (أدمن) هنا.`, threadID, (err, info) => {
          setTimeout(() => api.unsendMessage(info.messageID), 4000);
      }, messageID);
    }

    // إرسال رسالة الوداع أولاً ثم الطرد
    await api.sendMessage(`${header}\n\n👋 وداعاً، تم تنفيذ طلبك.`, threadID);
    
    // تنفيذ الطرد
    return api.removeUserFromGroup(senderID, threadID);

  } catch (err) {
    return api.sendMessage(`${header}\n\n⚠️ عذراً، حدث خطأ أثناء المحاولة.`, threadID, messageID);
  }
};
