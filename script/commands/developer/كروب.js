const fs   = require('fs-extra');
const path = require('path');

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}
const ADMIN_IDS = (loadConfig().ADMINBOT || ['61580139921634']).map(String);

module.exports.config = {
  name:            'كروب',
  aliases:         ['group'],
  version:         '1.0.0',
  hasPermssion:    2,
  credits:         'ayman',
  description:     'فتح وإغلاق المجموعة (مضاد الإضافة)',
  commandCategory: 'developer',
  usages:          '.كروب غلق — منع الإضافة\n.كروب فتح — السماح بالإضافة\n.كروب — عرض الحالة',
  cooldowns:       3,
};

module.exports.run = async function({ api, event, args, Threads }) {
  const { threadID, messageID, senderID } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const sub = (args[0] || '').trim().toLowerCase();

  // ── جيب بيانات الكروب الحالية ─────────────────────────────────
  let data = {};
  try {
    const td = await Threads.getData(threadID);
    data = td?.data || {};
  } catch(_) {}

  const current = data.antiJoin === true;

  // ── عرض الحالة فقط ───────────────────────────────────────────
  if (!sub || (sub !== 'غلق' && sub !== 'فتح' && sub !== 'close' && sub !== 'open')) {
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗥𝗢𝗨𝗣 ━━ ⌬\n\n🏠 حالة المجموعة\n\n🔒 مضاد الإضافة: ${current ? '🔴 مفعّل' : '🟢 معطّل'}\n\n📝 الأوامر:\n• .كروب غلق ← منع الإضافة\n• .كروب فتح ← السماح بالإضافة`,
      threadID, messageID
    );
  }

  const close = sub === 'غلق' || sub === 'close';

  // لو نفس الحالة الحالية
  if (close && current)
    return api.sendMessage('⚠️ المجموعة مغلقة أصلاً!', threadID, messageID);
  if (!close && !current)
    return api.sendMessage('⚠️ المجموعة مفتوحة أصلاً!', threadID, messageID);

  const wait = await api.sendMessage('⏳ جاري التحديث...', threadID);

  try {
    // ── تحديث data في SQLite ──────────────────────────────────
    data.antiJoin = close;
    await Threads.setData(threadID, { data });

    // ── تحديث global.data.threadData (الذاكرة) ───────────────
    if (global.data?.threadData) {
      const existing = global.data.threadData.get(String(threadID)) || {};
      existing.antiJoin = close;
      global.data.threadData.set(String(threadID), existing);
    }

    api.unsendMessage(wait.messageID);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗥𝗢𝗨𝗣 ━━ ⌬\n\n${close
        ? '🔴 تم إغلاق المجموعة!\n🚫 أي شخص يُضاف سيتم طرده تلقائياً'
        : '🟢 تم فتح المجموعة!\n✅ يمكن إضافة أعضاء الآن'
      }`,
      threadID, messageID
    );

  } catch(e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
  }
};