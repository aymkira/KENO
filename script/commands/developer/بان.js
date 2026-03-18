const fs   = require('fs');
const path = require('path');
const moment = require('moment-timezone');

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}
const CFG       = loadConfig();
const ADMIN_IDS = (CFG.ADMINBOT || []).map(String);
const MONGO_URI = CFG.MONGODB_URI || '';

const mongoose = require('mongoose');
let BanLog, mongoReady = false;
async function initMongo() {
  if (mongoReady || !MONGO_URI) return;
  try {
    if (mongoose.connection.readyState === 0) await mongoose.connect(MONGO_URI);
    const s = new mongoose.Schema({ type:String, targetID:String, targetName:String, bannedBy:String, bannedByName:String, threadID:String, reason:String, action:String, durationMinutes:Number, expiresAt:Date, date:{type:Date,default:Date.now} });
    BanLog = mongoose.models.BanLog || mongoose.model('BanLog', s);
    mongoReady = true;
  } catch(_) {}
}
async function logDB(d) { try { await initMongo(); if(BanLog) await BanLog.create(d); } catch(_) {} }

const banTimers = global._banTimers = global._banTimers || new Map();
function scheduleUnban(tid, ms, api, threadID, name) {
  if (banTimers.has(tid)) clearTimeout(banTimers.get(tid));
  banTimers.set(tid, setTimeout(() => {
    global.data.userBanned?.delete(tid);
    banTimers.delete(tid);
    try { api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ انتهت مدة حظر ${name} تلقائياً`, threadID); } catch(_) {}
  }, ms));
}

function parseDuration(str) {
  if (!str) return 0;
  let t = 0;
  const pp = str.match(/\d+\s*[a-zأ-ي]+/gi) || [];
  for (const p of pp) {
    const n = parseInt(p), u = p.replace(/\d/g,'').trim().toLowerCase();
    if (/^(d|ي|يوم)/.test(u))      t += n*1440;
    else if (/^(h|س|ساع)/.test(u)) t += n*60;
    else if (/^(m|د|دق)/.test(u))  t += n;
  }
  if (!t && /^\d+$/.test(str.trim())) t = parseInt(str.trim());
  return t;
}
function fmtDur(m) {
  if (!m) return 'أبدي ♾️';
  const d=Math.floor(m/1440), h=Math.floor((m%1440)/60), mm=m%60;
  return [d&&`${d} يوم`, h&&`${h} ساعة`, mm&&`${mm} دقيقة`].filter(Boolean).join(' ');
}

module.exports.config = {
  name: 'بان',
  version: '4.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'حظر شخص — للمطور فقط',
  commandCategory: 'admin',
  usages: '.بان | @شخص [مدة]\nأمثلة المدة: 30 أو 2h أو 1d أو 1h30m',
  cooldowns: 3,
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply, body } = event;
  if (!ADMIN_IDS.includes(String(senderID))) return api.sendMessage('⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🚫 للمطور فقط.', threadID, messageID);

  const time    = moment.tz('Asia/Baghdad').format('DD/MM/YYYY — HH:mm');
  const getName = async id => { try { return await Users.getNameUser(id); } catch(_) { return id; } };

  // تحديد الهدف
  const mentionIDs = Object.keys(mentions || {});
  let targetID;
  if (mentionIDs.length > 0) targetID = mentionIDs[0];
  else if (type === 'message_reply' && messageReply?.senderID) targetID = messageReply.senderID;
  else {
    const after = body?.includes('|') ? body.split('|')[1] : '';
    const m = after?.match(/\b(\d{10,})\b/);
    if (m) targetID = m[1];
  }

  if (!targetID) return api.sendMessage(
    '⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n📝 الاستخدام:\n.بان | @شخص [مدة]\n\nأمثلة المدة:\n• 30 = 30 دقيقة\n• 2h = ساعتين\n• 1d = يوم\n• 1h30m = ساعة ونص\n• بدون مدة = حظر أبدي\n\nأو رد على مسج + .بان',
    threadID, messageID
  );

  if (ADMIN_IDS.includes(String(targetID))) return api.sendMessage('⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🛡️ لا يمكن حظر المطور!', threadID, messageID);
  if (targetID === api.getCurrentUserID()) return api.sendMessage('⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n😅 ما أقدر أحظر نفسي!', threadID, messageID);

  const targetName = await getName(targetID);
  const adminName  = await getName(senderID);

  if (global.data.userBanned?.has(targetID)) {
    const bi = global.data.userBanned.get(targetID);
    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n⚠️ ${targetName} محظور مسبقاً!\n📋 ${bi.reason||'—'}\n📅 ${bi.dateAdded||'—'}`, threadID, messageID);
  }

  // استخراج المدة من بعد | 
  const after  = body?.includes('|') ? body.split('|')[1].trim() : '';
  const noMention = after.replace(/@\S+/g,'').replace(/\b\d{10,}\b/g,'').trim();
  // آخر كلمة كمدة
  const words  = noMention.split(/\s+/);
  const last   = words[words.length - 1] || '';
  const durMin = parseDuration(last);
  const reason = (durMin > 0 ? words.slice(0,-1) : words).join(' ').trim() || 'لا يوجد سبب';

  const expiresAt = durMin > 0 ? new Date(Date.now() + durMin*60000) : null;

  global.data.userBanned?.set(targetID, { reason, dateAdded: time, durMin, expiresAt });
  try {
    const ud = (await Users.getData(targetID))?.data || {};
    ud.banned=1; ud.reason=reason; ud.dateAdded=time;
    await Users.setData(targetID, { data: ud });
  } catch(_) {}

  if (durMin > 0) scheduleUnban(targetID, durMin*60000, api, threadID, targetName);
  await logDB({ type:'user', targetID, targetName, bannedBy:senderID, bannedByName:adminName, threadID, reason, action:'ban', durationMinutes:durMin, expiresAt });

  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🔴 تم الحظر!\n\n👤 ${targetName}\n🆔 ${targetID}\n📋 السبب: ${reason}\n⏳ المدة: ${fmtDur(durMin)}${expiresAt?`\n📅 ينتهي: ${moment(expiresAt).tz('Asia/Baghdad').format('DD/MM — HH:mm')}`:''}\n👮 ${adminName}\n🕐 ${time}`,
    threadID, messageID
  );
};
