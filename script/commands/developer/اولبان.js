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
  name: 'اولبان',
  version: '5.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'حظر/فتح المجموعة كاملة — للمطور فقط',
  commandCategory: 'admin',
  usages: '.اولبان [سبب] ← حظر\n.اولبان مجدداً ← فتح',
  cooldowns: 3,
};

module.exports.run = async function({ api, event, Users, Threads }) {
  const { threadID, messageID, senderID, body } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const db        = getDB();
  const getName   = async id => { try { return await Users.getNameUser(id); } catch { return id; } };
  const adminName = await getName(senderID);
  const after     = (body || '').includes('|') ? body.split('|')[1]?.trim() : '';
  const reason    = after || 'لا يوجد سبب';
  const time      = new Date().toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad', hour12: false });
  const isBanned  = global.data?.threadBanned?.has(threadID);

  if (isBanned) {
    // رفع الحظر
    global.data.threadBanned?.delete(threadID);

    try {
      const td = (await Threads.getData(threadID))?.data || {};
      td.banned = false; td.reason = ''; td.dateAdded = '';
      await Threads.setData(threadID, { data: td });
    } catch(_) {}

    if (db) await db.unbanThread(threadID).catch(() => {});

    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم فتح المجموعة!\n👮 ${adminName}\n🕐 ${time}`,
      threadID, messageID
    );
  }

  // حظر المجموعة
  global.data?.threadBanned?.set(threadID, { reason, dateAdded: time });

  try {
    const td = (await Threads.getData(threadID))?.data || {};
    td.banned = true; td.reason = reason; td.dateAdded = time;
    await Threads.setData(threadID, { data: td });
  } catch(_) {}

  if (db) await db.banThread(threadID, reason, senderID).catch(() => {});

  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🔴 تم حظر المجموعة!\n📋 ${reason}\n👮 ${adminName}\n🕐 ${time}\n\n⚠️ .اولبان مجدداً لرفع الحظر`,
    threadID, messageID
  );
};
