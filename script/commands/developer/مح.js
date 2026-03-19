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
  version: "2.0.0",
  hasPermssion: 2,
  credits: "ayman",
  description: "طرد — يقبل منشن / رد / ID / تفاعل 🐢",
  commandCategory: "admin",
  usages: ".مح @شخص | رد على مسج | ID\nأو تفاعل على مسج بـ 🐢",
  cooldowns: 0,
};

// ══════════════════════════════════════════
//  دالة الطرد المشتركة
// ══════════════════════════════════════════
async function kick(api, targetID, threadID, messageID) {
  if (ADMIN_IDS.includes(String(targetID))) return;
  if (String(targetID) === String(api.getCurrentUserID())) return;
  try {
    await api.removeUserFromGroup(targetID, threadID);
    api.setMessageReaction("✅", messageID, () => {}, true);
  } catch(e) {
    console.error("[مح]", e.message);
  }
}

// ══════════════════════════════════════════
//  أمر عادي — منشن / رد / ID
// ══════════════════════════════════════════
module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID, mentions, messageReply, body } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage("🚫 للمطور فقط.", threadID, messageID);

  let targetID = null;

  const mentionIDs = Object.keys(mentions || {});
  if (mentionIDs.length)              targetID = mentionIDs[0];
  else if (messageReply?.senderID)    targetID = messageReply.senderID;
  else {
    const m = (body || "").match(/\b(\d{10,})\b/);
    if (m) targetID = m[1];
  }

  if (!targetID)
    return api.sendMessage("❌ منشن شخص أو رد على مسجه أو اكتب الـ ID", threadID, messageID);

  await kick(api, targetID, threadID, messageID);
};

// ══════════════════════════════════════════
//  handleEvent — يستمع لكل تفاعل 🐢
// ══════════════════════════════════════════
module.exports.handleEvent = async function({ api, event }) {
  // نستمع فقط لأحداث التفاعل
  if (event.type !== "message_reaction") return;

  const { threadID, messageID, senderID, reaction, userID } = event;

  // فقط المطور
  if (!ADMIN_IDS.includes(String(senderID))) return;

  // فقط 🐢
  if (reaction !== "🐢") return;

  // userID = صاحب الرسالة اللي تفاعلنا عليها
  await kick(api, String(userID), threadID, messageID);
};
