const fs = require("fs");
const axios = require("axios");

module.exports.config = {
  name: "تحكم_الجروب",
  eventType: ["log:subscribe", "log:unsubscribe"],
  version: "5.0",
  credits: "ChatGPT",
  description: "ترحيب واضافة وطرد ورجوع تلقائي برسائل فخمة وصور"
};

module.exports.run = async ({ api, event, Users, Threads }) => {
  const threadID = event.threadID;

  // جلب بيانات الجروب
  const threadInfo = await api.getThreadInfo(threadID);
  const groupName = threadInfo.threadName || "الجروب";

  // ============ عند الإضافة ==============
  if (event.logMessageType === "log:subscribe") {
    const addedIDs = event.logMessageData.addedParticipants;

    for (const user of addedIDs) {
      const userID = user.userFbId;

      const name =
        global.data.userName.get(userID) ||
        (await Users.getNameUser(userID));

      // جلب صورة بروفايل العضو
      const avatarURL = `https://graph.facebook.com/${userID}/picture?width=800&height=800`;

      const imgPath = __dirname + `/welcome_${userID}.png`;
      const imgData = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(imgPath, Buffer.from(imgData, "utf-8"));

      api.sendMessage(
        {
          body:
            `🌟 أهلاً وسهلاً يا ${name} 🌟\n` +
            `نورت جروب **${groupName}** 🤍✨\n\n` +
            `خلي الجروب يشوف حضورك يا جميل 😎🔥`,
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => fs.unlinkSync(imgPath) // حذف الصورة بعد الإرسال
      );
    }

    return;
  }

  // ============ عند المغادرة ==============
  if (event.logMessageType === "log:unsubscribe") {
    const leftUser = event.logMessageData.leftParticipantFbId;
    const name =
      global.data.userName.get(leftUser) ||
      (await Users.getNameUser(leftUser));

    // طلع لوحده
    if (event.author == leftUser) {
      api.addUserToGroup(leftUser, threadID, async (err) => {
        if (err) {
          return api.sendMessage(`🚪 ${name} غادر...`, threadID);
        }

        // بعد إرجاعه، نرسل له رسالة فخمة
        api.sendMessage(
          `✨ تعال يا حلو 😘\nلا تهرب مرّة ثانية!`,
          threadID
        );
      });

      return;
    }

    // تم طرده
    else {
      // صورة مضحكة – حط صورتك بدل الرابط لو تبغى
      const funnyImg = "https://i.ibb.co/7NRn0Tcn/d98f24daea4c.gif";

      const imgPath = __dirname + `/kick_${leftUser}.jpg`;
      const imgData = (await axios.get(funnyImg, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(imgPath, Buffer.from(imgData, "utf-8"));

      api.sendMessage(
        {
          body: `🚫 لا أحب نباح الكلاب 🐶!\nتم التخلص من ${name} بنجاح 😂🔥`,
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => fs.unlinkSync(imgPath)
      );
    }
  }
};
