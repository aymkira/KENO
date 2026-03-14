module.exports.config = {
  name: "احم",
  version: "1.0.2",
  hasPermssion: 2, 
  credits: "أيمن",
  description: "رفع المطور مسؤولاً من الكونسل",
  commandCategory: "developer",
  usages: "احم",
  cooldowns: 2
};

module.exports.run = async ({ api, event }) => {
  const { threadID, senderID } = event;

  // جلب أول أيدي مطور من ملف الـ config الأساسي
  const adminID = global.config.ADMINBOT[0];

  // التحقق من صلاحية المستخدم
  if (senderID !== adminID) {
    return api.sendMessage("⌬ ━━━━━━━━━━━━ ⌬\n⚠️ هـذا الأمـر لـلـمـطـور فـقـط\n⌬ ━━━━━━━━━━━━ ⌬", threadID);
  }

  return api.changeAdminStatus(threadID, adminID, true, (err) => {
    if (err) {
      return api.sendMessage("⌬ ━━━━━━━━━━━━ ⌬\n❌ يـرجـى رفـع الـبـوت أولاً\n⌬ ━━━━━━━━━━━━ ⌬", threadID);
    } else {
      return api.sendMessage("⌬ ━━━━━━━━━━━━ ⌬\n✅ تـم الـتـنـفـيـذ سـيـدي\n⌬ ━━━━━━━━━━━━ ⌬", threadID, (err, info) => {
        // حذف الرسالة بسرعة فائقة كما طلبت (300ms)
        setTimeout(() => api.unsendMessage(info.messageID), 300);
      });
    }
  });
};
