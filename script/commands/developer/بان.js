const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');
const moment   = require('moment-timezone');

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}
const CFG       = loadConfig();
const MONGO_URI = CFG.MONGODB_URI || '';
const ADMIN_IDS = (CFG.ADMINBOT || []).map(String);

// ── MongoDB ────────────────────────────────────────
let BanLog, mongoReady = false;
async function initMongo() {
  if (mongoReady || !MONGO_URI) return;
  try {
    if (mongoose.connection.readyState === 0) await mongoose.connect(MONGO_URI);
    const s = new mongoose.Schema({
      type: String, targetID: String, targetName: String,
      bannedBy: String, bannedByName: String,
      threadID: String, reason: String, action: String,
      durationMinutes: Number, expiresAt: Date,
      date: { type: Date, default: Date.now },
    });
    BanLog = mongoose.models.BanLog || mongoose.model('BanLog', s);
    mongoReady = true;
  } catch(_) {}
}
async function logDB(data) {
  try { await initMongo(); if (BanLog) await BanLog.create(data); } catch(_) {}
}

// ── مؤقتات الحظر المؤقت ───────────────────────────
const banTimers = new Map();
function scheduleUnban(targetID, ms, api, threadID, name) {
  if (banTimers.has(targetID)) clearTimeout(banTimers.get(targetID));
  const t = setTimeout(async () => {
    global.data.userBanned?.delete(targetID);
    banTimers.delete(targetID);
    try {
      // إزالة من SQLite
      const ud = {}; // سيُجلب من الـ controller
      // نستخدم global مباشرة
    } catch(_) {}
    try {
      api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ انتهت مدة حظر ${name} تلقائياً`,
        threadID
      );
    } catch(_) {}
  }, ms);
  banTimers.set(targetID, t);
}

// ── تحليل المدة: "2s" | "30d" | "1h30m" | "60" ───
function parseDuration(str) {
  if (!str) return 0;
  let total = 0;
  const match = str.match(/(\d+)\s*([smhdأيودساعةدقيقة]+)/gi);
  if (match) {
    for (const part of match) {
      const num  = parseInt(part);
      const unit = part.replace(/\d/g, '').toLowerCase().trim();
      if (['d','ي','يوم','يوما','أيام'].some(u => unit.includes(u)))        total += num * 1440;
      else if (['h','s','ساعة','ساعات'].some(u => unit.includes(u)))        total += num * 60;
      else if (['m','د','دقيقة','دقائق'].some(u => unit.includes(u)))       total += num;
    }
  } else if (/^\d+$/.test(str.trim())) {
    total = parseInt(str.trim()); // رقم فقط = دقائق
  }
  return total;
}

function formatDuration(min) {
  if (!min) return 'أبدي ♾️';
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  let out = '';
  if (d) out += `${d} يوم `;
  if (h) out += `${h} ساعة `;
  if (m) out += `${m} دقيقة`;
  return out.trim();
}

// ══════════════════════════════════════════════════
module.exports.config = {
  name: 'بان',
  aliases: ['نوبان', 'اولبان', 'ban', 'unban', 'allban'],
  version: '4.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'نظام الحظر الكامل — للمطور فقط',
  commandCategory: 'admin',
  usages: `.بان | @شخص [مدة]   مثال: .بان | @شخص 2h30m
.نوبان | @شخص        ← رفع الحظر
.اولبان              ← حظر/فتح المجموعة`,
  cooldowns: 3,
};

// ══════════════════════════════════════════════════
module.exports.run = async function({ api, event, Users, Threads }) {
  const { threadID, messageID, senderID, mentions, type, messageReply, body } = event;

  // للمطور فقط
  if (!ADMIN_IDS.includes(String(senderID))) return api.sendMessage(
    '⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🚫 للمطور فقط.',
    threadID, messageID
  );

  const time    = moment.tz('Asia/Baghdad').format('DD/MM/YYYY — HH:mm');
  const getName = async id => { try { return await Users.getNameUser(id); } catch(_) { return id; } };

  // ── تحليل الأمر ───────────────────────────────
  // الصيغة: .بان | @منشن 2h / .بان | 123456 1d / رد + .بان 30m
  const parts   = (body || '').split('|');
  const cmdName = parts[0].trim().replace(/^\./,'').toLowerCase();
  const rest    = (parts[1] || '').trim(); // ما بعد |

  // ── استخراج المدة: آخر كلمة تحتوي أرقام وحروف وحدة ──
  let durationStr = '';
  let restClean   = rest;

  // مثال: "@اسم 2h30m" أو "@اسم 60" أو "@اسم"
  const durationMatch = rest.match(/(\d+[smhdأيودساعةدقيقة]+|\d+[smhd]?\d*[smhd]?)$/i);
  if (durationMatch) {
    durationStr = durationMatch[0];
    restClean   = rest.slice(0, rest.lastIndexOf(durationStr)).trim();
  }

  const durationMin = parseDuration(durationStr);
  const reason      = restClean.replace(/@\S+/g, '').replace(/\d{10,}/g, '').trim() || 'لا يوجد سبب';

  // ── تحديد الهدف ──────────────────────────────
  const mentionIDs = Object.keys(mentions || {});
  let targetID;

  if (mentionIDs.length > 0) {
    targetID = mentionIDs[0];
  } else if (type === 'message_reply' && messageReply) {
    targetID = messageReply.senderID;
  } else {
    const idMatch = rest.match(/\b(\d{10,})\b/);
    if (idMatch) targetID = idMatch[1];
  }

  const adminName = await getName(senderID);

  // ══════════════════════════════════════════════
  //  .اولبان
  // ══════════════════════════════════════════════
  if (['اولبان','allban'].includes(cmdName)) {
    const banned = global.data.threadBanned?.has(threadID);
    if (banned) {
      global.data.threadBanned?.delete(threadID);
      try {
        const td = (await Threads.getData(threadID))?.data || {};
        td.banned = false; td.reason = ''; td.dateAdded = '';
        await Threads.setData(threadID, { data: td });
      } catch(_) {}
      await logDB({ type:'thread', targetID:threadID, bannedBy:senderID, bannedByName:adminName, threadID, action:'unban' });
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم فتح المجموعة!\n👮 ${adminName}\n🕐 ${time}`,
        threadID, messageID
      );
    }
    global.data.threadBanned?.set(threadID, { reason, dateAdded: time });
    try {
      const td = (await Threads.getData(threadID))?.data || {};
      td.banned = true; td.reason = reason; td.dateAdded = time;
      await Threads.setData(threadID, { data: td });
    } catch(_) {}
    await logDB({ type:'thread', targetID:threadID, bannedBy:senderID, bannedByName:adminName, threadID, reason, action:'allban' });
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🔴 تم حظر المجموعة!\n📋 ${reason}\n👮 ${adminName}\n🕐 ${time}\n\n.اولبان مجدداً للفتح`,
      threadID, messageID
    );
  }

  // ── تحقق من الهدف ─────────────────────────────
  if (!targetID) return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n📝 الاستخدام:\n• .بان | @شخص [مدة]\n• .نوبان | @شخص\n• رد على مسج + .بان\n\n⏱ أمثلة المدة:\n30 = 30 دقيقة\n2h = ساعتين\n1d = يوم\n1h30m = ساعة ونص`,
    threadID, messageID
  );

  if (ADMIN_IDS.includes(String(targetID))) return api.sendMessage(
    '⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🛡️ لا يمكن حظر المطور!',
    threadID, messageID
  );
  if (targetID === api.getCurrentUserID()) return api.sendMessage(
    '⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n😅 ما أقدر أحظر نفسي!',
    threadID, messageID
  );

  const targetName = await getName(targetID);

  // ══════════════════════════════════════════════
  //  .نوبان
  // ══════════════════════════════════════════════
  if (['نوبان','unban'].includes(cmdName)) {
    if (!global.data.userBanned?.has(targetID)) return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n⚠️ ${targetName} مو محظور أصلاً!`,
      threadID, messageID
    );

    // رفع من الذاكرة
    global.data.userBanned?.delete(targetID);

    // إلغاء المؤقت لو كان حظر مؤقت
    if (banTimers.has(targetID)) {
      clearTimeout(banTimers.get(targetID));
      banTimers.delete(targetID);
    }

    // رفع من SQLite
    try {
      const ud = (await Users.getData(targetID))?.data || {};
      ud.banned = 0; ud.reason = ''; ud.dateAdded = '';
      await Users.setData(targetID, { data: ud });
    } catch(_) {}

    await logDB({ type:'user', targetID, targetName, bannedBy:senderID, bannedByName:adminName, threadID, action:'unban' });

    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم رفع الحظر!\n\n👤 ${targetName}\n🆔 ${targetID}\n👮 ${adminName}\n🕐 ${time}`,
      threadID, messageID
    );
  }

  // ══════════════════════════════════════════════
  //  .بان
  // ══════════════════════════════════════════════
  if (global.data.userBanned?.has(targetID)) {
    const bi = global.data.userBanned.get(targetID);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n⚠️ ${targetName} محظور مسبقاً!\n📋 ${bi.reason||'—'}\n📅 ${bi.dateAdded||'—'}`,
      threadID, messageID
    );
  }

  const expiresAt = durationMin > 0 ? new Date(Date.now() + durationMin * 60000) : null;
  const durLabel  = formatDuration(durationMin);

  // حظر في الذاكرة
  global.data.userBanned?.set(targetID, { reason, dateAdded: time, durationMin, expiresAt });

  // حظر في SQLite
  try {
    const ud = (await Users.getData(targetID))?.data || {};
    ud.banned = 1; ud.reason = reason; ud.dateAdded = time;
    await Users.setData(targetID, { data: ud });
  } catch(_) {}

  // مؤقت رفع الحظر
  if (durationMin > 0) scheduleUnban(targetID, durationMin * 60000, api, threadID, targetName);

  await logDB({ type:'user', targetID, targetName, bannedBy:senderID, bannedByName:adminName, threadID, reason, action:'ban', durationMinutes:durationMin, expiresAt });

  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🔴 تم الحظر!\n\n👤 ${targetName}\n🆔 ${targetID}\n📋 السبب: ${reason}\n⏳ المدة: ${durLabel}${expiresAt ? `\n📅 ينتهي: ${moment(expiresAt).tz('Asia/Baghdad').format('DD/MM — HH:mm')}` : ''}\n👮 ${adminName}\n🕐 ${time}\n\n.نوبان | @${targetName} لرفع الحظر`,
    threadID, messageID
  );
};
