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

// ── مؤقتات الحظر المؤقت ───────────────────────────
if (!global._banTimers) global._banTimers = new Map();

function scheduleUnban(userID, ms, api, threadID, name) {
  if (global._banTimers.has(userID)) clearTimeout(global._banTimers.get(userID));
  global._banTimers.set(userID, setTimeout(async () => {
    global.data?.userBanned?.delete(userID);
    global._banTimers.delete(userID);
    const db = getDB();
    if (db) await db.unbanUser(userID, 'auto').catch(() => {});
    try { api.sendMessage(`✅ انتهت مدة حظر ${name} تلقائياً`, threadID); } catch(_) {}
  }, ms));
}

// ── تحليل المدة ───────────────────────────────────
// يقبل: 30 | 2h | 1d | 1h30m | 2d12h
function parseDuration(str) {
  if (!str) return 0;
  let total = 0;
  const parts = str.match(/\d+\s*[a-zA-Zأ-ي]+/g) || [];
  for (const p of parts) {
    const n = parseInt(p), u = p.replace(/\d/g, '').trim().toLowerCase();
    if (u.startsWith('d') || u.startsWith('ي')) total += n * 1440;
    else if (u.startsWith('h') || u.startsWith('س')) total += n * 60;
    else if (u.startsWith('m') || u.startsWith('د')) total += n;
  }
  if (!total && /^\d+$/.test(str.trim())) total = parseInt(str.trim());
  return total;
}

function fmtDur(min) {
  if (!min) return 'أبدي ♾️';
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  return [d && `${d} يوم`, h && `${h} ساعة`, m && `${m} دقيقة`].filter(Boolean).join(' ');
}

function getTime() {
  return new Date().toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad', hour12: false });
}

// ══════════════════════════════════════════════════
module.exports.config = {
  name: 'بان',
  version: '5.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'حظر مستخدم — للمطور فقط',
  commandCategory: 'admin',
  usages: '.بان | @شخص [مدة]\nأمثلة: 30 | 2h | 1d | 1h30m',
  cooldowns: 3,
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply, body } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const db       = getDB();
  const getName  = async id => { try { return await Users.getNameUser(id); } catch { return id; } };
  const time     = getTime();

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
    '📝 .بان | @شخص [مدة]\nأو رد على مسج + .بان',
    threadID, messageID
  );

  if (ADMIN_IDS.includes(String(targetID)))
    return api.sendMessage('🛡️ ما يمكن حظر المطور!', threadID, messageID);

  if (targetID === api.getCurrentUserID())
    return api.sendMessage('😅 ما أقدر أحظر نفسي!', threadID, messageID);

  if (global.data?.userBanned?.has(targetID)) {
    const bi = global.data.userBanned.get(targetID);
    return api.sendMessage(
      `⚠️ محظور مسبقاً!\n📋 ${bi.reason || '—'}\n📅 ${bi.dateAdded || '—'}`,
      threadID, messageID
    );
  }

  // ── استخراج المدة والسبب ──────────────────────
  const after     = (body || '').includes('|') ? body.split('|')[1].trim() : '';
  const noMention = after.replace(/@\S+/g, '').replace(/\b\d{10,}\b/g, '').trim();
  const words     = noMention.split(/\s+/);
  const last      = words[words.length - 1] || '';
  const durMin    = parseDuration(last);
  const reason    = (durMin > 0 ? words.slice(0, -1) : words).join(' ').trim() || 'لا يوجد سبب';
  const expiresAt = durMin > 0 ? new Date(Date.now() + durMin * 60000).toISOString() : null;

  const [targetName, adminName] = await Promise.all([getName(targetID), getName(senderID)]);

  // ── حفظ في global.data ───────────────────────
  global.data?.userBanned?.set(targetID, { reason, dateAdded: time, expiresAt });

  // ── حفظ في SQLite ─────────────────────────────
  try {
    const ud = (await Users.getData(targetID))?.data || {};
    ud.banned = 1; ud.reason = reason; ud.dateAdded = time;
    await Users.setData(targetID, { data: ud });
  } catch(_) {}

  // ── حفظ في data.js (GitHub JSON) ──────────────
  if (db) {
    await db.banUser(targetID, reason, senderID, durMin).catch(() => {});
    await db.logEvent('ban', { userID: targetID, name: targetName, reason, by: senderID, durMin }).catch(() => {});
  }

  // ── مؤقت رفع تلقائي ──────────────────────────
  if (durMin > 0) scheduleUnban(targetID, durMin * 60000, api, threadID, targetName);

  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🔴 تم الحظر!\n👤 ${targetName}\n🆔 ${targetID}\n📋 ${reason}\n⏳ ${fmtDur(durMin)}${expiresAt ? `\n📅 ينتهي: ${new Date(expiresAt).toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad', hour12: false })}` : ''}\n👮 ${adminName}\n🕐 ${time}`,
    threadID, messageID
  );
};
