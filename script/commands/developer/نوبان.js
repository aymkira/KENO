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
    const s = new mongoose.Schema({ type:String, targetID:String, targetName:String, bannedBy:String, bannedByName:String, threadID:String, reason:String, action:String, date:{type:Date,default:Date.now} });
    BanLog = mongoose.models.BanLog || mongoose.model('BanLog', s);
    mongoReady = true;
  } catch(_) {}
}
async function logDB(d) { try { await initMongo(); if(BanLog) await BanLog.create(d); } catch(_) {} }

module.exports.config = {
  name: 'نوبان',
  version: '4.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'رفع الحظر عن شخص — للمطور فقط',
  commandCategory: 'admin',
  usages: '.نوبان | @شخص\nأو رد على مسج + .نوبان',
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
    '⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n📝 الاستخدام:\n.نوبان | @شخص\nأو رد على رسالته + .نوبان',
    threadID, messageID
  );

  const targetName = await getName(targetID);
  const adminName  = await getName(senderID);

  if (!global.data.userBanned?.has(targetID)) return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n⚠️ ${targetName} مو محظور أصلاً!`,
    threadID, messageID
  );

  // رفع من الذاكرة
  global.data.userBanned?.delete(targetID);

  // إلغاء المؤقت
  const timers = global._banTimers;
  if (timers?.has(targetID)) {
    clearTimeout(timers.get(targetID));
    timers.delete(targetID);
  }

  // رفع من SQLite
  try {
    const ud = (await Users.getData(targetID))?.data || {};
    ud.banned=0; ud.reason=''; ud.dateAdded='';
    await Users.setData(targetID, { data: ud });
  } catch(_) {}

  await logDB({ type:'user', targetID, targetName, bannedBy:senderID, bannedByName:adminName, threadID, action:'unban' });

  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم رفع الحظر!\n\n👤 ${targetName}\n🆔 ${targetID}\n👮 ${adminName}\n🕐 ${time}`,
    threadID, messageID
  );
};
