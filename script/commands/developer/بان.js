// ╔══════════════════════════════════════════════════════════════════╗
// ║              أمر .بان / .نوبان / .اولبان                        ║
// ║  للمطور فقط — يقبل منشن / رد / ID — مع مدة زمنية              ║
// ╚══════════════════════════════════════════════════════════════════╝

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
      threadID: String, reason: String,
      action: String,   // ban | unban | allban
      duration: Number, // بالدقائق، 0 = أبدي
      expiresAt: Date,
      date: { type: Date, default: Date.now },
    });
    BanLog = mongoose.models.BanLog || mongoose.model('BanLog', s);
    mongoReady = true;
  } catch(_) {}
}

async function logDB(data) {
  try { await initMongo(); if (BanLog) await BanLog.create(data); } catch(_) {}
}

// ── جدول المؤقتات للحظر المؤقت ───────────────────
const banTimers = new Map();

function scheduledUnban(targetID, ms, api, threadID) {
  if (banTimers.has(targetID)) clearTimeout(banTimers.get(targetID));
  const timer = setTimeout(async () => {
    global.data.userBanned?.delete(targetID);
    banTimers.delete(targetID);
    try {
      const { Users } = global.client || {};
      if (Users) {
        const ud = (await Users.getData(targetID))?.data || {};
        ud.banned = 0; ud.reason = ''; ud.dateAdded = '';
        await Users.setData(targetID, { data: ud });
      }
    } catch(_) {}
    try { api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ انتهت مدة حظر [${targetID}] تلقائياً`, threadID); } catch(_) {}
  }, ms);
  banTimers.set(targetID, timer);
}

// ══════════════════════════════════════════════════
module.exports.config = {
  name: 'بان',
  aliases: ['نوبان', 'اولبان', 'ban', 'unban', 'allban'],
  version: '3.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'نظام الحظر — للمطور فقط',
  commandCategory: 'admin',
  usages: `.بان | @شخص [مدة بالدقائق]   ← حظر مؤقت أو أبدي
.نوبان | @شخص                ← رفع الحظر
.اولبان | [سبب]              ← حظر/فتح المجموعة`,
  cooldowns: 3,
};

// ── تفاعل 🚫 على أوامر المحظورين ─────────────────
module.exports.handleEvent = async function({ api, event }) {
  if (!['message','message_reply'].includes(event.type)) return;
  const sid = String(event.senderID);
  if (global.data.userBanned?.has(sid)) {
    const prefix = global.config?.PREFIX || '.';
    if (event.body?.startsWith(prefix)) {
      try { await api.setMessageReaction('🚫', event.messageID, ()=>{}, true); } catch(_) {}
    }
  }
};

// ══════════════════════════════════════════════════
module.exports.run = async function({ api, event, Users, Threads }) {
  const { threadID, messageID, senderID, mentions, type, messageReply, body } = event;

  // المطور فقط
  if (!ADMIN_IDS.includes(String(senderID))) return api.sendMessage(
    '⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🚫 هذا الأمر للمطور فقط.',
    threadID, messageID
  );

  const time = moment.tz('Asia/Baghdad').format('DD/MM/YYYY — HH:mm');
  const getName = async id => { try { return await Users.getNameUser(id); } catch(_) { return id; } };

  // ── تحليل الأمر: .بان | @شخص 60 ──────────────
  // الصيغة: .أمر | @منشن/ID [مدة]
  const rawBody  = (body || '').trim();
  const parts    = rawBody.split('|');
  const cmdPart  = parts[0].trim(); // مثال: ".بان"
  const rest     = (parts[1] || '').trim(); // مثال: "@اسم 60" أو "سبب"

  // اسم الأمر
  const cmdName  = cmdPart.replace(/^\./,'').toLowerCase();

  // ── استخراج المدة من آخر الـ rest ────────────
  let duration = 0; // 0 = أبدي
  let restClean = rest;
  const lastWord = rest.split(' ').pop();
  if (/^\d+$/.test(lastWord)) {
    duration = parseInt(lastWord);
    restClean = rest.slice(0, rest.lastIndexOf(lastWord)).trim();
  }

  const reason = restClean.replace(/@\S+/g, '').trim() || 'لا يوجد سبب';

  // ── تحديد الهدف ───────────────────────────────
  const mentionIDs = Object.keys(mentions || {});
  let targetID;

  if (mentionIDs.length > 0) {
    targetID = mentionIDs[0];
  } else if (type === 'message_reply' && messageReply) {
    targetID = messageReply.senderID;
  } else {
    // بحث عن ID في الـ rest
    const idMatch = rest.match(/\b(\d{10,})\b/);
    if (idMatch) targetID = idMatch[1];
  }

  const adminName = await getName(senderID);

  // ══════════════════════════════════════════════
  //  .اولبان — حظر/فتح المجموعة
  // ══════════════════════════════════════════════
  if (['اولبان','allban'].includes(cmdName)) {
    const isBanned = global.data.threadBanned?.has(threadID);

    if (isBanned) {
      global.data.threadBanned?.delete(threadID);
      try {
        const td = (await Threads.getData(threadID))?.data || {};
        td.banned = false; td.reason = ''; td.dateAdded = '';
        await Threads.setData(threadID, { data: td });
      } catch(_) {}
      await logDB({ type:'thread', targetID:threadID, targetName:`مجموعة`, bannedBy:senderID, bannedByName:adminName, threadID, reason:'رفع حظر المجموعة', action:'unban', duration:0 });
      return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم رفع حظر المجموعة!\n👮 بواسطة: ${adminName}\n🕐 ${time}`, threadID, messageID);
    }

    global.data.threadBanned?.set(threadID, { reason, dateAdded: time });
    try {
      const td = (await Threads.getData(threadID))?.data || {};
      td.banned = true; td.reason = reason; td.dateAdded = time;
      await Threads.setData(threadID, { data: td });
    } catch(_) {}
    await logDB({ type:'thread', targetID:threadID, targetName:`مجموعة`, bannedBy:senderID, bannedByName:adminName, threadID, reason, action:'allban', duration:0 });
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🔴 تم حظر المجموعة!\n\n📋 السبب: ${reason}\n👮 بواسطة: ${adminName}\n🕐 ${time}\n\n⚠️ كتابة .اولبان مجدداً لرفع الحظر`,
      threadID, messageID
    );
  }

  // ── تحقق من وجود الهدف للبان ونوبان ──────────
  if (!targetID) return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n📝 الاستخدام:\n• .بان | @شخص [مدة]\n• .نوبان | @شخص\n• .اولبان | [سبب]\n\nأو رد على رسالة الشخص مباشرة`,
    threadID, messageID
  );

  // حماية
  if (ADMIN_IDS.includes(String(targetID))) return api.sendMessage('⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🛡️ لا يمكن حظر المطور!', threadID, messageID);
  if (targetID === api.getCurrentUserID()) return api.sendMessage('⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n😅 لا يمكنني حظر نفسي!', threadID, messageID);

  const targetName = await getName(targetID);

  // ══════════════════════════════════════════════
  //  .نوبان
  // ══════════════════════════════════════════════
  if (['نوبان','unban'].includes(cmdName)) {
    if (!global.data.userBanned?.has(targetID)) return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n⚠️ ${targetName} غير محظور!`,
      threadID, messageID
    );
    global.data.userBanned?.delete(targetID);
    if (banTimers.has(targetID)) { clearTimeout(banTimers.get(targetID)); banTimers.delete(targetID); }
    try {
      const ud = (await Users.getData(targetID))?.data || {};
      ud.banned = 0; ud.reason = ''; ud.dateAdded = '';
      await Users.setData(targetID, { data: ud });
    } catch(_) {}
    await logDB({ type:'user', targetID, targetName, bannedBy:senderID, bannedByName:adminName, threadID, reason:'رفع الحظر', action:'unban', duration:0 });
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
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n⚠️ ${targetName} محظور مسبقاً!\n📋 السبب: ${bi.reason||'—'}\n📅 ${bi.dateAdded||'—'}`,
      threadID, messageID
    );
  }

  const durationLabel = duration > 0
    ? duration >= 1440 ? `${Math.round(duration/1440)} يوم` : duration >= 60 ? `${Math.round(duration/60)} ساعة` : `${duration} دقيقة`
    : 'أبدي ♾️';

  const expiresAt = duration > 0 ? new Date(Date.now() + duration * 60000) : null;

  // حظر في الذاكرة
  global.data.userBanned?.set(targetID, { reason, dateAdded: time, duration, expiresAt });

  // حظر في SQLite
  try {
    const ud = (await Users.getData(targetID))?.data || {};
    ud.banned = 1; ud.reason = reason; ud.dateAdded = time;
    await Users.setData(targetID, { data: ud });
  } catch(_) {}

  // حظر مؤقت
  if (duration > 0) scheduledUnban(targetID, duration * 60000, api, threadID);

  // MongoDB
  await logDB({ type:'user', targetID, targetName, bannedBy:senderID, bannedByName:adminName, threadID, reason, action:'ban', duration, expiresAt });

  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🔴 تم الحظر!\n\n👤 ${targetName}\n🆔 ${targetID}\n📋 السبب: ${reason}\n⏳ المدة: ${durationLabel}\n${expiresAt ? `📅 ينتهي: ${moment(expiresAt).tz('Asia/Baghdad').format('DD/MM — HH:mm')}\n` : ''}👮 ${adminName}\n🕐 ${time}\n\n🚫 سيتفاعل البوت على أوامره\n.نوبان | @${targetName} لرفع الحظر`,
    threadID, messageID
  );
};
