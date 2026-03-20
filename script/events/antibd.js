const path = require("path");

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(require("fs").readFileSync(p, "utf8")); } catch(_){} }
  return {};
}

module.exports.config = {
  name:        "antibd",
  eventType:   ["log:user-nickname"],
  version:     "2.0.0",
  credits:     "ayman",
  description: "حماية كنية البوت والمطور — تفاعل 🚫 فقط",
};

module.exports.run = async function({ api, event, Threads }) {
  const { logMessageData, threadID, messageID, author } = event;
  const { participant_id } = logMessageData;

  const CFG      = loadConfig();
  const ADMINBOT = (CFG.ADMINBOT || []).map(String);
  const BOTNAME  = CFG.BOTNAME || "KIRA";
  const botID    = String(api.getCurrentUserID());
  const authorID = String(author);

  // المطور غيّر — مقبول
  if (ADMINBOT.includes(authorID)) return;

  const target = String(participant_id);

  // ── حماية كنية البوت ──────────────────────────────────────────
  if (target === botID) {
    let correctNick = BOTNAME;
    try {
      const td = await Threads.getData(threadID);
      if (td?.data?.botNickname) correctNick = td.data.botNickname;
    } catch(_) {}

    api.changeNickname(correctNick, threadID, botID);
    try { api.setMessageReaction("🚫", messageID, () => {}, true); } catch(_) {}
    return;
  }

  // ── حماية كنية المطورين ───────────────────────────────────────
  if (ADMINBOT.includes(target)) {
    let devNick = null;
    try {
      const td = await Threads.getData(threadID);
      devNick  = td?.data?.devNicknames?.[target] || null;
    } catch(_) {}

    if (devNick) api.changeNickname(devNick, threadID, target);
    try { api.setMessageReaction("🚫", messageID, () => {}, true); } catch(_) {}
    return;
  }
};
