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
  version:     "1.0.0",
  credits:     "ayman",
  description: "حماية كنية البوت والمطور من التغيير",
};

module.exports.run = async function({ api, event, Users, Threads }) {
  const { logMessageData, threadID, author } = event;
  const { participant_id, nickname } = logMessageData;
  const CFG      = loadConfig();
  const ADMINBOT = (CFG.ADMINBOT || []).map(String);
  const BOTNAME  = CFG.BOTNAME || "KIRA";
  const botID    = String(api.getCurrentUserID());

  // لو المطور غيّر — مقبول
  if (ADMINBOT.includes(String(author))) return;

  // ── حماية كنية البوت ──────────────────────────────────────────
  if (String(participant_id) === botID) {
    // استرجع الكنية الصحيحة للبوت
    let correctNick = BOTNAME;
    try {
      const td = await Threads.getData(threadID);
      if (td?.data?.botNickname) correctNick = td.data.botNickname;
    } catch(_) {}

    // أعد الكنية
    api.changeNickname(correctNick, threadID, botID);

    // أشعر المجموعة
    const changerName = await Users.getNameUser(author).catch(() => author);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n🛡️ محاولة تغيير كنية البوت!\n👤 ${changerName}\n🔄 تم الاسترجاع: ${correctNick}`,
      threadID
    );
  }

  // ── حماية كنية المطورين ───────────────────────────────────────
  if (ADMINBOT.includes(String(participant_id))) {
    // استرجع الكنية الصحيحة للمطور
    let devNick = null;
    try {
      const td = await Threads.getData(threadID);
      devNick  = td?.data?.devNicknames?.[String(participant_id)] || null;
    } catch(_) {}

    if (devNick) {
      api.changeNickname(devNick, threadID, participant_id);
    }

    const changerName = await Users.getNameUser(author).catch(() => author);
    const devName     = await Users.getNameUser(participant_id).catch(() => participant_id);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n🛡️ محاولة تغيير كنية المطور!\n👤 المحاول: ${changerName}\n👑 المطور: ${devName}${devNick ? `\n🔄 تم الاسترجاع: ${devNick}` : ""}`,
      threadID
    );
  }
};
