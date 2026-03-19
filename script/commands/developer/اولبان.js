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
  version: '6.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'حظر/فتح الكروب — أي أمر من داخله لا يشتغل',
  commandCategory: 'admin',
  usages: '.اولبان [سبب] ← حظر الكروب\n.اولبان مجدداً ← رفع الحظر',
  cooldowns: 3,
};

module.exports.run = async function({ api, event, Users, Threads }) {
  const { threadID, messageID, senderID, body } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const db        = getDB();
  const getName   = async id => { try { return await Users.getNameUser(id); } catch { return String(id); } };
  const adminName = await getName(senderID);
  const time      = new Date().toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad', hour12: false });
  const after     = (body || '').includes('|') ? body.split('|')[1]?.trim() : '';
  const isBanned  = global.data?.threadBanned?.has(threadID);

  // ══════════════════════════════════════════
  //  رفع الحظر عن الكروب
  // ══════════════════════════════════════════
  if (isBanned) {
    // رفع من الذاكرة
    global.data.threadBanned?.delete(threadID);

    // رفع من SQLite
    try {
      const td = (await Threads.getData(threadID))?.data || {};
      td.banned = false; td.reason = ''; td.dateAdded = '';
      await Threads.setData(threadID, { data: td });
    } catch(_) {}

    // حذف الكروب من threads.json في data.js
    if (db) {
      try {
        const threadsDB = await db.loadFile('group/threads.json');
        if (threadsDB[String(threadID)]) {
          delete threadsDB[String(threadID)];
          await db.writeCustomFile('group/threads.json', threadsDB, `unban thread ${threadID}`);
        }
      } catch(_) {}
    }

    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم فتح الكروب!\n🆔 ${threadID}\n👮 ${adminName}\n🕐 ${time}`,
      threadID, messageID
    );
  }

  // ══════════════════════════════════════════
  //  حظر الكروب
  // ══════════════════════════════════════════
  const reason = after || 'لا يوجد سبب';

  // جلب اسم الكروب
  let threadName = String(threadID);
  try {
    const info = await api.getThreadInfo(threadID);
    threadName = info.threadName || threadName;
  } catch(_) {}

  // حفظ في الذاكرة
  global.data?.threadBanned?.set(threadID, { reason, dateAdded: time });

  // حفظ في SQLite
  try {
    const td = (await Threads.getData(threadID))?.data || {};
    td.banned = true; td.reason = reason; td.dateAdded = time;
    await Threads.setData(threadID, { data: td });
  } catch(_) {}

  // حفظ في threads.json — يكتب اسم الكروب والـ ID والسبب
  if (db) {
    try {
      const threadsDB = await db.loadFile('group/threads.json');
      threadsDB[String(threadID)] = {
        threadID:  String(threadID),
        threadName,
        banned:    true,
        reason,
        bannedBy:  senderID,
        bannedAt:  time,
      };
      await db.writeCustomFile('group/threads.json', threadsDB, `ban thread ${threadID}`);
    } catch(_) {}
  }

  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🔴 تم حظر الكروب!\n📛 ${threadName}\n🆔 ${threadID}\n📋 ${reason}\n👮 ${adminName}\n🕐 ${time}\n\n⚠️ .اولبان مجدداً لرفع الحظر`,
    threadID, messageID
  );
};
