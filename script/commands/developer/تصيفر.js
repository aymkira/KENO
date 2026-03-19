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
  name: 'تصفير',
  version: '3.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'تصفير رصيد مستخدم — للمطور فقط',
  commandCategory: 'developer',
  usages: '.تصفير | @شخص\nأو رد على مسج + .تصفير',
  cooldowns: 3,
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply, body } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const db = getDB();
  if (!db) return api.sendMessage('❌ data.js مو موجود', threadID, messageID);

  // تحديد الهدف
  const mentionIDs = Object.keys(mentions || {});
  let targetID;
  if (mentionIDs.length)                             targetID = mentionIDs[0];
  else if (type === 'message_reply' && messageReply) targetID = messageReply.senderID;
  else {
    const after = (body || '').includes('|') ? body.split('|')[1] : '';
    const m = (after || '').match(/\b(\d{10,})\b/);
    if (m) targetID = m[1];
  }

  if (!targetID) return api.sendMessage(
    '📝 .تصفير | @شخص\nأو رد على مسج + .تصفير',
    threadID, messageID
  );

  const wait = await api.sendMessage('⏳...', threadID);
  try {
    const name    = await Users.getNameUser(targetID).catch(() => targetID);
    const wallet  = await db.getWallet(targetID);
    const oldMoney = wallet.money || 0;
    const oldBank  = wallet.bank  || 0;
    const oldExp   = wallet.exp   || 0;

    // تصفير المحفظة
    const walletFile = await db.loadFile(db.FILES?.WALLET || 'user/wallet.json').catch(() => ({}));
    walletFile[String(targetID)] = {
      userID: String(targetID),
      money: 0, bank: 0, exp: 0,
      level: 1, rank: 'مبتدئ', rankEmoji: '🔰',
      totalEarned: 0,
      updatedAt: new Date().toISOString(),
    };
    await db.writeCustomFile(db.FILES?.WALLET || 'user/wallet.json', walletFile, `reset: ${targetID}`);
    await db.logEvent('reset', { userID: targetID, name, by: senderID }).catch(() => {});

    api.unsendMessage(wait.messageID);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n🧹 تم التصفير!\n👤 ${name}\n💰 كان: ${oldMoney.toLocaleString()}\n🏦 بنك: ${oldBank.toLocaleString()}\n⭐ XP: ${oldExp}\n💵 الآن: 0`,
      threadID, messageID
    );
  } catch(e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ ${e.message}`, threadID, messageID);
  }
};
