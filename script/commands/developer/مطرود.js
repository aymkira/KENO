const path = require("path");
const fs   = require("fs");

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}
const ADMIN_IDS = (loadConfig().ADMINBOT || ['61580139921634']).map(String);

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); }
  catch { return null; }
}

module.exports.config = {
  name:            "مطرود",
  aliases:         ["kicked"],
  version:         "1.0.0",
  hasPermssion:    2,
  credits:         "ayman",
  description:     "إدارة قائمة المطرودين الدائمين",
  commandCategory: "developer",
  usages:          ".مطرود @شخص [سبب] — طرد دائم\n.مطرود ترك @شخص — رفع الطرد\n.مطرود قائمة — عرض القائمة",
  cooldowns:       3,
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply, body } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage("🚫 للمطور فقط.", threadID, messageID);

  const db  = getDB();
  if (!db) return api.sendMessage("❌ data.js مو موجود", threadID, messageID);

  const sub        = (args[0] || "").trim().toLowerCase();
  const mentionIDs = Object.keys(mentions || {});

  // ── قائمة المطرودين ──────────────────────────────────
  if (sub === "قائمة" || sub === "list") {
    const list = await db.getAllKicked().catch(() => []);
    if (!list.length)
      return api.sendMessage(
        "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗞𝗜𝗖𝗞 ━━ ⌬\n\n✅ قائمة المطرودين فارغة",
        threadID, messageID
      );

    const lines = list.map((e, i) =>
      `${i + 1}. 🆔 ${e.userID}\n   📋 ${e.reason || "—"}`
    ).join("\n\n");

    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗞𝗜𝗖𝗞 ━━ ⌬\n\n🚫 المطرودون الدائمون (${list.length}):\n\n${lines}`,
      threadID, messageID
    );
  }

  // ── رفع الطرد ─────────────────────────────────────────
  if (sub === "ترك" || sub === "unkick") {
    let targetID;
    if (mentionIDs.length)                             targetID = mentionIDs[0];
    else if (type === "message_reply" && messageReply) targetID = messageReply.senderID;
    else { const m = body.match(/\b(\d{10,})\b/); if (m) targetID = m[1]; }

    if (!targetID) return api.sendMessage("📝 منشن شخص أو رد على رسالته", threadID, messageID);

    const done = await db.unkickUser(targetID).catch(() => false);
    const name = await Users.getNameUser(targetID).catch(() => targetID);
    return api.sendMessage(
      done
        ? `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗞𝗜𝗖𝗞 ━━ ⌬\n\n✅ تم رفع الطرد!\n👤 ${name}`
        : `⚠️ هذا الشخص مو في قائمة المطرودين`,
      threadID, messageID
    );
  }

  // ── طرد دائم ──────────────────────────────────────────
  let targetID;
  if (mentionIDs.length)                             targetID = mentionIDs[0];
  else if (type === "message_reply" && messageReply) targetID = messageReply.senderID;
  else { const m = body.match(/\b(\d{10,})\b/); if (m) targetID = m[1]; }

  if (!targetID) return api.sendMessage(
    "📝 .مطرود @شخص [سبب]\n.مطرود ترك @شخص\n.مطرود قائمة",
    threadID, messageID
  );

  if (ADMIN_IDS.includes(String(targetID)))
    return api.sendMessage("🛡️ ما تقدر تطرد المطور!", threadID, messageID);

  // السبب = كل شيء بعد المنشن/الأيدي
  const reason = body
    .replace(/^\.\S+\s*/, "")
    .replace(/(ترك|unkick)\s*/i, "")
    .replace(/@\S+/g, "")
    .replace(/\b\d{10,}\b/g, "")
    .trim() || "لا يوجد سبب";

  const name = await Users.getNameUser(targetID).catch(() => targetID);
  await db.kickUser(targetID, reason, senderID);

  // اطرده من الكروب الحالي فوراً
  api.removeUserFromGroup(targetID, threadID, () => {});
  api.setMessageReaction("🐢", messageID, () => {}, true);

  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗞𝗜𝗖𝗞 ━━ ⌬\n\n🚫 تم الطرد الدائم!\n👤 ${name}\n🆔 ${targetID}\n📋 ${reason}\n\n⚠️ سيُطرد تلقائياً من أي مجموعة`,
    threadID, messageID
  );
};
