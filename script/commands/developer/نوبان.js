const fs   = require('fs');
const path = require('path');

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}
const CFG       = loadConfig();
const ADMIN_IDS = (CFG.ADMINBOT || ['61580139921634']).map(String);

function getDB() {
  try { return require(path.join(process.cwd(), 'includes', 'data.js')); }
  catch { return null; }
}

module.exports.config = {
  name: 'نوبان',
  version: '5.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'رفع الحظر — للمطور فقط',
  commandCategory: 'admin',
  usages: '.نوبان | @شخص\nأو رد على مسج + .نوبان',
  cooldowns: 3,
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply, body } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const db      = getDB();
  const getName = async id => { try { return await Users.getNameUser(id); } catch { return id; } };

  // ── تحديد الهدف ──────────────────────────────
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
    '📝 .نوبان | @شخص\nأو رد على مسج + .نوبان',
    threadID, messageID
  );

  const [targetName, adminName] = await Promise.all([getName(targetID), getName(senderID)]);

  if (!global.data?.userBanned?.has(targetID))
    return api.sendMessage(`⚠️ ${targetName} مو محظور أصلاً!`, threadID, messageID);

  // رفع من الذاكرة
  global.data.userBanned.delete(targetID);

  // إلغاء المؤقت
  if (global._banTimers?.has(targetID)) {
    clearTimeout(global._banTimers.get(targetID));
    global._banTimers.delete(targetID);
  }

  // رفع من SQLite
  try {
    const ud = (await Users.getData(targetID))?.data || {};
    ud.banned = 0; ud.reason = ''; ud.dateAdded = '';
    await Users.setData(targetID, { data: ud });
  } catch(_) {}

  // رفع من data.js
  if (db) {
    await db.unbanUser(targetID, senderID).catch(() => {});
    await db.logEvent('unban', { userID: targetID, name: targetName, by: senderID }).catch(() => {});
  }

  const time = new Date().toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad', hour12: false });
  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم رفع الحظر!\n👤 ${targetName}\n🆔 ${targetID}\n👮 ${adminName}\n🕐 ${time}`,
    threadID, messageID
  );
};
