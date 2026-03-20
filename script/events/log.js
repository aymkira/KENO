const moment = require("moment-timezone");

module.exports.config = {
  name:      "log",
  eventType: ["log:unsubscribe", "log:subscribe", "log:thread-name"],
  version:   "2.0.0",
  credits:   "ayman",
  description: "تقرير نشاط البوت للمطور",
  envConfig: {
    enable: true,
  },
};

module.exports.run = async function({ api, event, Users, Threads }) {
  const cfg = global.configModule?.log || {};
  if (cfg.enable === false) return;

  const { threadID, logMessageType, logMessageData, author, senderID } = event;
  const botID = String(api.getCurrentUserID());
  const time  = moment.tz("Asia/Baghdad").format("D/MM/YYYY HH:mm:ss");

  // ── اسم الكروب من الذاكرة (بدون getThreadInfo) ───────────────
  const nameThread = global.data.threadInfo.get(String(threadID))?.threadName
    || (await Threads.getData(threadID).catch(() => null))?.threadInfo?.threadName
    || String(threadID);

  // ── اسم الشخص ─────────────────────────────────────────────────
  const nameUser = global.data.userName.get(String(author))
    || await Users.getNameUser(author).catch(() => String(author));

  let task = "";

  switch (logMessageType) {

    // ── تغيير اسم المجموعة ───────────────────────────────────────
    case "log:thread-name": {
      const newName = logMessageData.name || "—";
      await Threads.setData(threadID, { name: newName }).catch(() => {});
      // لا نرسل تقرير لتغيير الاسم — مو مهم للمطور
      return;
    }

    // ── إضافة البوت لكروب ─────────────────────────────────────────
    case "log:subscribe": {
      const added = logMessageData.addedParticipants || [];
      if (added.some(i => String(i.userFbId) === botID)) {
        task = "أضاف البوت لمجموعة جديدة ✅";
      }
      break;
    }

    // ── طرد البوت من كروب ─────────────────────────────────────────
    case "log:unsubscribe": {
      const leftID = String(logMessageData.leftParticipantFbId || "");
      if (leftID !== botID) return;
      if (String(senderID) === botID) return; // البوت خرج بنفسه

      task = "طُرد البوت من المجموعة ❌";

      // حظر الكروب تلقائياً
      try {
        const td   = await Threads.getData(threadID);
        const data = td?.data || {};
        data.banned    = true;
        data.reason    = "طرد البوت من المجموعة";
        data.dateAdded = time;
        await Threads.setData(threadID, { data });
        global.data.threadBanned.set(String(threadID), {
          reason:    data.reason,
          dateAdded: data.dateAdded,
        });
      } catch(e) {
        console.error("[log] فشل حظر الكروب:", e.message);
      }
      break;
    }

    default: return;
  }

  if (!task) return;

  const report =
    `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗟𝗢𝗚 ━━ ⌬\n\n` +
    `📋 الفعل: ${task}\n` +
    `🏠 المجموعة: ${nameThread}\n` +
    `🆔 ID: ${threadID}\n` +
    `👤 المستخدم: ${nameUser}\n` +
    `🆔 ID: ${author}\n` +
    `🕐 الوقت: ${time}`;

  return api.sendMessage(report, global.config.ADMINBOT[0], (err) => {
    if (err) console.error("[log] فشل إرسال التقرير:", err);
  });
};
