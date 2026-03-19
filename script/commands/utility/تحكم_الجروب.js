const fs   = require("fs");
const axios = require("axios");

module.exports.config = {
  name: "تحكم_الجروب",
  eventType: ["log:subscribe", "log:unsubscribe"],
  version: "6.1",
  credits: "KIRA",
  description: "ترحيب ووداع بـ GIF"
};

module.exports.run = async ({ api, event, Users, Threads }) => {
  const threadID = event.threadID;
  const logType  = event.logMessageType;
  const logData  = event.logMessageData;

  // ══════════════════════════════════════════
  // ✅ حماية أولى: تجاهل أي شيء غير معروف
  // ══════════════════════════════════════════
  if (logType !== "log:subscribe" && logType !== "log:unsubscribe") return;

  let groupName = "الجروب";
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    groupName = threadInfo.threadName || "الجروب";
  } catch (_) {}

  // ══════════════════════════════════════════
  // 👋 عند الانضمام فقط
  // ══════════════════════════════════════════
  if (logType === "log:subscribe") {
    const addedIDs = logData?.addedParticipants;
    if (!addedIDs || addedIDs.length === 0) return;

    for (const user of addedIDs) {
      const userID = user.userFbId;
      if (!userID) continue;

      // تجاهل البوت نفسه
      if (userID === api.getCurrentUserID()) continue;

      let name = global.data.userName.get(userID);
      if (!name) {
        try { name = await Users.getNameUser(userID); } catch (_) { name = "عضو جديد"; }
      }

      const gifURL  = "https://media.giphy.com/media/10N247rib4BlVC/giphy.gif";
      const gifPath = __dirname + `/welcome_${userID}_${Date.now()}.gif`;

      try {
        const gifData = (await axios.get(gifURL, { responseType: "arraybuffer", timeout: 10000 })).data;
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
        api.sendMessage(
          `✨ نورت يا ${name}!\nأهلاً في ${groupName} — اتبع القوانين ولا تشاغب 😇`,
          threadID
        );
      }
    }

    return; // ← مهم: وقف هنا ولا تكمل لأسفل
  }

  // ══════════════════════════════════════════
  // 🚪 عند المغادرة فقط
  // ══════════════════════════════════════════
  if (logType === "log:unsubscribe") {
    const leftUser = logData?.leftParticipantFbId;
    if (!leftUser) return; // ← حماية: لو undefined لا تكمل

    // تجاهل لو البوت نفسه هو اللي طُرد
    if (leftUser === api.getCurrentUserID()) return;

    let name = global.data.userName.get(leftUser);
    if (!name) {
      try { name = await Users.getNameUser(leftUser); } catch (_) { name = "شخص ما"; }
    }

    const msgs = [
      `${name} راح 🚶‍♂️.. والله ما نشتاقلك 😂`,
      `باي باي يا ${name} 👋 ما راح يفرق معنا فراقك 💅`,
      `${name} طلع وكأنه ما كان موجود أصلاً 😴`,
      `وداعاً يا ${name}.. الجروب ما حس بفرق 🙃`,
      `${name} مشى.. الهواء صاف الحين 😌✨`
    ];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];

    const gifURL  = "https://media.giphy.com/media/KRxcgvd5fLiWk/giphy.gif";
    const gifPath = __dirname + `/bye_${leftUser}_${Date.now()}.gif`;

    try {
      const gifData = (await axios.get(gifURL, { responseType: "arraybuffer", timeout: 10000 })).data;
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
      api.sendMessage(msg, threadID);
    }

    return;
  }
};