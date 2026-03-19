const fs = require("fs");
const axios = require("axios");

module.exports.config = {
  name: "تحكم_الجروب",
  eventType: ["log:subscribe", "log:unsubscribe"],
  version: "6.0",
  credits: "KIRA",
  description: "ترحيب ووداع بـ GIF"
};

module.exports.run = async ({ api, event, Users, Threads }) => {
  const threadID = event.threadID;

  const threadInfo = await api.getThreadInfo(threadID);
  const groupName = threadInfo.threadName || "الجروب";

  // ============ عند الانضمام ==============
  if (event.logMessageType === "log:subscribe") {
    const addedIDs = event.logMessageData.addedParticipants;

    for (const user of addedIDs) {
      const userID = user.userFbId;

      // البوت نفسه انضاف — تجاهل
      if (userID === api.getCurrentUserID()) continue;

      const name =
        global.data.userName.get(userID) ||
        (await Users.getNameUser(userID));

      // GIF الترحيب — أنيمي كيوت
      const gifURL = "https://media.giphy.com/media/10N247rib4BlVC/giphy.gif";
      const gifPath = __dirname + `/welcome_${userID}.gif`;

      try {
        const gifData = (await axios.get(gifURL, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(gifPath, Buffer.from(gifData));

        api.sendMessage(
          {
            body:
              `✨ نورت يا ${name}! ✨\n` +
              `أهلاً وسهلاً في ${groupName} 🤍\n\n` +
              `اتبع القوانين ولا تشاغب 😇`,
            attachment: fs.createReadStream(gifPath)
          },
          threadID,
          () => { try { fs.unlinkSync(gifPath); } catch (_) {} }
        );
      } catch (err) {
        // لو فشل تحميل الـ GIF نرسل رسالة بدونه
        api.sendMessage(
          `✨ نورت يا ${name}!\nأهلاً في ${groupName} — اتبع القوانين ولا تشاغب 😇`,
          threadID
        );
      }
    }

    return;
  }

  // ============ عند المغادرة ==============
  if (event.logMessageType === "log:unsubscribe") {
    const leftUser = event.logMessageData.leftParticipantFbId;
    const name =
      global.data.userName.get(leftUser) ||
      (await Users.getNameUser(leftUser));

    // GIF الوداع — Tony Awards
    const gifURL = "https://media.giphy.com/media/KRxcgvd5fLiWk/giphy.gif";
    const gifPath = __dirname + `/bye_${leftUser}.gif`;

    // رسائل مستفزة عشوائية
    const msgs = [
      `${name} راح 🚶‍♂️.. والله ما نشتاقلك 😂`,
      `باي باي يا ${name} 👋 ما راح يفرق معنا فراقك 💅`,
      `${name} طلع وكأنه ما كان موجود أصلاً 😴`,
      `وداعاً يا ${name}.. الجروب ما حس بفرق 🙃`,
      `${name} مشى.. الهواء صاف الحين 😌✨`
    ];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];

    try {
      const gifData = (await axios.get(gifURL, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(gifPath, Buffer.from(gifData));

      api.sendMessage(
        {
          body: msg,
          attachment: fs.createReadStream(gifPath)
        },
        threadID,
        () => { try { fs.unlinkSync(gifPath); } catch (_) {} }
      );
    } catch (err) {
      // لو فشل تحميل الـ GIF نرسل الرسالة بدونه
      api.sendMessage(msg, threadID);
    }
  }
};
