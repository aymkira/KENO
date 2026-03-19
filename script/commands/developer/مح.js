const path = require("path");

function loadConfig() {
  const fs = require("fs");
  for (const p of [
    path.join(__dirname, "../../..", "config.json"),
    path.join(process.cwd(), "config.json"),
  ]) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch(_){} }
  return {};
}
const CFG       = loadConfig();
const ADMIN_IDS = (CFG.ADMINBOT || ["61580139921634"]).map(String);

module.exports.config = {
  name: "مح",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "ayman",
  description: "طرد — يقبل منشن / رد / ID / تفاعل 🐢",
  commandCategory: "admin",
  usages: ".مح @شخص | رد | ID\nأو تفاعل على مسج بـ 🐢",
  cooldowns: 0,
};

// ══════════════════════════════════════════
//  أمر عادي — منشن / رد / ID
// ══════════════════════════════════════════
module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID, mentions, messageReply, body } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage("🚫 للمطور فقط.", threadID, messageID);

  let targetID = null;

  // منشن
  const mentionIDs = Object.keys(mentions || {});
  if (mentionIDs.length) targetID = mentionIDs[0];

  // رد على مسج
  else if (messageReply?.senderID) targetID = messageReply.senderID;

  // ID مكتوب في النص
  else {
    const m = (body || "").match(/\b(\d{10,})\b/);
    if (m) targetID = m[1];
  }

  if (!targetID)
    return api.sendMessage("❌ منشن شخص أو رد على مسجه أو اكتب الـ ID", threadID, messageID);

  if (ADMIN_IDS.includes(String(targetID)))
    return api.sendMessage("🛡️ ما تقدر تطرد المطور!", threadID, messageID);

  if (String(targetID) === String(api.getCurrentUserID()))
    return api.sendMessage("😅 ما أقدر أطرد نفسي!", threadID, messageID);

  try {
    await api.removeUserFromGroup(targetID, threadID);
    api.setMessageReaction("✅", messageID, () => {}, true);
  } catch(e) {
    api.sendMessage(`❌ فشل الطرد: ${e.message}`, threadID, messageID);
  }
};

// ══════════════════════════════════════════
//  تفاعل 🐢 = طرد فوري
// ══════════════════════════════════════════
module.exports.handleReaction = async function({ api, event }) {
  const { threadID, messageID, senderID, reaction, userID } = event;

  // فقط المطور يقدر يستخدم هذا
  if (!ADMIN_IDS.includes(String(senderID))) return;

  // فقط تفاعل 🐢
  if (reaction !== "🐢") return;

  // الشخص اللي أرسل المسج الأصلي
  const targetID = String(userID);

  if (ADMIN_IDS.includes(targetID)) return;
  if (targetID === String(api.getCurrentUserID())) return;

  try {
    await api.removeUserFromGroup(targetID, threadID);
    api.setMessageReaction("✅", messageID, () => {}, true);
  } catch(e) {
    console.error("[مح]", e.message);
  }
};
