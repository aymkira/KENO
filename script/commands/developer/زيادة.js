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
  name: 'زيادة',
  aliases: ['شحن'],
  version: '3.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'إضافة عملة أو XP — للمطور فقط',
  commandCategory: 'developer',
  usages: '.زيادة [مبلغ] | @شخص\n.زيادة xp [مقدار] | @شخص',
  cooldowns: 2,
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply, body } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const db = getDB();
  if (!db) return api.sendMessage('❌ data.js مو موجود', threadID, messageID);

  const isXP   = args[0]?.toLowerCase() === 'xp';
  const amount = parseInt(isXP ? args[1] : args[0]);

  if (isNaN(amount) || amount <= 0) return api.sendMessage(
    '📝 .زيادة [مبلغ] | @شخص\n.زيادة xp [مقدار] | @شخص',
    threadID, messageID
  );

  // تحديد الهدف
  const mentionIDs = Object.keys(mentions || {});
  let targetID;
  if (mentionIDs.length)                             targetID = mentionIDs[0];
  else if (type === 'message_reply' && messageReply) targetID = messageReply.senderID;
  else {
    const after = (body || '').includes('|') ? body.split('|')[1] : '';
    const m = (after || '').match(/\b(\d{10,})\b/);
    targetID = m ? m[1] : senderID;
  }

  const wait = await api.sendMessage('⏳...', threadID);
  try {
    const name = await Users.getNameUser(targetID).catch(() => targetID);
    await db.ensureUser(targetID, name);

    if (isXP) {
      const r = await db.addExp(targetID, amount);
      api.unsendMessage(wait.messageID);
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n⭐ تم إضافة XP!\n👤 ${name}\n+${amount} XP\n📊 Level ${r.level}${r.levelUp ? '\n🎉 ارتفع ليفل!' : ''}`,
        threadID, messageID
      );
    }

    const newBal = await db.addMoney(targetID, amount);
    api.unsendMessage(wait.messageID);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n💰 تم الشحن!\n👤 ${name}\n+${amount.toLocaleString()}\n💵 الرصيد: ${newBal.toLocaleString()}`,
      threadID, messageID
    );
  } catch(e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ ${e.message}`, threadID, messageID);
  }
};
