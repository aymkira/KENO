const fs = require("fs");

module.exports.config = {
  name: "ضيفني",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "إضافة نفسك لمجموعة عبر المطور",
  commandCategory: "🔧 المطور فقط",
  usages: "ضفني",
  cooldowns: 3
};

const ownerID = "61572167800906"; // ✅ ضع آي دي المطور هنا

module.exports.run = async ({ api, event }) => {
  const { senderID, threadID, messageID } = event;

  // تحقق هل المستخدم هو المطور
  if (senderID != ownerID) {
    return api.sendMessage("😴 روح نام ذى الأمر لعزيزي انس فقط 🙂", threadID, messageID);
  }

  // الحصول على لائحة الجروبات
  const allThreads = await api.getThreadList(50, null, ["INBOX"]);
  const groupThreads = allThreads.filter(t => t.isGroup && t.name);

  if (groupThreads.length === 0) {
    return api.sendMessage("❌ لا يوجد أي جروبات في القائمة!", threadID, messageID);
  }

  let list = "";
  groupThreads.forEach((g, index) => {
    list += `${index + 1}. ${g.name} (${g.threadID})\n`;
  });

  api.sendMessage(
    `📜 اختر رقم المجموعة التي تريد إضافتك إليها:\n\n${list}\n✏️ رد برقم الجروب.`,
    threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        author: senderID,
        messageID: info.messageID,
        groupList: groupThreads
      });
    }
  );
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, senderID, body, messageID } = event;

  // تأكد أن نفس الشخص يرد
  if (senderID != handleReply.author) return;

  const index = parseInt(body);
  const group = handleReply.groupList[index - 1];
  if (!group) return api.sendMessage("❌ رقم غير صحيح!", threadID, messageID);

  try {
    await api.addUserToGroup(senderID, group.threadID);
    return api.sendMessage(`✅ تمت إضافتك إلى المجموعة بنجاح: ${group.name}`, threadID, messageID);
  } catch (err) {
    try {
      await api.sendMessage(`🚫 لا أستطيع إضافتك مباشرةً لأنني لست أدمن في المجموعة (${group.name}).\n📤 تم إرسال طلب انضمام إن أمكن.`, threadID, messageID);
      await api.addUserToGroup(senderID, group.threadID);
    } catch {
      api.sendMessage(`🔗 لا يمكنني الإضافة، ربما الجروب لا يدعم الطلبات.\nجرب تطلب يدوياً.`, threadID, messageID);
    }
  }
};
