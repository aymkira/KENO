const OWNER_ID = "61584059280197"; // معرف المطور
const TARGET_GROUP_ID = "2815848538626399"; // معرف جروب البوت

module.exports.config = {
  name: "انضمام",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "انس",
  description: "إضافة عضو أو جميع الأعضاء لجروب البوت",
  commandCategory: "إداري",
  cooldowns: 5,
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryAddUser(api, userID) {
  try {
    await api.addUserToGroup(userID, TARGET_GROUP_ID);
    return { success: true };
  } catch (err) {
    if (err.errorDescription?.includes("This person cannot be added") ||
        err.errorDescription?.includes("Requests to join")) {
      return { success: false, request: true };
    }
    return { success: false, request: false };
  }
}

module.exports.run = async function ({ api, event }) {
  const { senderID, threadID, messageID } = event;

  // إذا المطور كتب الأمر
  if (senderID === OWNER_ID) {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const members = threadInfo.participantIDs;
      const userInfos = await new Promise((resolve, reject) => {
        api.getUserInfo(members, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      let successCount = 0;
      let requestCount = 0;
      let failCount = 0;
      let failedMembers = [];

      for (const id of members) {
        const result = await tryAddUser(api, id);
        if (result.success) {
          successCount++;
        } else if (result.request) {
          requestCount++;
        } else {
          failCount++;
          failedMembers.push(`${userInfos[id]?.name || "غير معروف"} (${id})`);
        }

        await delay(100); // تأخير 0.1 ثانية
      }

      let failListText = failedMembers.length
        ? `\n\n❌ لم يتم إضافة:\n${failedMembers.join("\n")}`
        : "";

      api.sendMessage(
        `✅ تمت الإضافة بنجاح: ${successCount}\n📌 أُضيفوا لطلبات الموافقة: ${requestCount}\n❌ فشل الإضافة: ${failCount}${failListText}`,
        threadID,
        messageID
      );
    } catch (err) {
      api.sendMessage("❌ حدث خطأ أثناء جلب الأعضاء.", threadID, messageID);
      console.error(err);
    }
  } else {
    // المستخدم العادي يضيف نفسه
    const result = await tryAddUser(api, senderID);
    if (result.success) {
      api.sendMessage("✅ تمت إضافتك إلى مجموعة البوت الأسطوري.", threadID, messageID);
    } else if (result.request) {
      api.sendMessage("📌 تمت الإضافة لطلبات الموافقة، عليك الانتظار.", threadID, messageID);
    } else {
      api.sendMessage("❌ فشل الإضافة، تحقق من الصلاحيات.", threadID, messageID);
    }
  }
};
