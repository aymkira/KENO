module.exports.config = {
  name: "طرد",
  version: "1.2.0",
  hasPermssion: 1,
  credits: "ايمن",
  description: "طرد عضو مع حماية مطوري البوت من الكونسق",
  commandCategory: "admin",
  usages: "[@منشن] أو رد على رسالة",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Threads }) {
  const { threadID, messageID, mentions, messageReply, senderID } = event;

  // سحب قائمة المطورين من ملف config.json الخاص بالبوت
  const config = global.config.ADMINBOT || [];

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);

    if (!isAdmin) {
      return api.sendMessage(
        "⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون مشرفاً في المجموعة لاستخدام هذا الأمر",
        threadID,
        messageID
      );
    }

    let targetID;

    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      return api.sendMessage(
        "⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n📝 الاستخدام:\n• طرد @منشن\n• أو قم بالرد على رسالة العضو المراد طرده",
        threadID,
        messageID
      );
    }

    // --- نظام الحماية الديناميكي ---
    // يتحقق إذا كان المستهدف موجوداً في قائمة مطوري البوت في الـ config
    if (config.includes(targetID)) {
      return api.sendMessage(
        "⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🚫 حماية المطور مفعلة! لا يمكنني طرد أحد مطوري أو مدراء البوت العظماء.",
        threadID,
        messageID
      );
    }

    if (targetID === botID) {
      return api.sendMessage(
        "⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n😅 لا يمكنني طرد نفسي!",
        threadID,
        messageID
      );
    }
    // ----------------------------

    await api.removeUserFromGroup(targetID, threadID);

    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم طرد العضو بنجاح من المجموعة`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("طرد - خطأ:", error);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n❌ حدث خطأ أثناء طرد العضو\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};
