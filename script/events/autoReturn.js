const path = require("path");

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(require("fs").readFileSync(p, "utf8")); } catch(_){} }
  return {};
}

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); }
  catch { return null; }
}

module.exports.config = {
  name:        "autoReturn",
  eventType:   ["log:unsubscribe"],
  version:     "2.0.0",
  credits:     "ayman",
  description: "إعادة أي شخص يطلع من الكروب تلقائياً",
  envConfig: {
    enable:      true,
    sendMessage: true,
    delayMs:     2000,
  },
};

module.exports.run = async function({ api, event, Threads, Users }) {
  const CFG      = loadConfig();
  const BOT_NAME = CFG.BOTNAME || "BOT";
  const cfg      = global.configModule?.autoReturn || module.exports.config.envConfig;

  if (cfg.enable === false) return;

  const { threadID, logMessageData } = event;
  const botID    = String(api.getCurrentUserID());
  const ADMINBOT = (CFG.ADMINBOT || global.config?.ADMINBOT || []).map(String);
  const db       = getDB();

  const leftID = String(logMessageData?.leftParticipantFbId || "");
  if (!leftID) return;

  // ── تجاهل: البوت نفسه ────────────────────────────────────────
  if (leftID === botID) return;

  // ── تجاهل: المطورين ──────────────────────────────────────────
  if (ADMINBOT.includes(leftID)) return;

  // ── تجاهل: المطرودين الدائمين ────────────────────────────────
  if (global._kickedUsers?.has(leftID)) return;

  // ── تجاهل: المحظورين ─────────────────────────────────────────
  if (global.data?.userBanned?.has(leftID)) return;

  // ── تجاهل: إذا طرده الأدمن أو المطور ────────────────────────
  // logMessageData.leftParticipantFbId = الشخص اللي طلع
  // إذا طُرد بواسطة شخص ثاني (kickedBy) مو مجرد خروج
  const kickedBy = String(logMessageData?.kickedBy || logMessageData?.author || "");
  if (kickedBy && kickedBy !== leftID) {
    // طرده شخص ثاني — تحقق هل هو أدمن أو مطور
    if (ADMINBOT.includes(kickedBy) || kickedBy === botID) return;

    // تحقق هل هو أدمن في الكروب
    try {
      const td = await Threads.getData(threadID).catch(() => null);
      const admins = (td?.threadInfo?.adminIDs || []).map(a => String(a.id || a));
      if (admins.includes(kickedBy)) return;
    } catch(_) {}
  }

  // ── تحقق من إعداد autoReturn للكروب ─────────────────────────
  try {
    const cached = global.data?.threadData?.get(String(threadID));
    if (cached?.autoReturn === false) return;
    if (cached?.autoReturn === undefined) {
      const td = await Threads.getData(threadID).catch(() => null);
      if (td?.data?.autoReturn === false) return;
    }
  } catch(_) {}

  // ── تأخير بشري ───────────────────────────────────────────────
  await new Promise(r => setTimeout(r, cfg.delayMs ?? 2000));

  // ── محاولة الإعادة ────────────────────────────────────────────
  try {
    await new Promise((resolve, reject) => {
      api.addUserToGroup([leftID], threadID, err => err ? reject(err) : resolve());
    });

    // سجّل الإعادة في السحابة
    if (db) {
      try {
        await db.logEvent('auto_return', {
          userID: leftID, threadID,
          at: new Date().toISOString(),
        });
      } catch(_) {}
    }

    if (cfg.sendMessage !== false) {
      let name = global.data?.userName?.get(leftID);
      if (!name) {
        try { name = await Users.getNameUser(leftID); } catch(_) { name = leftID; }
      }

      const msgs = [
        `${name} وين تروح؟ 😂 ما تقدر تطلع!`,
        `${name} حاول يهرب — فشل 😈`,
        `مستحيل تطلع يا ${name}! 🔄`,
        `${name} جاب رجله ورجعنا! 😂`,
      ];

      api.sendMessage(
        msgs[Math.floor(Math.random() * msgs.length)],
        threadID, () => {}
      );
    }

  } catch(err) {
    const msg = String(err?.message || err || "");
    if (/not.*admin|permission|admin/i.test(msg)) {
      api.sendMessage(`⚠️ ${BOT_NAME}: أحتاج صلاحية أدمن لإعادة الأعضاء`, threadID, () => {});
      return;
    }
    if (/blocked|privacy/i.test(msg)) return;
  }
};
