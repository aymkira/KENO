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

module.exports.config = {
  name:            "مح",
  version:         "2.0.0",
  hasPermssion:    1,
  credits:         "ayman",
  description:     "طرد عضو من المجموعة بتفاعل 🐢",
  commandCategory: "admin",
  usages:          ".مح @شخص / رد على مسج / ID",
  cooldowns:       5,
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply, body } = event;

  // تحديد الهدف
  const mentionIDs = Object.keys(mentions || {});
  let targetID;
  if (mentionIDs.length)                             targetID = mentionIDs[0];
  else if (type === "message_reply" && messageReply) targetID = messageReply.senderID;
  else {
    const m = body?.match(/\b(\d{10,})\b/);
    if (m) targetID = m[1];
  }

  if (!targetID) return api.sendMessage(
    "📝 .مح @شخص\nأو رد على مسج + .مح\nأو .مح [ID]",
    threadID, messageID
  );

  if (ADMIN_IDS.includes(String(targetID)))
    return api.sendMessage("🛡️ ما تقدر تطرد المطور!", threadID, messageID);

  if (String(targetID) === String(api.getCurrentUserID()))
    return api.sendMessage("😅 ما أقدر أطرد نفسي!", threadID, messageID);

  // تفاعل 🐢
  api.setMessageReaction("🐢", messageID, () => {}, true);

  api.removeUserFromGroup(targetID, threadID, async (err) => {
    if (err)
      return api.sendMessage("❌ فشل الطرد — تأكد إن البوت أدمن.", threadID, messageID);
    const name = await Users.getNameUser(targetID).catch(() => targetID);
    api.sendMessage(`🐢 تم طرد ${name}`, threadID, messageID);
  });
};
