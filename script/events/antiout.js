const fs   = require("fs");
const axios = require("axios");

module.exports.config = {
  name:      "تحكم_الجروب",
  eventType: ["log:subscribe", "log:unsubscribe"],
  version:   "6.2.0",
  credits:   "ayman",
  description: "ترحيب ووداع بـ GIF — مع دعم غلق/فتح الكروب",
};

module.exports.run = async ({ api, event, Users, Threads }) => {
  const { threadID, logMessageType: logType, logMessageData: logData } = event;
  const botID = String(api.getCurrentUserID());

  if (logType !== "log:subscribe" && logType !== "log:unsubscribe") return;

  // ── جيب اسم الكروب ───────────────────────────────────────────
  let groupName = "الجروب";
  try {
    const info = await api.getThreadInfo(threadID);
    groupName  = info.threadName || "الجروب";
  } catch(_) {}

  // ══════════════════════════════════════════════════════════════
  // 👋 انضمام
  // ══════════════════════════════════════════════════════════════
  if (logType === "log:subscribe") {
    const addedIDs = logData?.addedParticipants;
    if (!addedIDs?.length) return;

    // ① تحقق من antiJoin — لو الكروب مغلق لا ترسل ترحيب
    let isAntiJoin = false;
    try {
      const td   = await Threads.getData(threadID);
      isAntiJoin = td?.data?.antiJoin === true;
    } catch(_) {}

    if (isAntiJoin) return; // antijoin.js سيتولى الطرد بدون ضجة

    for (const user of addedIDs) {
      const userID = String(user.userFbId);
      if (!userID || userID === botID) continue;

      // ② تحقق من المطرودين الدائمين — لا ترحب بهم
      const isKicked = global._kickedUsers?.has(userID);
      if (isKicked) continue;

      // ③ تحقق من المحظورين
      const isBanned = global.data?.userBanned?.has(userID);
      if (isBanned) continue;

      let name = global.data?.userName?.get(userID);
      if (!name) {
        try { name = await Users.getNameUser(userID); } catch(_) { name = "عضو جديد"; }
      }

      await sendWithGif(
        api, threadID,
        `✨ نورت يا ${name}! ✨\nأهلاً وسهلاً في ${groupName} 🤍\n\nاتبع القوانين ولا تشاغب 😇`,
        "https://media.giphy.com/media/10N247rib4BlVC/giphy.gif",
        `welcome_${userID}`
      );
    }
    return;
  }

  // ══════════════════════════════════════════════════════════════
  // 🚪 مغادرة
  // ══════════════════════════════════════════════════════════════
  if (logType === "log:unsubscribe") {
    const leftID = String(logData?.leftParticipantFbId || "");
    if (!leftID || leftID === botID) return;

    // لو مطرود أو محظور — بلاش رسالة وداع
    if (global._kickedUsers?.has(leftID)) return;
    if (global.data?.userBanned?.has(leftID)) return;

    let name = global.data?.userName?.get(leftID);
    if (!name) {
      try { name = await Users.getNameUser(leftID); } catch(_) { name = "شخص ما"; }
    }

    const msgs = [
      `${name} راح 🚶‍♂️.. والله ما نشتاقلك 😂`,
      `باي باي يا ${name} 👋 ما راح يفرق معنا فراقك 💅`,
      `${name} طلع وكأنه ما كان موجود أصلاً 😴`,
      `وداعاً يا ${name}.. الجروب ما حس بفرق 🙃`,
      `${name} مشى.. الهواء صاف الحين 😌✨`,
    ];

    await sendWithGif(
      api, threadID,
      msgs[Math.floor(Math.random() * msgs.length)],
      "https://media.giphy.com/media/KRxcgvd5fLiWk/giphy.gif",
      `bye_${leftID}`
    );
    return;
  }
};

// ── helper: إرسال مع GIF ─────────────────────────────────────
async function sendWithGif(api, threadID, body, gifURL, prefix) {
  const gifPath = `${__dirname}/${prefix}_${Date.now()}.gif`;
  try {
    const data = (await axios.get(gifURL, { responseType: "arraybuffer", timeout: 10000 })).data;
    fs.writeFileSync(gifPath, Buffer.from(data));
    api.sendMessage(
      { body, attachment: fs.createReadStream(gifPath) },
      threadID,
      () => { try { fs.unlinkSync(gifPath); } catch(_) {} }
    );
  } catch(_) {
    api.sendMessage(body, threadID);
  }
}
