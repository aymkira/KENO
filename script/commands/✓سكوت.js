module.exports.config = {
  name: "سكوت",
  version: "1.1.0",
  hasPermission: 2,
  credits: "DRIDI-RAYEN - تعديل بواسطة ChatGPT",
  description: "تفعيل وضع السكوت، حيث يتم طرد كل من يتحدث باستثناء الأدمن",
  usePrefix: false,
  commandCategory: "〘 ادمن المجموعات 〙",
  usages: "سكوت تشغيل / سكوت ايقاف",
  cooldowns: 5,
  allowedThreads: [],
  isOn: false
};

module.exports.handleEvent = async ({ api, event }) => {
  const { threadID, senderID, type } = event;
  const { isOn, allowedThreads } = module.exports.config;
  const adminBot = global.config.ADMINBOT;

  if (!isOn || !allowedThreads.includes(threadID)) return;

  const threadInfo = await api.getThreadInfo(threadID);
  const userInfo = await api.getUserInfo(senderID);
  const userName = userInfo[senderID].name;

  if (senderID == api.getCurrentUserID() || adminBot.includes(senderID)) return;

  const isAdmin = threadInfo.adminIDs.some(user => user.id == senderID);
  if (type === "message" && !isAdmin) {
    await api.removeUserFromGroup(senderID, threadID);
    return api.sendMessage({
      body: `⚠️ لقد خالفت القواعد يا ${userName}!\nتم طردك لأن وضع السكوت مفعل، لا تتكلم مجددًا إلا بعد إيقافه.`,
      mentions: [{
        tag: userName,
        id: senderID
      }]
    }, threadID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const adminBot = global.config.ADMINBOT;
  const threadInfo = await api.getThreadInfo(threadID);

  const isAdmin = threadInfo.adminIDs.some(user => user.id == senderID);

  // التحقق من الصلاحيات
  if (!isAdmin && !adminBot.includes(senderID)) {
    return api.sendMessage("❌ ليس لديك صلاحية استخدام هذا الأمر، فقط المطور أو أدمن المجموعة!", threadID, messageID);
  }

  if (args[0] === "تشغيل") {
    if (!module.exports.config.allowedThreads.includes(threadID)) {
      module.exports.config.allowedThreads.push(threadID);
    }
    module.exports.config.isOn = true;
    return api.sendMessage(
      `🔇 تم تفعيل وضع السكوت!\n⚠️ سيتم طرد أي عضو يتحدث من دون إذن.`,
      threadID,
      messageID
    );
  } else if (args[0] === "ايقاف") {
    module.exports.config.isOn = false;
    const index = module.exports.config.allowedThreads.indexOf(threadID);
    if (index > -1) {
      module.exports.config.allowedThreads.splice(index, 1);
    }
    return api.sendMessage(
      "✅ تم إيقاف وضع السكوت.\n🎉 الآن يمكن للجميع التحدث بحرية!",
      threadID,
      messageID
    );
  } else {
    return api.sendMessage(
      "❓ استخدم: سكوت تشغيل / سكوت ايقاف",
      threadID,
      messageID
    );
  }
};
