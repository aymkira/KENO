const path = require("path");

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); }
  catch { return null; }
}

module.exports.config = {
  name:        "checkban",
  eventType:   ["log:subscribe"],
  version:     "3.0.0",
  credits:     "ayman",
  description: "طرد المطرودين الدائمين تلقائياً عند دخول أي مجموعة",
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, logMessageData } = event;
  const botID    = String(api.getCurrentUserID());
  const ADMINBOT = (global.config?.ADMINBOT || []).map(String);

  const newMembers = (logMessageData.addedParticipants || [])
    .map(p => String(p.userFbId))
    .filter(id => id !== botID && !ADMINBOT.includes(id));

  if (!newMembers.length) return;

  const db = getDB();
  if (!db) return;

  for (const uid of newMembers) {
    // تحقق من الذاكرة أولاً (سريع)
    let kicked = global._kickedUsers?.has(uid);
    let reason = global._kickedUsers?.get(uid)?.reason || "";

    // fallback لـ data.js
    if (!kicked) {
      const record = await db.getKick(uid).catch(() => null);
      if (record) { kicked = true; reason = record.reason || "مطرود دائماً"; }
    }

    if (!kicked) continue;

    await new Promise(r => setTimeout(r, 500));

    api.removeUserFromGroup(uid, threadID, async (err) => {
      const name = await Users.getNameUser(uid).catch(() => uid);
      if (err) {
        return api.sendMessage(
          `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n⚠️ مطرود دائم حاول يدخل!\n👤 ${name}\n📋 ${reason}\n\n❌ فشل الطرد — تأكد إن البوت أدمن`,
          threadID
        );
      }
      api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗩 ━━ ⌬\n\n🚫 مطرود دائم!\n👤 ${name}\n🆔 ${uid}\n📋 ${reason}`,
        threadID
      );
    });
  }
};
