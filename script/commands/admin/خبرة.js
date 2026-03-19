const fs   = require('fs');
const path = require('path');

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}
const ADMIN_IDS = (loadConfig().ADMINBOT || ['61580139921634']).map(String);

function getDB() {
  try { return require(path.join(process.cwd(), 'includes', 'data.js')); }
  catch { return null; }
}

module.exports.config = {
  name: 'خبرة',
  version: '3.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'إضافة XP لمستخدم — للمطور فقط',
  commandCategory: 'admin',
  usages: '.خبرة @شخص [المقدار]',
  cooldowns: 2,
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const db = getDB();
  if (!db) return api.sendMessage('❌ data.js مو موجود', threadID, messageID);

  // تحديد الهدف
  const mentionIDs = Object.keys(mentions || {});
  let targetID;
  if (mentionIDs.length)                             targetID = mentionIDs[0];
  else if (type === 'message_reply' && messageReply) targetID = messageReply.senderID;
  else if (args[0] && args[0].length > 10)           targetID = args[0];

  const xpToAdd = parseInt(args.find(a => !isNaN(a) && a.length < 10));

  if (!targetID) return api.sendMessage('⚠️ منشن شخصاً أو ضع ID', threadID, messageID);
  if (isNaN(xpToAdd)) return api.sendMessage('⚠️ اكتب المقدار\nمثال: .خبرة @أيمن 1000', threadID, messageID);

  const wait = await api.sendMessage('⏳...', threadID);
  try {
    const name   = await Users.getNameUser(targetID).catch(() => targetID);
    await db.ensureUser(targetID, name);
    const result = await db.addExp(targetID, xpToAdd);

    api.unsendMessage(wait.messageID);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تمت إضافة XP!\n👤 ${name}\n+${xpToAdd.toLocaleString()} XP\n📊 Level: ${result.level}\n🏅 ${result.rank?.emoji || ''} ${result.rank?.name || ''}${result.levelUp ? '\n🎉 ارتفع ليفل!' : ''}`,
      threadID, messageID
    );
  } catch(e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ ${e.message}`, threadID, messageID);
  }
};
