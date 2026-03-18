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
    const s = new mongoose.Schema({ type:String, targetID:String, bannedBy:String, bannedByName:String, threadID:String, reason:String, action:String, date:{type:Date,default:Date.now} });
    BanLog = mongoose.models.BanLog || mongoose.model('BanLog', s);
    mongoReady = true;
  } catch(_) {}
}
async function logDB(d) { try { await initMongo(); if(BanLog) await BanLog.create(d); } catch(_) {} }

module.exports.config = {
  name: 'اولبان',
  version: '4.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'حظر/فتح المجموعة كاملة — للمطور فقط',
  commandCategory: 'admin',
  usages: '.اولبان [سبب] ← يحظر المجموعة\n.اولبان مجدداً ← يرفع الحظر',
  cooldowns: 3,
};

module.exports.run = async function({ api, event, Users, Threads }) {
  const { threadID, messageID, senderID, body } = event;
  if (!ADMIN_IDS.includes(String(senderID))) return api.sendMessage('⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🚫 للمطور فقط.', threadID, messageID);

  const time      = moment.tz('Asia/Baghdad').format('DD/MM/YYYY — HH:mm');
  const getName   = async id => { try { return await Users.getNameUser(id); } catch(_) { return id; } };
  const adminName = await getName(senderID);
  const after     = body?.includes('|') ? body.split('|')[1]?.trim() : '';
  const reason    = after || 'لا يوجد سبب';
  const isBanned  = global.data.threadBanned?.has(threadID);

  if (isBanned) {
    // رفع حظر المجموعة
    global.data.threadBanned?.delete(threadID);
    try {
      const td = (await Threads.getData(threadID))?.data || {};
      td.banned=false; td.reason=''; td.dateAdded='';
      await Threads.setData(threadID, { data: td });
    } catch(_) {}
    await logDB({ type:'thread', targetID:threadID, bannedBy:senderID, bannedByName:adminName, threadID, action:'unban' });
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم فتح المجموعة!\n\n👮 ${adminName}\n🕐 ${time}`,
      threadID, messageID
    );
  }

  // حظر المجموعة
  global.data.threadBanned?.set(threadID, { reason, dateAdded: time });
  try {
    const td = (await Threads.getData(threadID))?.data || {};
    td.banned=true; td.reason=reason; td.dateAdded=time;
    await Threads.setData(threadID, { data: td });
  } catch(_) {}
  await logDB({ type:'thread', targetID:threadID, bannedBy:senderID, bannedByName:adminName, threadID, reason, action:'allban' });
  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n🔴 تم حظر المجموعة!\n\n📋 السبب: ${reason}\n👮 ${adminName}\n🕐 ${time}\n\n⚠️ كتابة .اولبان مجدداً لرفع الحظر`,
    threadID, messageID
  );
};
