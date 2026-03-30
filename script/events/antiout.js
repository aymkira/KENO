const fs    = require("fs");
const path  = require("path");
const axios = require("axios");

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch(_){} }
  return {};
}

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); }
  catch { return null; }
}

const CFG      = loadConfig();
const BOT_NAME = CFG.BOTNAME || "BOT";
const DEV_ID   = String(CFG.DEVELOPER_ID || CFG.developerID || CFG.ownerID || "");

module.exports.config = {
  name:      "تحكم_الجروب",
  eventType: ["log:subscribe", "log:unsubscribe"],
  version:   "8.0.0",
  credits:   "ayman",
  description: `${BOT_NAME} — ترحيب ووداع بـ GIF مع تسجيل سحابي`,
};

module.exports.run = async ({ api, event, Users, Threads }) => {
  const { threadID, logMessageType: logType, logMessageData: logData } = event;
  const botID = String(api.getCurrentUserID());
  const db    = getDB();

  // ── جيب اسم الكروب ───────────────────────────────────────────
  let groupName = "الجروب";
  try {
    const info = await api.getThreadInfo(threadID);
    groupName  = info.threadName || "الجروب";
  } catch(_) {}

  // ════════════════════════════════════════════════════════════
  // 👋 انضمام
  // ════════════════════════════════════════════════════════════
  if (logType === "log:subscribe") {
    const addedIDs = logData?.addedParticipants;
    if (!addedIDs?.length) return;

    // لو الكروب مغلق — لا ترسل ترحيب
    let isAntiJoin = false;
    try {
      const td   = await Threads.getData(threadID);
      isAntiJoin = td?.data?.antiJoin === true;
    } catch(_) {}
    if (isAntiJoin) return;

    for (const user of addedIDs) {
      const userID = String(user.userFbId);
      if (!userID || userID === botID) continue;
      if (global._kickedUsers?.has(userID))    continue;
      if (global.data?.userBanned?.has(userID)) continue;

      // ── تحقق من السحابة: هل سبق وانضم لنفس الكروب؟ ─────────
      let alreadyWelcomed = false;
      if (db) {
        try {
          const rec = await db.getAnalysis(`join_${threadID}_${userID}`);
          if (rec) alreadyWelcomed = true;
        } catch(_) {}
      }

      let name = global.data?.userName?.get(userID);
      if (!name) {
        try { name = await Users.getNameUser(userID); } catch(_) { name = "عضو جديد"; }
      }

      if (!alreadyWelcomed) {
        await sendWithGif(
          api, threadID,
          `✨ نورت يا ${name}!\nأهلاً وسهلاً في ${groupName} 🤍\n\nاتبع القوانين ولا تشاغب 😇`,
          "https://media.giphy.com/media/10N247rib4BlVC/giphy.gif",
          `welcome_${userID}`
        );
      }

      // ── سجّل العضو في السحابة ─────────────────────────────────
      if (db) {
        try {
          await db.ensureUser(userID, name);

          await db.setAnalysis(`join_${threadID}_${userID}`, {
            userID,
            name,
            threadID,
            groupName,
            joinedAt: new Date().toISOString(),
            welcomed: !alreadyWelcomed,
          });

          await db.logEvent('member_join', {
            userID, name, threadID, groupName,
            rejoined: alreadyWelcomed,
            at: new Date().toISOString(),
          });
        } catch(_) {}
      }
    }
    return;
  }

  // ════════════════════════════════════════════════════════════
  // 🚪 مغادرة
  // ════════════════════════════════════════════════════════════
  if (logType === "log:unsubscribe") {
    const leftID  = String(logData?.leftParticipantFbId || "");
    const actorID = String(logData?.actorFbId || logData?.actor || "");
    if (!leftID || leftID === botID) return;
    if (global._kickedUsers?.has(leftID))    return;
    if (global.data?.userBanned?.has(leftID)) return;

    let name = global.data?.userName?.get(leftID);
    if (!name) {
      try { name = await Users.getNameUser(leftID); } catch(_) { name = "شخص ما"; }
    }

    // ── المطور خرج → البوت يتبعه ─────────────────────────────
    if (DEV_ID && leftID === DEV_ID) {
      try {
        api.sendMessage(`😔 المطور غادر.. أنا ماراح أبقى بدونه\nباي ${groupName} 🖤`, threadID, () => {
          api.removeUserFromGroup(botID, threadID);
        });
      } catch(_) {
        api.removeUserFromGroup(botID, threadID);
      }
      return;
    }

    // هل طلع لوحده أم انطرد من ادمن؟
    const leftByHimself = !actorID || actorID === leftID;

    if (leftByHimself) {
      // ── طلع لوحده → رجّعه غصبا ────────────────────────────
      try {
        await new Promise((res, rej) =>
          api.addUserToGroup(leftID, threadID, e => e ? rej(e) : res())
        );
        api.sendMessage(`🔒 ${name} حاول يطلع بس ما خلّيناه 😈`, threadID);
      } catch(_) {
        api.sendMessage(`⚠️ حاولت أرجّع ${name} بس ما قدرت.`, threadID);
      }
    } else {
      // ── انطرد من ادمن → وداع + GIF فقط ──────────────────
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
    }

    // سجّل المغادرة في السحابة
    if (db) {
      try {
        await db.logEvent('member_leave', {
          userID: leftID, name, threadID, groupName,
          kicked: !leftByHimself,
          at: new Date().toISOString(),
        });
      } catch(_) {}
    }
    return;
  }
};

// ── helper: إرسال مع GIF ─────────────────────────────────────
async function sendWithGif(api, threadID, body, gifURL, prefix) {
  const gifPath = path.join(__dirname, `${prefix}_${Date.now()}.gif`);
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
