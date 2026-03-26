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
  name:        "antijoin",
  eventType:   ["log:subscribe"],
  version:     "3.0.0",
  credits:     "ayman",
  description: "منع إضافة أعضاء جدد للمجموعة",
};

// ── قوانين الجروب ──────────────────────────────────────────────
const RULES = `
⌬ ━━━━━━━━━━━━━━━━ ⌬
      📋 قوانين الجروب
⌬ ━━━━━━━━━━━━━━━━ ⌬

1️⃣ الاحترام المتبادل بين الأعضاء
2️⃣ ممنوع الإزعاج والسبّ
3️⃣ ممنوع إرسال روابط أو إعلانات
4️⃣ ممنوع إضافة أعضاء بدون إذن
5️⃣ اتبع تعليمات الإدارة

⚠️ مخالفة القوانين = طرد فوري
⌬ ━━━━━━━━━━━━━━━━ ⌬`.trim();

module.exports.run = async function({ event, api, Threads, Users }) {
  const { threadID, logMessageData } = event;
  const CFG      = loadConfig();
  const BOT_NAME = CFG.BOTNAME || "BOT";
  const botID    = String(api.getCurrentUserID());
  const ADMINBOT = (CFG.ADMINBOT || global.config?.ADMINBOT || []).map(String);
  const db       = getDB();

  const added = logMessageData.addedParticipants || [];
  if (added.some(i => String(i.userFbId) === botID)) return;
  if (!added.length) return;

  // جيب إعدادات الكروب
  let antiJoin = false;
  try {
    const cached = global.data?.threadData?.get(String(threadID));
    antiJoin = cached?.antiJoin === true;
    if (!antiJoin) {
      const td = await Threads.getData(threadID);
      antiJoin = td?.data?.antiJoin === true;
    }
  } catch(_) {}

  if (!antiJoin) return;

  // المطور أضاف — اسمح
  const adderID = String(added[0]?.addedBy || logMessageData.addedBy || "");
  if (ADMINBOT.includes(adderID)) return;

  // اطرد الأعضاء الجدد
  let kicked = 0, failed = 0;
  for (const member of added) {
    const uid = String(member.userFbId);
    if (uid === botID) continue;
    await new Promise(r => setTimeout(r, 800));
    await new Promise(resolve => {
      api.removeUserFromGroup(uid, threadID, err => {
        err ? failed++ : kicked++;
        resolve();
      });
    });
  }

  const adderName = await Users.getNameUser(adderID).catch(() => adderID);
  const H = `⌬ ━━ ${BOT_NAME} ━━ ⌬`;

  let msg = `${H}\n🚫 مضاد الإضافة\n👤 ${adderName}`;
  if (kicked) msg += `\n✅ طُرد: ${kicked}`;
  if (failed) msg += `\n❌ فشل: ${failed} — تأكد إن البوت أدمن`;
  msg += `\n\n${RULES}`;

  api.sendMessage(msg, threadID, (err, info) => {
    if (err || !info) return;
    setTimeout(() => api.unsendMessage(info.messageID), 5000);
  });

  // حفظ الحدث في السحابة
  if (db) {
    try {
      await db.logEvent('antijoin_kick', {
        threadID,
        adderID,
        adderName,
        kicked,
        failed,
        members: added.map(m => m.userFbId),
        at: new Date().toISOString(),
      });
    } catch(_) {}
  }
};
