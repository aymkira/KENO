module.exports = {
  config: {
    name: "اضف",
    version: "1.0.0",
    hasPermssion: 2, // فقط الأدمن أو المطور
    credits: "SOMI",
    description: "إضافة عضو إلى المجموعة عن طريق الـ ID",
    commandCategory: "إدارة",
    usages: "اضف [id]",
    cooldowns: 5,
  },
  
  run: async function({ api, event, args }) {
    if (!args[0]) return api.sendMessage("⚠️ يرجى إدخال معرف الشخص (UID)", event.threadID, event.messageID);

    let uid = args[0];
    let threadID = event.threadID;

    try {
      await api.addUserToGroup(uid, threadID);
      return api.sendMessage(`✅ تم إضافة العضو ${uid} إلى المجموعة بنجاح!`, threadID, event.messageID);
    } catch (e) {
      return api.sendMessage("❌ فشل في إضافة العضو. تأكد أن البوت عنده صلاحية إضافة أشخاص.", threadID, event.messageID);
    }
  }
};
