// ══════════════════════════════════════════════════════════════
//   KIRA AI — ULTRA PRO MAX v3.0
//   2000+ دالة — يفهم العربي — ينفذ أي أمر
//   by Ayman
// ══════════════════════════════════════════════════════════════
const axios = require("axios");
const path  = require("path");
const db    = require(path.join(process.cwd(), "includes", "data.js"));

// wrappers تحاكي واجهة mongodb القديمة
async function ensureUser(uid)           { return db.ensureWallet(uid); }
async function getWalletData(uid)        { return db.getWallet(uid); }
async function addMoney(uid, amt)        { return db.addMoney(uid, amt); }
async function removeMoney(uid, amt)     { return db.removeMoney(uid, amt); }
async function addExp(uid, amt)          { return db.addExp(uid, amt); }
async function getAllUsers()             {
  const data = await db.loadFile(db.FILES.WALLET);
  return Object.values(data);
}
async function getUserData(uid) {
  const w = await db.getWallet(uid);
  return { currency: w };
}
async function updateUserData(uid, data) {
  const dbFile = await db.loadFile(db.FILES.WALLET);
  const id = String(uid);
  if (!dbFile[id]) await db.ensureWallet(uid);
  Object.assign(dbFile[id], data, { updatedAt: new Date().toISOString() });
  db._cache[db.FILES.WALLET] = { data: dbFile, sha: db._cache[db.FILES.WALLET]?.sha || null };
  return db.saveFile(db.FILES.WALLET, "updateUserData " + id);
}

module.exports.config = {
  name: "كينو",
  version: "3.0.0",
  hasPermssion: 2,
  credits: "Ayman",
  description: "المساعد الذكي الكامل ULTRA PRO MAX — 2000+ دالة",
  commandCategory: "developer",
  usages: "كينو [أي طلب بالعربي]",
  cooldowns: 2
};

const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";
const GROQ_MODEL   = "llama-3.3-70b-versatile";

// ══════════════════════════════════════════
//   نظام الأوامر الديناميكية — GitHub JSON
// ══════════════════════════════════════════
const CMDS_FILE = "group/dynamic_cmds.json";
async function _getCmds() { return db.loadFile(CMDS_FILE); }
async function _saveCmds() { return db.saveFile(CMDS_FILE, "update dynamic cmds"); }

// ══════════════════════════════════════════════════════════════════════════════════
//   KNOWLEDGE BASE ULTRA — 2000+ دالة وأمر
// ══════════════════════════════════════════════════════════════════════════════════
const KNOWLEDGE_BASE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 قاعدة المعرفة الكاملة ULTRA PRO MAX — 2000+ دالة وأمر
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

══════════════════════════════════════════
 ١. إدارة المجموعة — GROUP MANAGEMENT
══════════════════════════════════════════

// [أمر: اطرد المنشن / طرد / kick]
const targetKick = Object.keys(mentions)[0] || messageReply?.senderID;
if (!targetKick) { api.sendMessage("❌ منشن شخص أو رد على رسالته", threadID, messageID); }
else {
  await api.removeUserFromGroup(targetKick, threadID);
  api.sendMessage(`✅ تم طرد المستخدم بنجاح`, threadID, messageID);
}

// [أمر: أضف / add / إضافة]
const targetAdd = Object.keys(mentions)[0];
if (!targetAdd) { api.sendMessage("❌ منشن شخص لإضافته", threadID, messageID); }
else {
  await api.addUserToGroup(targetAdd, threadID);
  api.sendMessage(`✅ تمت إضافة المستخدم`, threadID, messageID);
}

// [أمر: رقِّ / ترقية / admin]
const targetAdmin = Object.keys(mentions)[0] || messageReply?.senderID;
if (!targetAdmin) { api.sendMessage("❌ منشن شخص لترقيته", threadID, messageID); }
else {
  await api.changeAdminStatus(threadID, targetAdmin, true);
  api.sendMessage(`👑 تمت الترقية لأدمن`, threadID, messageID);
}

// [أمر: نزّل / نزله / إزالة من الأدمن]
const targetDeAdmin = Object.keys(mentions)[0] || messageReply?.senderID;
if (!targetDeAdmin) { api.sendMessage("❌ منشن شخص", threadID, messageID); }
else {
  await api.changeAdminStatus(threadID, targetDeAdmin, false);
  api.sendMessage(`✅ تمت إزالته من الأدمن`, threadID, messageID);
}

// [أمر: قفل الكروب / قفل المجموعة / lock]
await api.muteThread(threadID, -1);
api.sendMessage("🔒 تم قفل المجموعة — فقط الأدمنز يستطيعون الكتابة", threadID, messageID);

// [أمر: افتح الكروب / فتح المجموعة / unlock]
await api.muteThread(threadID, 0);
api.sendMessage("🔓 تم فتح المجموعة", threadID, messageID);

// [أمر: غير اسم الكروب / غير اسم المجموعة]
const newName = args.slice(1).join(" ");
if (!newName) { api.sendMessage("❌ اكتب الاسم الجديد", threadID, messageID); }
else {
  await api.changeThreadName(newName, threadID);
  api.sendMessage(`✅ تم تغيير اسم المجموعة إلى: ${newName}`, threadID, messageID);
}

// [أمر: غير إيموجي / emoji]
const newEmoji = args[1] || "🔥";
await api.changeThreadEmoji(newEmoji, threadID);
api.sendMessage(`✅ تم تغيير الإيموجي إلى ${newEmoji}`, threadID, messageID);

// [أمر: غير لون المحادثة / color]
const colors = { "أحمر":"#FF0000","أزرق":"#0000FF","أخضر":"#00FF00","أصفر":"#FFFF00","بنفسجي":"#800080","وردي":"#FFC0CB","برتقالي":"#FFA500","أسود":"#000000","أبيض":"#FFFFFF","رمادي":"#808080" };
const colorInput = args.slice(1).join(" ");
const colorHex = colors[colorInput] || colorInput || "#FF0000";
await api.changeThreadColor(colorHex, threadID);
api.sendMessage(`🎨 تم تغيير اللون إلى ${colorInput}`, threadID, messageID);

// [أمر: غير لقب / لقب / nickname]
const targetNick = Object.keys(mentions)[0] || messageReply?.senderID || senderID;
const nickname = args.filter(a => !a.includes("@")).join(" ") || "مستخدم";
await api.changeNickname(nickname, threadID, targetNick);
api.sendMessage(`✅ تم تغيير اللقب إلى: ${nickname}`, threadID, messageID);

// [أمر: عدد الأعضاء / كم عضو]
const infoCount = await api.getThreadInfo(threadID);
api.sendMessage(`👥 عدد أعضاء المجموعة: ${infoCount.participantIDs.length} عضو\n👑 عدد الأدمنز: ${infoCount.adminIDs.length}`, threadID, messageID);

// [أمر: اسم المجموعة / اسم الكروب]
const infoName = await api.getThreadInfo(threadID);
api.sendMessage(`📛 اسم المجموعة: ${infoName.threadName || "بدون اسم"}\n🆔 ID: ${threadID}`, threadID, messageID);

// [أمر: قائمة الأعضاء / كل الأعضاء]
const infoMembers = await api.getThreadInfo(threadID);
const adminList = infoMembers.adminIDs.map(a => a.id);
let memberMsg = `👥 أعضاء المجموعة (${infoMembers.participantIDs.length}):\n\n`;
for (const uid of infoMembers.participantIDs) {
  memberMsg += adminList.includes(uid) ? `👑 ${uid}\n` : `👤 ${uid}\n`;
}
api.sendMessage(memberMsg, threadID, messageID);

// [أمر: طرد الكل / kickall — يطرد الكل عدا الأدمنز]
const infoKickAll = await api.getThreadInfo(threadID);
const adminsKickAll = infoKickAll.adminIDs.map(a => a.id);
let kicked = 0;
for (const uid of infoKickAll.participantIDs) {
  if (!adminsKickAll.includes(uid) && uid !== api.getCurrentUserID()) {
    await api.removeUserFromGroup(uid, threadID);
    kicked++;
  }
}
api.sendMessage(`✅ تم طرد ${kicked} عضو`, threadID, messageID);

// [أمر: رقّ الكل / ترقية الكل / adminall]
const infoAdminAll = await api.getThreadInfo(threadID);
for (const uid of infoAdminAll.participantIDs)
  await api.changeAdminStatus(threadID, uid, true);
api.sendMessage(`👑 تم ترقية جميع الأعضاء (${infoAdminAll.participantIDs.length}) لأدمن`, threadID, messageID);

// [أمر: نزّل الكل / إزالة كل الأدمنز]
const infoDeAll = await api.getThreadInfo(threadID);
for (const ad of infoDeAll.adminIDs)
  await api.changeAdminStatus(threadID, ad.id, false);
api.sendMessage(`✅ تمت إزالة ${infoDeAll.adminIDs.length} أدمن`, threadID, messageID);

// [أمر: معلومات الكروب / info / معلومات المجموعة]
const infoFull = await api.getThreadInfo(threadID);
const infoText = `⌬ ━━ معلومات المجموعة ━━ ⌬\n\n📛 الاسم: ${infoFull.threadName || "بدون اسم"}\n🆔 ID: ${threadID}\n👥 الأعضاء: ${infoFull.participantIDs.length}\n👑 الأدمنز: ${infoFull.adminIDs.length}\n💬 الإيموجي: ${infoFull.emoji || "لا يوجد"}\n🎨 اللون: ${infoFull.color || "افتراضي"}`;
api.sendMessage(infoText, threadID, messageID);

// [أمر: غير صورة الكروب / صورة المجموعة]
const imgUrl = messageReply?.attachments?.[0]?.url || args[1];
if (!imgUrl) { api.sendMessage("❌ أرسل صورة أو أعطِ رابط", threadID, messageID); }
else {
  const imgRes = await axios.get(imgUrl, { responseType: "stream" });
  await api.changeGroupImage(imgRes.data, threadID);
  api.sendMessage("✅ تم تغيير صورة المجموعة", threadID, messageID);
}

// [أمر: كتم المنشن / mute user]
const targetMute = Object.keys(mentions)[0] || messageReply?.senderID;
if (!targetMute) { api.sendMessage("❌ منشن شخصاً", threadID, messageID); }
else {
  await api.removeUserFromGroup(targetMute, threadID);
  setTimeout(async () => { await api.addUserToGroup(targetMute, threadID); }, 30000);
  api.sendMessage(`🔇 تم كتم المستخدم لمدة 30 ثانية`, threadID, messageID);
}

// [أمر: وداع / ترحيل / bye — طرد وتوديع]
const targetBye = Object.keys(mentions)[0] || messageReply?.senderID;
if (!targetBye) { api.sendMessage("❌ منشن شخص", threadID, messageID); }
else {
  api.sendMessage(`👋 وداعاً ${targetBye}! أتمنى لك حياة طيبة خارج هذه المجموعة 😄`, threadID, messageID);
  setTimeout(async () => { await api.removeUserFromGroup(targetBye, threadID); }, 2000);
}

// [أمر: أضف الكل من محادثة أخرى — نقل أعضاء]
const sourceThread = args[1];
if (!sourceThread) { api.sendMessage("❌ أعطِ ID المحادثة المصدر", threadID, messageID); }
else {
  const srcInfo = await api.getThreadInfo(sourceThread);
  let addedCount = 0;
  for (const uid of srcInfo.participantIDs) {
    try { await api.addUserToGroup(uid, threadID); addedCount++; } catch(e) {}
  }
  api.sendMessage(`✅ تم نقل ${addedCount} عضو`, threadID, messageID);
}

// [أمر: تغيير لقب الكل / لقب الجميع]
const groupNick = args.slice(1).join(" ") || "عضو";
const infoAllNick = await api.getThreadInfo(threadID);
for (const uid of infoAllNick.participantIDs) {
  try { await api.changeNickname(groupNick, threadID, uid); } catch(e) {}
}
api.sendMessage(`✅ تم تغيير لقب ${infoAllNick.participantIDs.length} عضو إلى: ${groupNick}`, threadID, messageID);

// [أمر: اخرج من الكروب / leave]
api.sendMessage("👋 وداعاً! أتركم الآن...", threadID, messageID);
setTimeout(async () => { await api.removeUserFromGroup(api.getCurrentUserID(), threadID); }, 2000);

// [أمر: إعادة تعيين الكروب / reset group]
const resetColors = ["#FF0000","#00FF00","#0000FF","#FF69B4","#FFA500"];
const randomColor = resetColors[Math.floor(Math.random() * resetColors.length)];
await api.changeThreadName("مجموعة جديدة", threadID);
await api.changeThreadEmoji("✨", threadID);
await api.changeThreadColor(randomColor, threadID);
api.sendMessage("✅ تم إعادة تعيين المجموعة بنجاح", threadID, messageID);

// [أمر: تحقق من الأدمنز / من الأدمن]
const infoCheckAdmin = await api.getThreadInfo(threadID);
const adminListCheck = infoCheckAdmin.adminIDs.map(a => a.id);
const isAdmin = adminListCheck.includes(senderID);
api.sendMessage(isAdmin ? "👑 نعم، أنت أدمن في هذه المجموعة" : "❌ لست أدمناً في هذه المجموعة", threadID, messageID);

// [أمر: تقرير الكروب / تقرير / report]
const infoReport = await api.getThreadInfo(threadID);
const adminCount = infoReport.adminIDs.length;
const memberCount = infoReport.participantIDs.length;
const reportMsg = `📊 تقرير المجموعة:\n\n👥 الأعضاء: ${memberCount}\n👑 الأدمنز: ${adminCount}\n👤 الأعضاء العاديون: ${memberCount - adminCount}\n📛 الاسم: ${infoReport.threadName || "بدون اسم"}\n🆔 ID: ${threadID}`;
api.sendMessage(reportMsg, threadID, messageID);

// [أمر: تصفية الكروب / طرد غير الأدمنز]
const infoFilter = await api.getThreadInfo(threadID);
const adminsFilter = infoFilter.adminIDs.map(a => a.id);
const nonAdmins = infoFilter.participantIDs.filter(uid => !adminsFilter.includes(uid) && uid !== api.getCurrentUserID());
api.sendMessage(`⚠️ سيتم طرد ${nonAdmins.length} عضو غير أدمن. هل أنت متأكد؟ اكتب: كينو تأكيد الطرد`, threadID, messageID);

══════════════════════════════════════════
 ٢. إدارة الرسائل — MESSAGE MANAGEMENT
══════════════════════════════════════════

// [أمر: أرسل رسالة / send / بث]
const msgToSend = args.slice(1).join(" ");
if (!msgToSend) { api.sendMessage("❌ اكتب الرسالة بعد الأمر", threadID, messageID); }
else { api.sendMessage(msgToSend, threadID, messageID); }

// [أمر: احذف الرسالة / حذف / unsend]
const targetMsg = messageReply?.messageID;
if (!targetMsg) { api.sendMessage("❌ رد على الرسالة التي تريد حذفها", threadID, messageID); }
else {
  await api.unsendMessage(targetMsg);
  api.sendMessage("✅ تم حذف الرسالة", threadID, messageID);
}

// [أمر: تفاعل / reaction / ردة فعل]
const reactionEmoji = args[1] || "❤️";
const targetReaction = messageReply?.messageID || messageID;
api.setMessageReaction(reactionEmoji, targetReaction, () => {}, true);

// [أمر: حب الرسالة / قلب / heart]
api.setMessageReaction("❤️", messageReply?.messageID || messageID, () => {}, true);

// [أمر: ضحك على الرسالة / haha]
api.setMessageReaction("😆", messageReply?.messageID || messageID, () => {}, true);

// [أمر: واو / wow]
api.setMessageReaction("😮", messageReply?.messageID || messageID, () => {}, true);

// [أمر: حزين / sad]
api.setMessageReaction("😢", messageReply?.messageID || messageID, () => {}, true);

// [أمر: غضب / angry]
api.setMessageReaction("😡", messageReply?.messageID || messageID, () => {}, true);

// [أمر: إزالة التفاعل / remove reaction]
api.setMessageReaction("", messageReply?.messageID || messageID, () => {}, true);
api.sendMessage("✅ تم إزالة التفاعل", threadID, messageID);

// [أمر: بث / broadcast / أرسل للكل]
const broadcastMsg = args.slice(1).join(" ");
if (!broadcastMsg) { api.sendMessage("❌ اكتب الرسالة للبث", threadID, messageID); }
else {
  const infoBcast = await api.getThreadInfo(threadID);
  let sentCount = 0;
  for (const uid of infoBcast.participantIDs) {
    try { api.sendMessage(`📢 ${broadcastMsg}`, uid); sentCount++; } catch(e) {}
  }
  api.sendMessage(`✅ تم إرسال الرسالة لـ ${sentCount} شخص`, threadID, messageID);
}

// [أمر: رسالة مؤجلة / delayed / بعد X ثانية]
const delaySeconds = parseInt(args[1]) || 10;
const delayedMsg = args.slice(2).join(" ") || "رسالة مؤجلة";
api.sendMessage(`⏳ سيتم إرسال الرسالة بعد ${delaySeconds} ثانية...`, threadID, messageID);
setTimeout(() => api.sendMessage(`⏰ ${delayedMsg}`, threadID, messageID), delaySeconds * 1000);

// [أمر: أرسل صورة / send image / صورة من رابط]
const imageUrl = args[1] || messageReply?.attachments?.[0]?.url;
if (!imageUrl) { api.sendMessage("❌ أعطِ رابط الصورة", threadID, messageID); }
else {
  const imgStream = await axios.get(imageUrl, { responseType: "stream" });
  api.sendMessage({ attachment: imgStream.data }, threadID, () => {}, messageID);
}

// [أمر: تحويل رسالة / forward]
const forwardMsgID = messageReply?.messageID;
if (!forwardMsgID) { api.sendMessage("❌ رد على الرسالة التي تريد تحويلها", threadID, messageID); }
else {
  await api.forwardMessage(forwardMsgID, threadID);
  api.sendMessage("✅ تم تحويل الرسالة", threadID, messageID);
}

// [أمر: رد تلقائي متكرر / auto reply / كل X دقيقة]
const intervalMin = parseInt(args[1]) || 5;
const intervalMsg = args.slice(2).join(" ") || "🔔 تذكير تلقائي";
const intervalId = setInterval(() => api.sendMessage(intervalMsg, threadID), intervalMin * 60000);
api.sendMessage(`✅ سيتم إرسال "${intervalMsg}" كل ${intervalMin} دقيقة`, threadID, messageID);

// [أمر: أرسل GIF / gif]
const gifUrls = [
  "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
  "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif",
  "https://media.giphy.com/media/l4FGrYKtP0pBGpBAY/giphy.gif"
];
const gifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];
const gifStream = await axios.get(gifUrl, { responseType: "stream" });
api.sendMessage({ attachment: gifStream.data }, threadID, () => {}, messageID);

// [أمر: مسح محادثة / clear]
api.sendMessage("🗑️ لا يمكن مسح المحادثة بشكل كامل، لكن يمكن حذف رسائل محددة بالرد عليها", threadID, messageID);

// [أمر: تثبيت رسالة / pin — إشعار]
const pinMsg = messageReply?.body || args.slice(1).join(" ");
if (!pinMsg) { api.sendMessage("❌ رد على رسالة أو اكتب النص", threadID, messageID); }
else {
  await api.changeThreadName(`📌 ${pinMsg.substring(0,50)}`, threadID);
  api.sendMessage(`📌 تم تثبيت: "${pinMsg.substring(0,100)}"`, threadID, messageID);
}

// [أمر: عدد رسائل / إحصائيات الرسائل]
const msgData = await getUserData(senderID);
const myMsgCount = msgData?.currency?.messageCount ?? 0;
api.sendMessage(`📨 إجمالي رسائلك: ${myMsgCount} رسالة`, threadID, messageID);

══════════════════════════════════════════
 ٣. الاقتصاد المتقدم — ADVANCED ECONOMY
══════════════════════════════════════════

// [أمر: رصيدي / فلوسي / balance]
await ensureUser(senderID);
const balData = await getUserData(senderID);
const balMoney = balData?.currency?.money ?? 0;
const balExp   = balData?.currency?.exp ?? 0;
const balLvl   = balData?.currency?.level ?? 1;
const balRank  = balData?.currency?.rank ?? "مبتدئ";
const balMsg = `💰 ━━ محفظتك ━━ 💰\n\n💵 الرصيد: ${balMoney.toLocaleString()} $\n⭐ XP: ${balExp}\n📊 المستوى: ${balLvl}\n🏅 الرتبة: ${balRank}`;
api.sendMessage(balMsg, threadID, messageID);

// [أمر: أعطِ فلوس / give money / منح]
const giveTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const giveAmount = parseInt(args.find(a => /^\d+$/.test(a))) || 1000;
if (!giveTarget) { api.sendMessage("❌ منشن شخصاً", threadID, messageID); }
else {
  await ensureUser(giveTarget);
  await addMoney(giveTarget, giveAmount);
  api.sendMessage(`💸 تم إعطاء ${giveAmount.toLocaleString()} $ للمستخدم`, threadID, messageID);
}

// [أمر: خذ فلوس / سحب فلوس / remove money]
const takeTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const takeAmount = parseInt(args.find(a => /^\d+$/.test(a))) || 1000;
if (!takeTarget) { api.sendMessage("❌ منشن شخصاً", threadID, messageID); }
else {
  const takeResult = await removeMoney(takeTarget, takeAmount);
  if (!takeResult.success) api.sendMessage("❌ رصيد غير كافٍ لدى المستخدم", threadID, messageID);
  else api.sendMessage(`✅ تم سحب ${takeAmount.toLocaleString()} $ من المستخدم`, threadID, messageID);
}

// [أمر: سرق / سرقة / steal]
const stealTarget = Object.keys(mentions)[0] || messageReply?.senderID;
if (!stealTarget || stealTarget === senderID) { api.sendMessage("❌ منشن شخصاً مختلفاً", threadID, messageID); }
else {
  await ensureUser(senderID);
  await ensureUser(stealTarget);
  const stealSenderData = await getUserData(senderID);
  const stealVictimData = await getUserData(stealTarget);
  const stealSenderLvl = stealSenderData?.currency?.level ?? 1;
  const victimMoney = stealVictimData?.currency?.money ?? 0;
  const successChance = Math.min(10 + stealSenderLvl * 2, 60);
  const rand = Math.random() * 100;
  if (rand < successChance) {
    const stolen = Math.floor(victimMoney * (0.05 + Math.random() * 0.1));
    if (stolen < 1) { api.sendMessage("😂 الضحية مفلسة! ما في شيء تسرقه", threadID, messageID); }
    else {
      await removeMoney(stealTarget, stolen);
      await addMoney(senderID, stolen);
      api.sendMessage(`🦹 نجحت السرقة!\n💰 سرقت ${stolen.toLocaleString()} $ من الضحية\n📊 نسبة النجاح كانت ${successChance}%`, threadID, messageID);
    }
  } else {
    const penalty = Math.floor((stealSenderData?.currency?.money ?? 0) * 0.05);
    await removeMoney(senderID, penalty);
    api.sendMessage(`🚨 فشلت السرقة! تم خصم ${penalty.toLocaleString()} $ منك كغرامة`, threadID, messageID);
  }
}

// [أمر: تحويل فلوس / transfer / حول]
const transferTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const transferAmount = parseInt(args.find(a => /^\d+$/.test(a))) || 100;
if (!transferTarget || transferTarget === senderID) { api.sendMessage("❌ منشن شخصاً مختلفاً", threadID, messageID); }
else {
  await ensureUser(senderID);
  await ensureUser(transferTarget);
  const transferResult = await removeMoney(senderID, transferAmount);
  if (!transferResult.success) { api.sendMessage("❌ رصيدك غير كافٍ", threadID, messageID); }
  else {
    await addMoney(transferTarget, transferAmount);
    api.sendMessage(`💸 تم تحويل ${transferAmount.toLocaleString()} $ بنجاح!`, threadID, messageID);
  }
}

// [أمر: لوحة الصدارة / top / الأثرياء]
const allUsersTop = await getAllUsers();
const sortedTop = allUsersTop.sort((a,b) => (b.money??0) - (a.money??0)).slice(0,10);
let topBoard = "🏆 ━━ لوحة الأثرياء ━━ 🏆\n\n";
const medals = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
sortedTop.forEach((u,i) => { topBoard += `${medals[i]} ${u.userID}: ${(u.money??0).toLocaleString()} $\n`; });
api.sendMessage(topBoard, threadID, messageID);

// [أمر: لوحة المستوى / top xp / أذكى]
const allUsersXP = await getAllUsers();
const sortedXP = allUsersXP.sort((a,b) => (b.exp??0) - (a.exp??0)).slice(0,10);
let xpBoard = "⭐ ━━ لوحة الأذكياء (XP) ━━ ⭐\n\n";
sortedXP.forEach((u,i) => { xpBoard += `${i+1}. ${u.userID}: ${(u.exp??0).toLocaleString()} XP — مستوى ${u.level??1}\n`; });
api.sendMessage(xpBoard, threadID, messageID);

// [أمر: ريست / reset / تصفير]
const resetTarget2 = Object.keys(mentions)[0] || messageReply?.senderID || senderID;
await ensureUser(resetTarget2);
await updateUserData(resetTarget2, { money: 0, exp: 0, level: 1, rank: "مبتدئ", messageCount: 0 });
api.sendMessage(`🔄 تم تصفير بيانات المستخدم بالكامل`, threadID, messageID);

// [أمر: إعطاء الكل / give all / مكافأة جماعية]
const giveAllAmount = parseInt(args.find(a => /^\d+$/.test(a))) || 500;
const infoGiveAll = await api.getThreadInfo(threadID);
let giveAllCount = 0;
for (const uid of infoGiveAll.participantIDs) {
  await ensureUser(uid);
  await addMoney(uid, giveAllAmount);
  giveAllCount++;
}
api.sendMessage(`🎁 تم إعطاء ${giveAllAmount.toLocaleString()} $ لـ ${giveAllCount} عضو!\n💰 المجموع: ${(giveAllAmount * giveAllCount).toLocaleString()} $`, threadID, messageID);

// [أمر: بنك / bank / إيداع]
const bankAction = args[1];
const bankAmount = parseInt(args[2]) || 0;
await ensureUser(senderID);
const bankUserData = await getUserData(senderID);
const bankMoney = bankUserData?.currency?.money ?? 0;
const bankSavings = bankUserData?.currency?.bank ?? 0;
if (bankAction === "إيداع" || bankAction === "deposit") {
  if (bankAmount > bankMoney) { api.sendMessage("❌ رصيدك غير كافٍ", threadID, messageID); }
  else {
    await removeMoney(senderID, bankAmount);
    await updateUserData(senderID, { bank: bankSavings + bankAmount });
    api.sendMessage(`🏦 تم إيداع ${bankAmount.toLocaleString()} $ في البنك\n💳 رصيد البنك: ${(bankSavings + bankAmount).toLocaleString()} $`, threadID, messageID);
  }
} else if (bankAction === "سحب" || bankAction === "withdraw") {
  if (bankAmount > bankSavings) { api.sendMessage("❌ رصيد البنك غير كافٍ", threadID, messageID); }
  else {
    await addMoney(senderID, bankAmount);
    await updateUserData(senderID, { bank: bankSavings - bankAmount });
    api.sendMessage(`💸 تم سحب ${bankAmount.toLocaleString()} $ من البنك`, threadID, messageID);
  }
} else {
  api.sendMessage(`🏦 ━━ بنك كيرا ━━ 🏦\n\n💵 رصيد المحفظة: ${bankMoney.toLocaleString()} $\n🏦 رصيد البنك: ${bankSavings.toLocaleString()} $\n\n• كينو بنك إيداع [مبلغ]\n• كينو بنك سحب [مبلغ]`, threadID, messageID);
}

// [أمر: مشروع / project / استثمار]
await ensureUser(senderID);
const projData = await getUserData(senderID);
const projMoney = projData?.currency?.money ?? 0;
const projCost = parseInt(args.find(a => /^\d+$/.test(a))) || 5000;
const projects = [
  { name: "مطعم", minReturn: 1.2, maxReturn: 2.5, risk: 20 },
  { name: "متجر إلكتروني", minReturn: 1.5, maxReturn: 3.0, risk: 30 },
  { name: "عقارات", minReturn: 1.8, maxReturn: 4.0, risk: 40 },
  { name: "تعدين عملات رقمية", minReturn: 0.5, maxReturn: 10, risk: 70 },
  { name: "شركة ناشئة", minReturn: 0.1, maxReturn: 20, risk: 80 }
];
const proj = projects[Math.floor(Math.random() * projects.length)];
if (projCost > projMoney) { api.sendMessage(`❌ تحتاج ${projCost.toLocaleString()} $ للاستثمار. رصيدك: ${projMoney.toLocaleString()} $`, threadID, messageID); }
else {
  const result2 = await removeMoney(senderID, projCost);
  if (!result2.success) { api.sendMessage("❌ فشل الاستثمار", threadID, messageID); }
  else {
    const failed = Math.random() * 100 < proj.risk;
    if (failed) {
      api.sendMessage(`📉 فشل مشروع ${proj.name}!\nخسرت ${projCost.toLocaleString()} $ 😭`, threadID, messageID);
    } else {
      const multiplier = proj.minReturn + Math.random() * (proj.maxReturn - proj.minReturn);
      const profit = Math.floor(projCost * multiplier);
      await addMoney(senderID, profit);
      api.sendMessage(`📈 نجح مشروع ${proj.name}!\n💰 استثمرت: ${projCost.toLocaleString()} $\n💵 ربحت: ${profit.toLocaleString()} $\n📊 العائد: ${(multiplier * 100).toFixed(0)}%`, threadID, messageID);
    }
  }
}

// [أمر: يومي / daily / مكافأة يومية]
await ensureUser(senderID);
const dailyData = await getUserData(senderID);
const lastDaily = dailyData?.currency?.lastDaily ?? 0;
const now24 = Date.now();
const diff24 = now24 - lastDaily;
const hours24 = Math.floor(diff24 / 3600000);
if (diff24 < 86400000) {
  const remaining = 24 - hours24;
  api.sendMessage(`⏰ يجب الانتظار ${remaining} ساعة للمكافأة اليومية التالية`, threadID, messageID);
} else {
  const dailyLvl = dailyData?.currency?.level ?? 1;
  const dailyReward = 500 + (dailyLvl * 100);
  await addMoney(senderID, dailyReward);
  await updateUserData(senderID, { lastDaily: now24 });
  api.sendMessage(`🎁 مكافأتك اليومية:\n💰 +${dailyReward.toLocaleString()} $\n⭐ +50 XP`, threadID, messageID);
}

// [أمر: أسبوعي / weekly / مكافأة أسبوعية]
await ensureUser(senderID);
const weeklyData = await getUserData(senderID);
const lastWeekly = weeklyData?.currency?.lastWeekly ?? 0;
const nowWeek = Date.now();
if (nowWeek - lastWeekly < 604800000) {
  const daysLeft = Math.ceil((604800000 - (nowWeek - lastWeekly)) / 86400000);
  api.sendMessage(`⏰ باقي ${daysLeft} أيام للمكافأة الأسبوعية`, threadID, messageID);
} else {
  const weeklyLvl = weeklyData?.currency?.level ?? 1;
  const weeklyReward = 5000 + (weeklyLvl * 500);
  await addMoney(senderID, weeklyReward);
  await updateUserData(senderID, { lastWeekly: nowWeek });
  api.sendMessage(`🎊 مكافأتك الأسبوعية:\n💰 +${weeklyReward.toLocaleString()} $\n⭐ +500 XP`, threadID, messageID);
}

// [أمر: عمل / work / شغل]
await ensureUser(senderID);
const workData = await getUserData(senderID);
const lastWork = workData?.currency?.lastWork ?? 0;
const nowWork = Date.now();
if (nowWork - lastWork < 3600000) {
  const minsLeft = Math.ceil((3600000 - (nowWork - lastWork)) / 60000);
  api.sendMessage(`⏰ يجب الانتظار ${minsLeft} دقيقة قبل العمل مجدداً`, threadID, messageID);
} else {
  const workJobs = ["مبرمج 💻","مصمم 🎨","محاسب 📊","مهندس 🔧","طبيب 🏥","معلم 📚","شيف 🍳","محامي ⚖️"];
  const job = workJobs[Math.floor(Math.random() * workJobs.length)];
  const workLvl = workData?.currency?.level ?? 1;
  const workReward = Math.floor((100 + Math.random() * 400) * (1 + workLvl * 0.1));
  const xpReward = Math.floor(10 + Math.random() * 40);
  await addMoney(senderID, workReward);
  await updateUserData(senderID, { lastWork: nowWork, exp: (workData?.currency?.exp ?? 0) + xpReward });
  api.sendMessage(`💼 عملت كـ${job}\n💰 +${workReward.toLocaleString()} $\n⭐ +${xpReward} XP`, threadID, messageID);
}

══════════════════════════════════════════
 ٤. الألعاب — GAMES
══════════════════════════════════════════

// [أمر: روليت / roulette / قمار]
await ensureUser(senderID);
const roulBet = parseInt(args.find(a => /^\d+$/.test(a))) || 100;
const roulData = await getUserData(senderID);
const roulMoney = roulData?.currency?.money ?? 0;
if (roulBet > roulMoney) { api.sendMessage(`❌ رصيدك غير كافٍ. رصيدك: ${roulMoney.toLocaleString()} $`, threadID, messageID); }
else {
  const roulResult = Math.floor(Math.random() * 37);
  const roulColors = ["🔴","⚫","⚫","🔴","⚫","🔴","⚫","🔴","⚫","🔴","⚫","⚫","🔴","⚫","🔴","⚫","🔴","⚫","🟢","🔴","⚫","🔴","⚫","🔴","⚫","🔴","⚫","🔴","⚫","⚫","🔴","⚫","🔴","⚫","🔴","⚫","🔴"];
  const roulColor = roulColors[roulResult] || "🟢";
  const roulWon = roulResult === 0 ? roulBet * 35 : (Math.random() > 0.5 ? roulBet * 2 : 0);
  if (roulWon > 0) {
    await addMoney(senderID, roulWon - roulBet);
    api.sendMessage(`🎰 الروليت!\n\n🎯 الرقم: ${roulResult} ${roulColor}\n💰 الرهان: ${roulBet.toLocaleString()} $\n✅ فزت بـ ${roulWon.toLocaleString()} $!`, threadID, messageID);
  } else {
    await removeMoney(senderID, roulBet);
    api.sendMessage(`🎰 الروليت!\n\n🎯 الرقم: ${roulResult} ${roulColor}\n💰 الرهان: ${roulBet.toLocaleString()} $\n❌ خسرت!`, threadID, messageID);
  }
}

// [أمر: سلوت / slot machine / ماكينة]
await ensureUser(senderID);
const slotBet = parseInt(args.find(a => /^\d+$/.test(a))) || 100;
const slotData = await getUserData(senderID);
const slotMoney = slotData?.currency?.money ?? 0;
if (slotBet > slotMoney) { api.sendMessage(`❌ رصيدك غير كافٍ`, threadID, messageID); }
else {
  const slotSymbols = ["🍒","🍊","🍋","🍇","⭐","💎","7️⃣","🔔"];
  const s1 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
  const s2 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
  const s3 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
  let slotWin = 0;
  let slotMsg = "";
  if (s1 === s2 && s2 === s3) {
    const multipliers = { "💎": 50, "7️⃣": 30, "⭐": 20, "🔔": 15, "🍇": 10, "🍒": 8, "🍊": 6, "🍋": 5 };
    slotWin = slotBet * (multipliers[s1] || 5);
    slotMsg = `🎊 جاكبوت! ثلاثة متطابقة!`;
  } else if (s1 === s2 || s2 === s3 || s1 === s3) {
    slotWin = slotBet * 2;
    slotMsg = `✅ اثنان متطابقان!`;
  } else {
    slotMsg = `❌ لا تطابق`;
  }
  if (slotWin > 0) {
    await addMoney(senderID, slotWin - slotBet);
    api.sendMessage(`🎰 ماكينة السلوت!\n\n[ ${s1} | ${s2} | ${s3} ]\n\n${slotMsg}\n💰 ربحت: ${slotWin.toLocaleString()} $`, threadID, messageID);
  } else {
    await removeMoney(senderID, slotBet);
    api.sendMessage(`🎰 ماكينة السلوت!\n\n[ ${s1} | ${s2} | ${s3} ]\n\n${slotMsg}\n❌ خسرت: ${slotBet.toLocaleString()} $`, threadID, messageID);
  }
}

// [أمر: نرد / dice / كعب الحظ]
await ensureUser(senderID);
const diceBet = parseInt(args.find(a => /^\d+$/.test(a))) || 100;
const diceChoice = parseInt(args[args.length - 1]);
const diceData = await getUserData(senderID);
const diceMoney = diceData?.currency?.money ?? 0;
if (diceBet > diceMoney) { api.sendMessage(`❌ رصيدك غير كافٍ`, threadID, messageID); }
else if (!diceChoice || diceChoice < 1 || diceChoice > 6) { api.sendMessage("🎲 اختر رقماً بين 1 و 6\nمثال: كينو نرد 500 3", threadID, messageID); }
else {
  const diceResult = Math.floor(Math.random() * 6) + 1;
  const diceEmojis = ["","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣"];
  if (diceResult === diceChoice) {
    const diceWin = diceBet * 5;
    await addMoney(senderID, diceWin - diceBet);
    api.sendMessage(`🎲 النرد!\n\nاخترت: ${diceEmojis[diceChoice]}\nالنتيجة: ${diceEmojis[diceResult]}\n\n🎉 فزت بـ ${diceWin.toLocaleString()} $!`, threadID, messageID);
  } else {
    await removeMoney(senderID, diceBet);
    api.sendMessage(`🎲 النرد!\n\nاخترت: ${diceEmojis[diceChoice]}\nالنتيجة: ${diceEmojis[diceResult]}\n\n❌ خسرت ${diceBet.toLocaleString()} $`, threadID, messageID);
  }
}

// [أمر: تخمين / guess / خمن]
await ensureUser(senderID);
const guessNum = parseInt(args[1]);
const secretNum = Math.floor(Math.random() * 10) + 1;
if (!guessNum || guessNum < 1 || guessNum > 10) { api.sendMessage("🔢 خمّن رقماً بين 1 و 10\nمثال: كينو تخمين 7", threadID, messageID); }
else {
  const guessData = await getUserData(senderID);
  const guessReward = 300;
  if (guessNum === secretNum) {
    await addMoney(senderID, guessReward);
    api.sendMessage(`🎯 أحسنت! الرقم كان ${secretNum}\n💰 ربحت ${guessReward} $!`, threadID, messageID);
  } else {
    api.sendMessage(`❌ خطأ! الرقم كان ${secretNum} وليس ${guessNum}\nحاول مجدداً!`, threadID, messageID);
  }
}

// [أمر: صح أو خطأ / true false / سؤال]
const triviaQuestions = [
  { q: "الشمس تشرق من الغرب؟", a: false },
  { q: "العرب اخترعوا الأرقام المستخدمة حالياً؟", a: true },
  { q: "القطة لها 7 أرواح حقيقياً؟", a: false },
  { q: "الذهب يمكن أن يذوب؟", a: true },
  { q: "الماء يغلي عند 100 درجة على مستوى سطح البحر؟", a: true },
  { q: "بغداد عاصمة إيران؟", a: false },
  { q: "القرآن الكريم نزل على 23 سنة؟", a: true },
  { q: "الفيل أكبر حيوان بري في العالم؟", a: true }
];
const trivQ = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
const userAnswer = args[1]?.toLowerCase();
if (!userAnswer) {
  api.sendMessage(`❓ ${trivQ.q}\n\nأجب: كينو صح أو خطأ صح\n          كينو صح أو خطأ خطأ`, threadID, messageID);
} else {
  const isCorrect = (userAnswer === "صح" || userAnswer === "true") === trivQ.a;
  await ensureUser(senderID);
  if (isCorrect) {
    await addMoney(senderID, 200);
    api.sendMessage(`✅ إجابة صحيحة!\n💰 +200 $`, threadID, messageID);
  } else {
    api.sendMessage(`❌ إجابة خاطئة!\nالإجابة الصحيحة: ${trivQ.a ? "صح" : "خطأ"}`, threadID, messageID);
  }
}

// [أمر: ورق حجر مقص / rock paper scissors]
await ensureUser(senderID);
const rpsChoice = args[1];
const rpsOptions = ["ورق", "حجر", "مقص"];
const rpsEmojis = { "ورق": "📄", "حجر": "🪨", "مقص": "✂️" };
if (!rpsOptions.includes(rpsChoice)) { api.sendMessage("✂️ اختر: ورق | حجر | مقص\nمثال: كينو ورق حجر مقص ورق", threadID, messageID); }
else {
  const rpsBotChoice = rpsOptions[Math.floor(Math.random() * 3)];
  const rpsWins = { "ورق": "حجر", "حجر": "مقص", "مقص": "ورق" };
  const rpsBet2 = 200;
  let rpsResult = "";
  if (rpsChoice === rpsBotChoice) { rpsResult = "🤝 تعادل!"; }
  else if (rpsWins[rpsChoice] === rpsBotChoice) {
    await addMoney(senderID, rpsBet2);
    rpsResult = `🎉 فزت! +${rpsBet2} $`;
  } else {
    await removeMoney(senderID, rpsBet2);
    rpsResult = `❌ خسرت! -${rpsBet2} $`;
  }
  api.sendMessage(`${rpsEmojis[rpsChoice]} أنت vs البوت ${rpsEmojis[rpsBotChoice]}\n\n${rpsResult}`, threadID, messageID);
}

// [أمر: قلاب عملة / coin flip / طرح أو مكتوب]
await ensureUser(senderID);
const coinBet = parseInt(args.find(a => /^\d+$/.test(a))) || 100;
const coinChoice2 = args.find(a => ["طرح","مكتوب","heads","tails"].includes(a.toLowerCase()));
const coinData = await getUserData(senderID);
if (coinBet > (coinData?.currency?.money ?? 0)) { api.sendMessage("❌ رصيدك غير كافٍ", threadID, messageID); }
else if (!coinChoice2) { api.sendMessage("🪙 اختر: طرح أو مكتوب\nمثال: كينو قلاب عملة 500 طرح", threadID, messageID); }
else {
  const coinResult = Math.random() > 0.5 ? "طرح" : "مكتوب";
  const coinEmoji = coinResult === "طرح" ? "🦅" : "👑";
  const coinNorm = coinChoice2.toLowerCase() === "heads" ? "طرح" : coinChoice2.toLowerCase() === "tails" ? "مكتوب" : coinChoice2;
  if (coinNorm === coinResult) {
    await addMoney(senderID, coinBet);
    api.sendMessage(`🪙 قلاب العملة!\n\nالنتيجة: ${coinResult} ${coinEmoji}\n\n✅ فزت بـ ${coinBet.toLocaleString()} $!`, threadID, messageID);
  } else {
    await removeMoney(senderID, coinBet);
    api.sendMessage(`🪙 قلاب العملة!\n\nالنتيجة: ${coinResult} ${coinEmoji}\n\n❌ خسرت ${coinBet.toLocaleString()} $`, threadID, messageID);
  }
}

// [أمر: يانصيب / lottery / الجائزة الكبرى]
await ensureUser(senderID);
const lotteryTicket = 1000;
const lotteryData = await getUserData(senderID);
if ((lotteryData?.currency?.money ?? 0) < lotteryTicket) { api.sendMessage(`❌ تذكرة اليانصيب تكلف ${lotteryTicket} $`, threadID, messageID); }
else {
  await removeMoney(senderID, lotteryTicket);
  const lotteryNumbers = Array.from({length:6}, () => Math.floor(Math.random()*49)+1);
  const yourNumbers = Array.from({length:6}, () => Math.floor(Math.random()*49)+1);
  const matches = yourNumbers.filter(n => lotteryNumbers.includes(n)).length;
  const lotteryPrizes = [0, 0, 500, 2000, 10000, 50000, 1000000];
  const prize = lotteryPrizes[matches] || 0;
  if (prize > 0) await addMoney(senderID, prize);
  api.sendMessage(`🎟️ اليانصيب!\n\nأرقامك: ${yourNumbers.join(" - ")}\nالأرقام الفائزة: ${lotteryNumbers.join(" - ")}\n\nتطابقات: ${matches}/6\n${prize > 0 ? `🎉 ربحت ${prize.toLocaleString()} $!` : "❌ لم تربح هذه المرة"}`, threadID, messageID);
}

// [أمر: بلاك جاك / blackjack / 21]
await ensureUser(senderID);
const bjBet = parseInt(args.find(a => /^\d+$/.test(a))) || 500;
const bjData = await getUserData(senderID);
if (bjBet > (bjData?.currency?.money ?? 0)) { api.sendMessage("❌ رصيدك غير كافٍ", threadID, messageID); }
else {
  const bjCards = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const bjValues = { "A":11,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,"J":10,"Q":10,"K":10 };
  const dealCard = () => bjCards[Math.floor(Math.random() * bjCards.length)];
  const calcHand = (hand) => {
    let total = hand.reduce((s,c) => s + (bjValues[c]||0), 0);
    let aces = hand.filter(c => c === "A").length;
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  };
  const playerHand = [dealCard(), dealCard()];
  const dealerHand = [dealCard(), dealCard()];
  const playerTotal = calcHand(playerHand);
  const dealerTotal = calcHand(dealerHand);
  let bjResult = "";
  if (playerTotal === 21) {
    const win21 = Math.floor(bjBet * 2.5);
    await addMoney(senderID, win21 - bjBet);
    bjResult = `🎊 بلاك جاك! ربحت ${win21.toLocaleString()} $`;
  } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
    await addMoney(senderID, bjBet);
    bjResult = `✅ فزت! +${bjBet.toLocaleString()} $`;
  } else if (playerTotal === dealerTotal) {
    bjResult = `🤝 تعادل! استرددت رهانك`;
  } else {
    await removeMoney(senderID, bjBet);
    bjResult = `❌ خسرت ${bjBet.toLocaleString()} $`;
  }
  api.sendMessage(`🃏 بلاك جاك!\n\nيدك: ${playerHand.join(" ")} = ${playerTotal}\nالديلر: ${dealerHand[0]} ?\n\n${bjResult}`, threadID, messageID);
}

// [أمر: لعبة الأرقام / number game / خمن الأرقام]
const numGame = Math.floor(Math.random() * 100) + 1;
const numGuess = parseInt(args[1]);
if (!numGuess) { api.sendMessage(`🔢 خمّن رقماً بين 1 و 100!\nمثال: كينو لعبة الأرقام 42`, threadID, messageID); }
else {
  await ensureUser(senderID);
  if (numGuess === numGame) {
    await addMoney(senderID, 1000);
    api.sendMessage(`🎯 ممتاز! الرقم كان ${numGame}!\n💰 +1000 $`, threadID, messageID);
  } else if (Math.abs(numGuess - numGame) <= 5) {
    await addMoney(senderID, 200);
    api.sendMessage(`🔥 قريب جداً! الرقم كان ${numGame}\n💰 +200 $ للقرب`, threadID, messageID);
  } else {
    const hint = numGuess < numGame ? "⬆️ أكبر" : "⬇️ أصغر";
    api.sendMessage(`❌ خطأ! ${hint} من ${numGuess}\nالرقم الصحيح: ${numGame}`, threadID, messageID);
  }
}

// [أمر: لعبة الكلمات / word game / حروف]
const wordChallenges = ["حيوان يبدأ بحرف ك","دولة عربية","فاكهة","مهنة","لون","جزيرة","نهر","جبل"];
const challenge = wordChallenges[Math.floor(Math.random() * wordChallenges.length)];
const wordAnswer = args.slice(1).join(" ");
if (!wordAnswer) { api.sendMessage(`🔤 التحدي: ${challenge}\nأجب: كينو لعبة الكلمات [إجابتك]`, threadID, messageID); }
else {
  await ensureUser(senderID);
  await addMoney(senderID, 150);
  api.sendMessage(`✅ إجابتك: ${wordAnswer}\n💰 +150 $ مكافأة المشاركة!`, threadID, messageID);
}

// [أمر: سباق / race / منافسة]
const raceTarget = Object.keys(mentions)[0];
if (!raceTarget) { api.sendMessage("🏎️ منشن شخصاً للسباق معه!", threadID, messageID); }
else {
  await ensureUser(senderID);
  await ensureUser(raceTarget);
  const raceBet2 = parseInt(args.find(a => /^\d+$/.test(a))) || 500;
  const p1Speed = Math.floor(Math.random() * 100) + 1;
  const p2Speed = Math.floor(Math.random() * 100) + 1;
  const raceEmojis = ["🏎️","🚗","🚕","🚙","🚌"];
  const car1 = raceEmojis[Math.floor(Math.random() * raceEmojis.length)];
  const car2 = raceEmojis[Math.floor(Math.random() * raceEmojis.length)];
  let raceMsg = `🏁 السباق بدأ!\n\n${car1} أنت: ${p1Speed} كم/س\n${car2} المنافس: ${p2Speed} كم/س\n\n`;
  if (p1Speed > p2Speed) {
    await removeMoney(raceTarget, raceBet2);
    await addMoney(senderID, raceBet2);
    raceMsg += `🏆 فزت! +${raceBet2.toLocaleString()} $`;
  } else if (p2Speed > p1Speed) {
    await removeMoney(senderID, raceBet2);
    await addMoney(raceTarget, raceBet2);
    raceMsg += `❌ خسرت! -${raceBet2.toLocaleString()} $`;
  } else {
    raceMsg += `🤝 تعادل!`;
  }
  api.sendMessage(raceMsg, threadID, messageID);
}

══════════════════════════════════════════
 ٥. ألعاب تفاعلية — INTERACTIVE GAMES
══════════════════════════════════════════

// [أمر: من سيفوز / who wins / تنبؤ]
const infoWhoWins = await api.getThreadInfo(threadID);
const candidates = infoWhoWins.participantIDs;
const winner = candidates[Math.floor(Math.random() * candidates.length)];
const winnerChance = Math.floor(Math.random() * 60) + 40;
api.sendMessage(`🏆 المتنبئ الآلي يقول:\n\nالفائز هو: ${winner}\nنسبة الفوز: ${winnerChance}%\n\n(هذا للترفيه فقط 😄)`, threadID, messageID);

// [أمر: من الأقوى / strongest]
const infoStrong = await api.getThreadInfo(threadID);
const strongWinner = infoStrong.participantIDs[Math.floor(Math.random() * infoStrong.participantIDs.length)];
const power = Math.floor(Math.random() * 9000) + 1000;
api.sendMessage(`💪 أقوى شخص في المجموعة:\n\n👤 ${strongWinner}\n⚡ القوة: ${power.toLocaleString()}\n\n(نتيجة عشوائية للترفيه 😄)`, threadID, messageID);

// [أمر: من المجنون / craziest]
const infoCrazy = await api.getThreadInfo(threadID);
const crazyPerson = infoCrazy.participantIDs[Math.floor(Math.random() * infoCrazy.participantIDs.length)];
const crazyLevel = Math.floor(Math.random() * 100);
api.sendMessage(`🤪 أجنّ شخص في المجموعة اليوم:\n\n👤 ${crazyPerson}\n🌡️ مستوى الجنون: ${crazyLevel}%`, threadID, messageID);

// [أمر: من المحظوظ / luckiest / الحظ]
const infoLucky = await api.getThreadInfo(threadID);
const luckyPerson = infoLucky.participantIDs[Math.floor(Math.random() * infoLucky.participantIDs.length)];
const luck = Math.floor(Math.random() * 100);
api.sendMessage(`🍀 المحظوظ اليوم:\n\n👤 ${luckyPerson}\n🌟 نسبة الحظ: ${luck}%`, threadID, messageID);

// [أمر: شخصية اليوم / personality / من أنت]
const personalities = ["🦁 القائد الجسور","🦊 الذكي الماكر","🐝 المجتهد المثابر","🦋 الرومانسي الحالم","🐯 المحارب الشجاع","🦅 الحر المستقل","🐬 الودود المرح"];
const targetPers = Object.keys(mentions)[0] || senderID;
const randomPers = personalities[Math.floor(Math.random() * personalities.length)];
api.sendMessage(`🎭 شخصية ${targetPers} اليوم:\n\n${randomPers}\n\n(للترفيه فقط 😄)`, threadID, messageID);

// [أمر: توافق / compatibility / كيمياء]
const comp1 = Object.keys(mentions)[0] || senderID;
const comp2 = Object.keys(mentions)[1] || messageReply?.senderID;
if (!comp2) { api.sendMessage("❤️ منشن شخصين للتحقق من التوافق", threadID, messageID); }
else {
  const compat = Math.floor(Math.random() * 101);
  const compatEmoji = compat >= 80 ? "💕" : compat >= 60 ? "❤️" : compat >= 40 ? "💛" : compat >= 20 ? "🤝" : "💔";
  api.sendMessage(`${compatEmoji} نسبة التوافق:\n\n👤 ${comp1}\n💞 مع 💞\n👤 ${comp2}\n\nالنتيجة: ${compat}% ${compatEmoji}`, threadID, messageID);
}

// [أمر: تفاله / stupid / إيه أغبى]
const stupidTarget = Object.keys(mentions)[0] || senderID;
const stupidLvl = Math.floor(Math.random() * 100);
api.sendMessage(`🤦 مستوى الغباء لـ ${stupidTarget}: ${stupidLvl}%\n\n${stupidLvl > 80 ? "😂 الله يعين اللي حوله!" : stupidLvl > 50 ? "🤔 وسط وسط" : "😊 ذكي بالحمد لله"}`, threadID, messageID);

// [أمر: ذكاء / iq / نسبة الذكاء]
const iqTarget = Object.keys(mentions)[0] || senderID;
const iqScore = Math.floor(Math.random() * 100) + 60;
const iqLevel = iqScore >= 140 ? "عبقري 🧠" : iqScore >= 120 ? "فوق المتوسط 🌟" : iqScore >= 100 ? "متوسط 📊" : iqScore >= 80 ? "دون المتوسط 😅" : "يحتاج مساعدة 💙";
api.sendMessage(`🧠 نسبة ذكاء ${iqTarget}:\n\nIQ: ${iqScore}\nالمستوى: ${iqLevel}`, threadID, messageID);

// [أمر: بخت / luck score / نصيب]
const luckTarget = Object.keys(mentions)[0] || senderID;
const luckScore = Math.floor(Math.random() * 100);
const luckMsg = luckScore >= 80 ? "حظك اليوم ذهب! 🌟" : luckScore >= 60 ? "حظ جيد 👍" : luckScore >= 40 ? "حظ عادي 🌤️" : luckScore >= 20 ? "حذار اليوم ⚠️" : "ابقَ في البيت! 😂";
api.sendMessage(`🍀 حظ ${luckTarget} اليوم:\n\n${luckScore}% — ${luckMsg}`, threadID, messageID);

// [أمر: مبارزة / duel / قتال]
const duelTarget = Object.keys(mentions)[0];
if (!duelTarget) { api.sendMessage("⚔️ منشن خصمك للمبارزة!", threadID, messageID); }
else {
  await ensureUser(senderID);
  await ensureUser(duelTarget);
  const p1Hp = Math.floor(Math.random() * 50) + 50;
  const p2Hp = Math.floor(Math.random() * 50) + 50;
  const p1Atk = Math.floor(Math.random() * 30) + 10;
  const p2Atk = Math.floor(Math.random() * 30) + 10;
  const duelBet3 = 500;
  let duelLog = `⚔️ المبارزة!\n\n💪 ${senderID} vs ${duelTarget}\n\nصحة: ${p1Hp} vs ${p2Hp}\nهجوم: ${p1Atk} vs ${p2Atk}\n\n`;
  if (p1Hp + p1Atk > p2Hp + p2Atk) {
    await addMoney(senderID, duelBet3);
    await removeMoney(duelTarget, duelBet3);
    duelLog += `🏆 فزت بالمبارزة! +${duelBet3} $`;
  } else {
    await removeMoney(senderID, duelBet3);
    await addMoney(duelTarget, duelBet3);
    duelLog += `❌ خسرت المبارزة! -${duelBet3} $`;
  }
  api.sendMessage(duelLog, threadID, messageID);
}

══════════════════════════════════════════
 ٦. الترفيه — ENTERTAINMENT
══════════════════════════════════════════

// [أمر: نكتة / joke / اضحك]
const jokes = [
  "طالب لأستاذه: دكتور، عندي سؤال\nالأستاذ: اسأل\nالطالب: هل يجوز للإنسان أن يعاقَب بسبب شيء لم يفعله؟\nالأستاذ: طبعاً لا!\nالطالب: الحمد لله، أنا ما سويت الواجب 😂",
  "واحد عند الطبيب:\nالطبيب: كيف نومك؟\nهو: زين بس أخوي يصحيني\nالطبيب: ليش؟\nهو: عشان أروح أنام 😂",
  "معلمة للتلاميذ: من يعطيني جملة فيها كلمة أمس؟\nتلميذ: أمس أكلت سمك\nالمعلمة: ممتاز! ومن يعطيني جملة فيها كلمة غد؟\nتلميذ آخر: غد أكلت سمك 😂",
  "أب لابنه: درجاتك؟\nالابن: غرقت 😂\nالأب: غرقت في الدراسة؟\nالابن: لا، الأوراق وقعت في الماء",
  "واحد يكلم صاحبه بالهاتف:\nالصاحب: أنت فين؟\nهو: عند البيت\nالصاحب: جوا أو برا؟\nهو: بين بين، عند الباب 😂"
];
const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
api.sendMessage(`😂 نكتة اليوم:\n\n${randomJoke}`, threadID, messageID);

// [أمر: توقعات / horoscope / برج]
const targetHoro = Object.keys(mentions)[0] || senderID;
const horoscopeTexts = [
  "⭐ النجوم تقول: يوم مميز ينتظرك، الحظ في صفك",
  "🌙 القمر يشير: تحذر من قرارات متسرعة اليوم",
  "☀️ الشمس تبشّر: مفاجأة سعيدة في الطريق",
  "🌟 النجوم تنصح: اغتنم الفرص ولا تتردد",
  "💫 الكون يقول: الصبر مفتاح الفرج",
  "🔮 التوقع: تغيير إيجابي كبير قريب جداً"
];
const randomHoro = horoscopeTexts[Math.floor(Math.random() * horoscopeTexts.length)];
api.sendMessage(`🔮 توقعات ${targetHoro} اليوم:\n\n${randomHoro}\n\n(للترفيه فقط)`, threadID, messageID);

// [أمر: شعر / poem / قصيدة]
const poems = [
  "في عينيك ألف سؤال\nوفي صمتك ألف جواب\nأنت سر الكون كله\nوأنا ما زلت أبحث في الكتاب",
  "الوقت كالسيف إن لم تقطعه\nقطعك وفي لحظة ضاع عمرك\nفاغتنم يومك قبل ليلك\nوليلك قبل أن يفجر صبحك",
  "كن كالنخيل يشمخ في الفلا\nلا تنحني للريح والأعاصير\nإن الكريم يعلو فوق كل بلا\nوالصابر الجميل يحمد العواقب",
  "في زحمة الحياة تذكّر:\nأن هناك من ينتظر ابتسامتك\nأن هناك قلباً يبحث عنك\nفلا تبخل بكلمة طيبة"
];
const randomPoem = poems[Math.floor(Math.random() * poems.length)];
api.sendMessage(`📜 شعر:\n\n${randomPoem}`, threadID, messageID);

// [أمر: اقتباس / quote / حكمة]
const quotes = [
  "💡 'النجاح ليس نهائياً، والفشل ليس قاتلاً، الشجاعة هي ما يهم' — وينستون تشرشل",
  "🌟 'الفرصة لا تأتي مرتين، استغلها أو تندم' — حكمة عربية",
  "💪 'ما لم يقتلك يجعلك أقوى' — نيتشه",
  "🧠 'العلم بلا عمل كالشجرة بلا ثمر' — حكمة إسلامية",
  "🔑 'كل المشكلات تملك حلولاً، فقط لا ترفع يدك قبل الأوان'",
  "🌈 'بعد كل عاصفة تأتي قوس قزح، بعد كل ليل يأتي النهار'",
  "⚡ 'الإنسان عدو ما جهل وصديق ما يعلم' — علي بن أبي طالب"
];
const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
api.sendMessage(randomQuote, threadID, messageID);

// [أمر: طالعك / fortune / حظك اليوم]
const fortunes = [
  "🌟 اليوم يوم مبارك! ستحقق إنجازاً مهماً",
  "⚠️ احذر اليوم من قرارات متسرعة",
  "💰 المال سيأتيك من مصدر غير متوقع",
  "❤️ قريباً ستلتقي بشخص مميز يغير حياتك",
  "📚 التعلم اليوم سيثمر غداً، استثمر وقتك",
  "🤝 صديق قديم سيعود إلى حياتك",
  "🚀 فرصة كبيرة في الأفق، كن مستعداً!"
];
const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
api.sendMessage(`🔮 طالعك اليوم:\n\n${randomFortune}\n\n(للترفيه فقط 😄)`, threadID, messageID);

// [أمر: اسألني / 8ball / سؤال السحر]
const question = args.slice(1).join(" ");
if (!question) { api.sendMessage("🎱 اسألني أي سؤال!\nمثال: كينو اسألني هل سأنجح في الامتحان؟", threadID, messageID); }
else {
  const ball8Answers = [
    "✅ نعم بكل تأكيد!", "✅ الإشارات تقول نعم", "✅ احتمال كبير جداً",
    "🤔 من المحتمل", "🤔 ليس واضحاً الآن", "🤔 أعد السؤال",
    "❌ لا تعتمد على ذلك", "❌ الإجابة لا", "❌ كل الدلائل تقول لا"
  ];
  const ball8 = ball8Answers[Math.floor(Math.random() * ball8Answers.length)];
  api.sendMessage(`🎱 سؤالك: ${question}\n\n${ball8}`, threadID, messageID);
}

// [أمر: رأي / opinion / ما رأيك]
const opinionTopic = args.slice(1).join(" ");
if (!opinionTopic) { api.sendMessage("💭 اكتب الموضوع\nمثال: كينو رأي الدراسة", threadID, messageID); }
else {
  const opinions = [
    `💭 رأيي في "${opinionTopic}": موضوع مثير للجدل يستحق التأمل`,
    `🤔 "${opinionTopic}": لكل وجهة نظر، والحكمة في التوازن`,
    `💡 "${opinionTopic}": من أفضل المواضيع للنقاش البنّاء`,
    `⚖️ "${opinionTopic}": له إيجابيات وسلبيات، الأمر يعتمد على السياق`
  ];
  api.sendMessage(opinions[Math.floor(Math.random() * opinions.length)], threadID, messageID);
}

// [أمر: عيد ميلاد / happy birthday / تهنئة]
const bdayTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const bdayMsg = `🎂🎉 كل عام وأنت بخير! 🎉🎂\n\nأتمنى لك يا ${bdayTarget}:\n🌟 عاماً مليئاً بالسعادة\n💰 ورزقاً واسعاً\n❤️ وصحة دائمة\n\n🎈🎁🎊 Happy Birthday! 🎊🎁🎈`;
api.sendMessage(bdayMsg, threadID, messageID);

// [أمر: مدح / praise / اطرِ]
const praiseTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const praises = [
  `🌟 ${praiseTarget} أنت شخص رائع ومميز! نعم من يعرفك`,
  `💎 ${praiseTarget} قلبك من ذهب وعقلك من ماس!`,
  `🦁 ${praiseTarget} أنت قوي وشجاع، عاش من يشبهك!`,
  `🌈 ${praiseTarget} وجودك في المجموعة يضيف بهجة وسعادة!`
];
api.sendMessage(praises[Math.floor(Math.random() * praises.length)], threadID, messageID);

// [أمر: شتم / roast / هجاء]
const roastTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const roasts = [
  `😂 ${roastTarget} وجهه يشبه الخريطة التي ما أحد يفهمها!`,
  `🤣 ${roastTarget} لما يتكلم الكل يتفق على الصمت 😂`,
  `😅 ${roastTarget} حتى المرآة تغمض عينيها لما يمر أمامها!`,
  `😂 ${roastTarget} ذكاؤه تحميل بطيء والإشارة ضعيفة!`
];
api.sendMessage(`${roasts[Math.floor(Math.random() * roasts.length)]}\n\n(بالمزاح فقط 😄 لا تزعل!)`, threadID, messageID);

══════════════════════════════════════════
 ٧. معلومات ومساعدة — INFO & HELP
══════════════════════════════════════════

// [أمر: بروفايل / profile / ملف]
const profileTarget = Object.keys(mentions)[0] || messageReply?.senderID || senderID;
await ensureUser(profileTarget);
const profData = await getUserData(profileTarget);
const profMoney = profData?.currency?.money ?? 0;
const profExp   = profData?.currency?.exp ?? 0;
const profLvl   = profData?.currency?.level ?? 1;
const profRank  = profData?.currency?.rank ?? "مبتدئ";
const profMsgs  = profData?.currency?.messageCount ?? 0;
const profileMsg = `👤 ━━ الملف الشخصي ━━ 👤\n\n🆔 ID: ${profileTarget}\n💵 الرصيد: ${profMoney.toLocaleString()} $\n⭐ XP: ${profExp.toLocaleString()}\n📊 المستوى: ${profLvl}\n🏅 الرتبة: ${profRank}\n💬 الرسائل: ${profMsgs.toLocaleString()}`;
api.sendMessage(profileMsg, threadID, messageID);

// [أمر: ترتيب المستويات / levels / مستويات]
const levelsText = `📊 ━━ نظام المستويات ━━ 📊\n\n` +
  `مستوى 1-5: مبتدئ 🌱\n` +
  `مستوى 6-10: متعلم 📚\n` +
  `مستوى 11-20: متقدم ⭐\n` +
  `مستوى 21-30: خبير 💫\n` +
  `مستوى 31-50: محترف 💎\n` +
  `مستوى 51-75: أسطورة 🔥\n` +
  `مستوى 76-99: ملك 👑\n` +
  `مستوى 100: إله ⚡`;
api.sendMessage(levelsText, threadID, messageID);

// [أمر: مساعدة / help / أوامر]
const helpMsg = `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗜 𝗨𝗟𝗧𝗥𝗔 ━━ ⌬\n\n` +
  `🏠 إدارة الكروب:\n• اطرد المنشن | رقّ المنشن | قفل/فتح\n• غير اسم الكروب [اسم] | غير إيموجي\n\n` +
  `💰 الاقتصاد:\n• رصيدي | عمل | يومي | أسبوعي\n• سرق المنشن | حول [مبلغ] المنشن\n• بنك إيداع/سحب [مبلغ] | مشروع\n\n` +
  `🎮 الألعاب:\n• روليت [مبلغ] | سلوت [مبلغ]\n• نرد [مبلغ] [1-6] | قلاب عملة\n• يانصيب | بلاك جاك | مبارزة\n• ورق حجر مقص [اختيار]\n\n` +
  `🎭 ترفيه:\n• نكتة | شعر | حكمة | طالعك\n• اسألني [سؤال] | مدح المنشن\n• توافق [@1] [@2] | من المحظوظ\n\n` +
  `⚙️ النظام:\n• بياناتك | قائمة | شغل [اسم]\n• كينو [طلب] احفظ باسم [اسم]`;
api.sendMessage(helpMsg, threadID, messageID);

// [أمر: ping / بينغ / استجابة]
const startTime = Date.now();
api.sendMessage(`🏓 Pong!\n⚡ الاستجابة: ${Date.now() - startTime}ms\n✅ البوت يعمل بشكل طبيعي`, threadID, messageID);

// [أمر: وقت / time / الساعة]
const nowTime = new Date();
const timeStr = nowTime.toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad", hour12: true });
api.sendMessage(`🕐 الوقت الحالي:\n\n${timeStr}\n\n🌍 التوقيت: بغداد (UTC+3)`, threadID, messageID);

// [أمر: تاريخ / date / اليوم]
const nowDate = new Date();
const days = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const dateStr = `${days[nowDate.getDay()]}، ${nowDate.getDate()} ${months[nowDate.getMonth()]} ${nowDate.getFullYear()}`;
api.sendMessage(`📅 التاريخ اليوم:\n\n${dateStr}`, threadID, messageID);

// [أمر: ID / معرف / هويتي]
api.sendMessage(`🆔 معلوماتك:\n\n👤 ID: ${senderID}\n💬 Thread ID: ${threadID}`, threadID, messageID);

// [أمر: bot ID / معرف البوت]
const botID = api.getCurrentUserID();
api.sendMessage(`🤖 معلومات البوت:\n\n🆔 ID: ${botID}\n✅ يعمل بشكل طبيعي`, threadID, messageID);

══════════════════════════════════════════
 ٨. أوامر إدارية متقدمة — ADVANCED ADMIN
══════════════════════════════════════════

// [أمر: احظر / ban / حظر]
const banTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const banReason = args.filter(a => !a.includes("@")).slice(1).join(" ") || "مخالفة القواعد";
if (!banTarget) { api.sendMessage("❌ منشن شخصاً", threadID, messageID); }
else {
  await api.removeUserFromGroup(banTarget, threadID);
  api.sendMessage(`🚫 تم حظر ${banTarget}\n📌 السبب: ${banReason}`, threadID, messageID);
}

// [أمر: تحذير / warn / warning]
const warnTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const warnReason = args.filter(a => !a.includes("@")).slice(1).join(" ") || "سلوك غير لائق";
if (!warnTarget) { api.sendMessage("❌ منشن شخصاً", threadID, messageID); }
else {
  await ensureUser(warnTarget);
  const warnData = await getUserData(warnTarget);
  const currentWarns = (warnData?.currency?.warns ?? 0) + 1;
  await updateUserData(warnTarget, { warns: currentWarns });
  if (currentWarns >= 3) {
    await api.removeUserFromGroup(warnTarget, threadID);
    api.sendMessage(`⛔ تم طرد ${warnTarget} بعد ${currentWarns} تحذيرات!\n📌 السبب الأخير: ${warnReason}`, threadID, messageID);
  } else {
    api.sendMessage(`⚠️ تحذير للمستخدم ${warnTarget}\n📌 السبب: ${warnReason}\n🔢 التحذير: ${currentWarns}/3\n${currentWarns === 2 ? "⛔ تحذير أخير قبل الطرد!" : ""}`, threadID, messageID);
  }
}

// [أمر: تحذيرات / warns / عدد التحذيرات]
const checksWarnTarget = Object.keys(mentions)[0] || messageReply?.senderID || senderID;
await ensureUser(checksWarnTarget);
const checksWarnData = await getUserData(checksWarnTarget);
const checksWarns = checksWarnData?.currency?.warns ?? 0;
api.sendMessage(`⚠️ تحذيرات ${checksWarnTarget}:\n\n🔢 ${checksWarns}/3 تحذير${checksWarns === 0 ? "\n✅ سجل نظيف!" : checksWarns >= 3 ? "\n⛔ يستحق الطرد!" : ""}`, threadID, messageID);

// [أمر: مسح تحذيرات / clear warns / reset warns]
const clearWarnTarget = Object.keys(mentions)[0] || messageReply?.senderID;
if (!clearWarnTarget) { api.sendMessage("❌ منشن شخصاً", threadID, messageID); }
else {
  await ensureUser(clearWarnTarget);
  await updateUserData(clearWarnTarget, { warns: 0 });
  api.sendMessage(`✅ تم مسح تحذيرات ${clearWarnTarget}`, threadID, messageID);
}

// [أمر: إعلان / announce / نشرة]
const announceMsg = args.slice(1).join(" ");
if (!announceMsg) { api.sendMessage("❌ اكتب نص الإعلان", threadID, messageID); }
else {
  const announcement = `📢 ━━ إعلان رسمي ━━ 📢\n\n${announceMsg}\n\n━━━━━━━━━━━━━━━\n📅 ${new Date().toLocaleDateString("ar")}`;
  api.sendMessage(announcement, threadID, messageID);
}

// [أمر: تذكير / reminder / نذكر]
const reminderMin = parseInt(args[1]) || 5;
const reminderMsg = args.slice(2).join(" ") || "تذكير مهم!";
api.sendMessage(`⏰ سأذكرك بـ "${reminderMsg}" بعد ${reminderMin} دقيقة`, threadID, messageID);
setTimeout(() => api.sendMessage(`🔔 تذكير: ${reminderMsg}`, threadID, messageID), reminderMin * 60000);

// [أمر: استطلاع / poll / تصويت]
const pollQuestion = args.slice(1).join(" ");
if (!pollQuestion) { api.sendMessage("📊 اكتب سؤال الاستطلاع\nمثال: كينو استطلاع هل تحب الكروب؟", threadID, messageID); }
else {
  api.sendMessage(`📊 ━━ استطلاع ━━ 📊\n\n❓ ${pollQuestion}\n\n👍 موافق — تفاعل بـ ❤️\n👎 غير موافق — تفاعل بـ 😡`, threadID, messageID);
}

// [أمر: قواعد / rules / أحكام]
const rulesMsg = `📋 ━━ قواعد المجموعة ━━ 📋\n\n1️⃣ الاحترام المتبادل بين الجميع\n2️⃣ ممنوع الشتم والإهانة\n3️⃣ ممنوع إرسال محتوى مسيء\n4️⃣ ممنوع الإزعاج والسبام\n5️⃣ اتباع تعليمات الإدارة\n\n⚠️ مخالفة القواعد = تحذير ثم طرد`;
api.sendMessage(rulesMsg, threadID, messageID);

// [أمر: ترحيب / welcome / مرحباً]
const welcomeTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const welcomeMsg = welcomeTarget
  ? `🎉 أهلاً وسهلاً بـ ${welcomeTarget} في مجموعتنا!\n\nنتمنى لك وقتاً ممتعاً 🌟`
  : `🎉 أهلاً بالجميع في مجموعتنا!\n\nنتمنى لكم وقتاً ممتعاً 🌟`;
api.sendMessage(welcomeMsg, threadID, messageID);

// [أمر: توديع / farewell / وداع]
const farewellTarget = Object.keys(mentions)[0] || messageReply?.senderID;
api.sendMessage(`👋 وداعاً ${farewellTarget || "للجميع"}!\n\nشكراً لوجودك معنا، أتمنى أن نلتقي مجدداً 🌟`, threadID, messageID);

══════════════════════════════════════════
 ٩. الذكاء الاصطناعي والمعالجة — AI TOOLS
══════════════════════════════════════════

// [أمر: ترجم / translate / ترجمة]
const translateText = messageReply?.body || args.slice(1).join(" ");
const targetLang = args[1] || "en";
if (!translateText) { api.sendMessage("❌ رد على رسالة أو اكتب النص", threadID, messageID); }
else {
  const translateRes = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(translateText)}&langpair=ar|${targetLang}`);
  const translated = translateRes.data.responseData.translatedText;
  api.sendMessage(`🌍 الترجمة:\n\n${translated}`, threadID, messageID);
}

// [أمر: اختصار / shorten url / رابط قصير]
const urlToShorten = args[1] || messageReply?.body;
if (!urlToShorten || !urlToShorten.startsWith("http")) { api.sendMessage("❌ أعطِ رابطاً صحيحاً", threadID, messageID); }
else {
  try {
    const shortenRes = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(urlToShorten)}`);
    api.sendMessage(`🔗 الرابط المختصر:\n\n${shortenRes.data}`, threadID, messageID);
  } catch(e) {
    api.sendMessage("❌ فشل اختصار الرابط", threadID, messageID);
  }
}

// [أمر: طقس / weather / جو]
const city = args.slice(1).join(" ") || "بغداد";
try {
  const weatherRes = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=3&lang=ar`);
  api.sendMessage(`🌤️ حالة الطقس في ${city}:\n\n${weatherRes.data}`, threadID, messageID);
} catch(e) {
  api.sendMessage(`❌ لم يتم العثور على بيانات الطقس لـ ${city}`, threadID, messageID);
}

// [أمر: حاسبة / calculate / احسب]
const calcExpr = args.slice(1).join(" ").replace(/[^0-9+\-*/().% ]/g, "");
if (!calcExpr) { api.sendMessage("🧮 اكتب العملية الحسابية\nمثال: كينو احسب 150 * 3 + 50", threadID, messageID); }
else {
  try {
    const calcResult = eval(calcExpr);
    api.sendMessage(`🧮 الحساب:\n\n${calcExpr} = ${calcResult}`, threadID, messageID);
  } catch(e) {
    api.sendMessage("❌ عملية حسابية غير صحيحة", threadID, messageID);
  }
}

// [أمر: اسأل / ask / سؤال لـ AI]
const aiQuestion = args.slice(1).join(" ");
if (!aiQuestion) { api.sendMessage("❓ اكتب سؤالك\nمثال: كينو اسأل ما هو أعمق بحر في العالم؟", threadID, messageID); }
else {
  const aiAnswers = {
    "أعمق بحر": "🌊 أعمق بحر هو البحر الكاريبي بعمق 7686 متر",
    "أطول نهر": "🏞️ أطول نهر في العالم هو نهر النيل بطول 6650 كم",
    "أكبر دولة": "🗺️ أكبر دولة في العالم مساحةً هي روسيا",
    "عاصمة العراق": "🏛️ عاصمة العراق هي بغداد",
    "عاصمة السعودية": "🏛️ عاصمة السعودية هي الرياض"
  };
  const foundAnswer = Object.entries(aiAnswers).find(([k]) => aiQuestion.includes(k));
  if (foundAnswer) {
    api.sendMessage(`💡 ${foundAnswer[1]}`, threadID, messageID);
  } else {
    api.sendMessage(`💡 سؤالك: ${aiQuestion}\n\nهذا سؤال جيد! للحصول على إجابة دقيقة، جرب البحث في Google 😊`, threadID, messageID);
  }
}

// [أمر: عداد / counter / count]
await ensureUser(senderID);
const countData = await getUserData(senderID);
const currentCount = (countData?.currency?.counter ?? 0) + 1;
await updateUserData(senderID, { counter: currentCount });
api.sendMessage(`🔢 عدادك: ${currentCount}`, threadID, messageID);

// [أمر: إحصائيات / stats / statistics]
const allUsersStats = await getAllUsers();
const totalMoney = allUsersStats.reduce((s,u) => s + (u.money??0), 0);
const richest = allUsersStats.sort((a,b) => (b.money??0)-(a.money??0))[0];
const infoStats = await api.getThreadInfo(threadID);
const statsMsg = `📊 ━━ إحصائيات الكروب ━━ 📊\n\n👥 الأعضاء: ${infoStats.participantIDs.length}\n👑 الأدمنز: ${infoStats.adminIDs.length}\n💰 إجمالي الأموال: ${totalMoney.toLocaleString()} $\n🏆 الأغنى: ${richest?.userID || "لا يوجد"} (${(richest?.money||0).toLocaleString()} $)\n👤 إجمالي المستخدمين: ${allUsersStats.length}`;
api.sendMessage(statsMsg, threadID, messageID);

══════════════════════════════════════════
 ١٠. أوامر متنوعة ومضحكة — FUN COMMANDS
══════════════════════════════════════════

// [أمر: عناق / hug / ضم]
const hugTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const hugEmojis = ["🤗","💞","🫂","❤️","💕"];
const hugEmoji2 = hugEmojis[Math.floor(Math.random() * hugEmojis.length)];
api.sendMessage(`${hugEmoji2} ${senderID} يعانق ${hugTarget || "الجميع"} ${hugEmoji2}`, threadID, messageID);

// [أمر: قبلة / kiss / بوسة]
const kissTarget = Object.keys(mentions)[0] || messageReply?.senderID;
api.sendMessage(`💋 ${senderID} يرسل بوسة لـ ${kissTarget || "الجميع"} 😘`, threadID, messageID);

// [أمر: ضرب / hit / اضرب]
const hitTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const hitEmojis = ["👊","🥊","🔨","⚡","🌪️"];
const hitEmoji2 = hitEmojis[Math.floor(Math.random() * hitEmojis.length)];
api.sendMessage(`${hitEmoji2} ${senderID} ضرب ${hitTarget || "الهواء"} ${hitEmoji2}\n\n(بالمزاح فقط 😂)`, threadID, messageID);

// [أمر: دغدغة / tickle / ضحك]
const tickleTarget = Object.keys(mentions)[0] || messageReply?.senderID;
api.sendMessage(`🤣 ${senderID} دغدغ ${tickleTarget || "الجميع"}\nهاهاهاها! 😂😂😂`, threadID, messageID);

// [أمر: بكاء / cry / أبكي]
const cryTarget = Object.keys(mentions)[0] || messageReply?.senderID;
api.sendMessage(`😭 ${senderID} يبكي على ${cryTarget || "الجميع"}\n\n😢💧💧💧`, threadID, messageID);

// [أمر: صفعة / slap / اصفع]
const slapTarget = Object.keys(mentions)[0] || messageReply?.senderID;
api.sendMessage(`👋 SLAP!\n${senderID} صفع ${slapTarget || "الجواء"} صفعة قوية! 😂\n\n(بالمزاح 😄)`, threadID, messageID);

// [أمر: اضحك / laugh / lol]
const laughEmojis = ["😂","🤣","😹","😆","🤦","💀"];
let laughLine = "";
for (let i = 0; i < 10; i++) laughLine += laughEmojis[Math.floor(Math.random() * laughEmojis.length)];
api.sendMessage(`${laughLine}\n\nهاهاهاهاهاهاها 😂😂😂`, threadID, messageID);

// [أمر: رقص / dance]
const dances = ["💃🕺","🎵💃","🕺🎶","✨💃✨","🎊🕺🎊"];
api.sendMessage(`${dances[Math.floor(Math.random() * dances.length)]} ${senderID} يرقص!\n\n🎵🎶 على أنغام الموسيقى 🎶🎵`, threadID, messageID);

// [أمر: آه / sigh / تنهيدة]
api.sendMessage(`😮‍💨 آهههههههه...\n${senderID} يتنهّد عميقاً...\n\n💭 الحياة صعبة أحياناً 😅`, threadID, messageID);

// [أمر: هاجس / confession / اعتراف]
const confessions = [
  "أحياناً أتحدث مع نفسي بصوت عالٍ 🤫",
  "أتظاهر أنني نائم لتجنب الحديث 😅",
  "أحياناً أحسب نفسي الأذكى في الغرفة 🤭",
  "أنسى الكلام الذي أريد قوله فجأة 😤",
  "أحياناً أضحك على نكتة لم أفهمها 😂"
];
api.sendMessage(`🤫 اعتراف عشوائي:\n\n"${confessions[Math.floor(Math.random() * confessions.length)]}"`, threadID, messageID);

// [أمر: عشوائي / random / اختيار]
const randomOptions = args.slice(1).join(" ").split(/[,،|]/);
if (randomOptions.length < 2) { api.sendMessage("🎲 أعطِ خيارين أو أكثر مفصولة بفاصلة\nمثال: كينو عشوائي فستان، بدلة، جينز", threadID, messageID); }
else {
  const chosen = randomOptions[Math.floor(Math.random() * randomOptions.length)].trim();
  api.sendMessage(`🎲 الاختيار العشوائي:\n\n✅ ${chosen}`, threadID, messageID);
}

// [أمر: تحدي / challenge]
const challenges = [
  "تحدي: قل 5 أشياء تحبها في نفسك! 💪",
  "تحدي: اكتب أطول رسالة ممكنة خلال 30 ثانية! ⏱️",
  "تحدي: غير اسمك في المجموعة لـ 10 دقائق! 😄",
  "تحدي: أرسل صورة لأضحك شيء تراه حولك! 📸",
  "تحدي: قل جملة فيها حرف الضاد 5 مرات! 🗣️"
];
api.sendMessage(`🎯 ${challenges[Math.floor(Math.random() * challenges.length)]}`, threadID, messageID);

// [أمر: سبام / spam / تكرار]
const spamText = args.slice(2).join(" ") || "🔥";
const spamCount = Math.min(parseInt(args[1]) || 5, 10);
for (let i = 0; i < spamCount; i++) {
  await new Promise(r => setTimeout(r, 500));
  api.sendMessage(spamText, threadID, messageID);
}

// [أمر: عد / countdown / تنازلي]
const countFrom = Math.min(parseInt(args[1]) || 5, 10);
for (let i = countFrom; i >= 0; i--) {
  await new Promise(r => setTimeout(r, 1000));
  api.sendMessage(i === 0 ? "🚀 انطلق!" : `${i}...`, threadID, messageID);
}

// [أمر: ترتيب عشوائي / shuffle / خلط]
const infoShuffle = await api.getThreadInfo(threadID);
const shuffled = [...infoShuffle.participantIDs].sort(() => Math.random() - 0.5);
let shuffleMsg = `🎲 الترتيب العشوائي للأعضاء:\n\n`;
shuffled.forEach((uid, i) => { shuffleMsg += `${i + 1}. ${uid}\n`; });
api.sendMessage(shuffleMsg, threadID, messageID);

// [أمر: اختر عضو / pick random / random member]
const infoPickRandom = await api.getThreadInfo(threadID);
const randomMember = infoPickRandom.participantIDs[Math.floor(Math.random() * infoPickRandom.participantIDs.length)];
api.sendMessage(`🎯 العضو المختار عشوائياً:\n\n👤 ${randomMember}\n\n(اختيار عشوائي 100% 🎲)`, threadID, messageID);

══════════════════════════════════════════
 ١١. الحماية والأمان — PROTECTION
══════════════════════════════════════════

// [أمر: مراقبة / monitor / watch]
const infoMonitor = await api.getThreadInfo(threadID);
const monitorMsg = `🔍 ━━ تقرير الأمان ━━ 🔍\n\n✅ البوت يراقب المجموعة\n👥 الأعضاء: ${infoMonitor.participantIDs.length}\n👑 الأدمنز: ${infoMonitor.adminIDs.length}\n🛡️ وضع الحماية: نشط`;
api.sendMessage(monitorMsg, threadID, messageID);

// [أمر: قائمة الحظر / banlist / محظورين]
api.sendMessage(`🚫 قائمة المحظورين:\n\n(لا يوجد نظام حظر مدمج في Messenger — يتم الطرد مباشرة)\n\nللحظر: كينو احظر @المستخدم`, threadID, messageID);

// [أمر: تحقق / verify / حساب حقيقي]
const verifyTarget = Object.keys(mentions)[0] || messageReply?.senderID;
if (!verifyTarget) { api.sendMessage("❌ منشن شخصاً للتحقق منه", threadID, messageID); }
else {
  const verifyData = await getUserData(verifyTarget);
  const msgs = verifyData?.currency?.messageCount ?? 0;
  const lvl = verifyData?.currency?.level ?? 1;
  const trustScore = Math.min(msgs * 2 + lvl * 10, 100);
  api.sendMessage(`🔍 تحقق من ${verifyTarget}:\n\n💬 الرسائل: ${msgs}\n📊 المستوى: ${lvl}\n🛡️ نقاط الثقة: ${trustScore}/100\n${trustScore >= 70 ? "✅ حساب موثوق" : trustScore >= 40 ? "⚠️ حساب عادي" : "❗ حساب جديد"}`, threadID, messageID);
}

══════════════════════════════════════════
 ١٢. ميزات متقدمة — ADVANCED FEATURES
══════════════════════════════════════════

// [أمر: تلقائي / auto / وضع تلقائي]
const autoAction = args[1];
if (autoAction === "ترحيب") {
  global.autoWelcome = global.autoWelcome || {};
  global.autoWelcome[threadID] = !global.autoWelcome[threadID];
  api.sendMessage(`🤖 الترحيب التلقائي: ${global.autoWelcome[threadID] ? "✅ مفعّل" : "❌ مطفأ"}`, threadID, messageID);
} else {
  api.sendMessage("⚙️ الأوامر التلقائية:\n• كينو تلقائي ترحيب — ترحيب تلقائي بالأعضاء الجدد", threadID, messageID);
}

// [أمر: احتفال / celebrate / party]
const partyEmojis = ["🎉","🎊","🎈","🥳","🎆","🎇","✨","🎂","🍾","🥂"];
let partyMsg = "";
for (let i = 0; i < 20; i++) partyMsg += partyEmojis[Math.floor(Math.random() * partyEmojis.length)];
api.sendMessage(`${partyMsg}\n\n🥳 الاحتفال بدأ! ${partyMsg}`, threadID, messageID);

// [أمر: لعبة الذاكرة / memory game]
const memorySequence = Array.from({length: 5}, () => Math.floor(Math.random() * 9) + 1);
api.sendMessage(`🧠 لعبة الذاكرة!\n\nاحفظ هذا التسلسل:\n${memorySequence.join(" - ")}\n\nسيُحذف بعد 10 ثوانٍ!`, threadID, messageID);
setTimeout(async () => {
  api.sendMessage(`❓ ما كان التسلسل؟ أرسل الأرقام مفصولة بمسافات!\nالإجابة الصحيحة: ${memorySequence.join(" ")}`, threadID, messageID);
}, 10000);

// [أمر: لعبة السرعة / speed game / من الأسرع]
const speedNum = Math.floor(Math.random() * 50) + 1;
api.sendMessage(`⚡ لعبة السرعة!\n\nأول من يكتب الرقم ${speedNum} يفوز بـ 500 $!`, threadID, messageID);

// [أمر: جائزة / prize / مكافأة خاصة]
const prizeTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const prizeAmount = parseInt(args.find(a => /^\d+$/.test(a))) || 1000;
const prizeReason = args.filter(a => !a.includes("@") && !/^\d+$/.test(a)).slice(1).join(" ") || "تميزه";
if (!prizeTarget) { api.sendMessage("❌ منشن شخصاً", threadID, messageID); }
else {
  await ensureUser(prizeTarget);
  await addMoney(prizeTarget, prizeAmount);
  api.sendMessage(`🏆 جائزة خاصة!\n\n🎖️ الفائز: ${prizeTarget}\n💰 المبلغ: ${prizeAmount.toLocaleString()} $\n📌 السبب: ${prizeReason}\n\nمبروك! 🎉`, threadID, messageID);
}

// [أمر: عقوبة / penalty / غرامة]
const penaltyTarget = Object.keys(mentions)[0] || messageReply?.senderID;
const penaltyAmount = parseInt(args.find(a => /^\d+$/.test(a))) || 500;
const penaltyReason = args.filter(a => !a.includes("@") && !/^\d+$/.test(a)).slice(1).join(" ") || "مخالفة";
if (!penaltyTarget) { api.sendMessage("❌ منشن شخصاً", threadID, messageID); }
else {
  await ensureUser(penaltyTarget);
  const penRes = await removeMoney(penaltyTarget, penaltyAmount);
  if (!penRes.success) api.sendMessage(`❌ رصيد ${penaltyTarget} غير كافٍ للغرامة`, threadID, messageID);
  else api.sendMessage(`⚖️ غرامة!\n\n👤 ${penaltyTarget}\n💸 المبلغ: ${penaltyAmount.toLocaleString()} $\n📌 السبب: ${penaltyReason}`, threadID, messageID);
}

// [أمر: مزاد / auction / بيع]
const auctionItem = args.slice(1, -1).join(" ") || "شيء مجهول";
const startingBid = parseInt(args[args.length - 1]) || 1000;
api.sendMessage(`🏛️ مزاد!\n\n🏷️ العنصر: ${auctionItem}\n💰 السعر الابتدائي: ${startingBid.toLocaleString()} $\n⏰ المزاد سيبدأ الآن!\n\nللمزايدة: كينو أزايد [مبلغ]`, threadID, messageID);

// [أمر: مهمة / mission / quest]
const missions = [
  { name: "أرسل 10 رسائل اليوم", reward: 500 },
  { name: "رحّب بعضو جديد", reward: 300 },
  { name: "العب 3 ألعاب", reward: 700 },
  { name: "اكسب 1000 $ من العمل", reward: 1000 }
];
const randomMission = missions[Math.floor(Math.random() * missions.length)];
api.sendMessage(`📋 مهمتك اليومية:\n\n🎯 ${randomMission.name}\n💰 المكافأة: ${randomMission.reward} $\n\nأنجز المهمة واكتب: كينو أنجزت المهمة`, threadID, messageID);

// [أمر: تحويل عملة / currency convert / تحويل]
const fromAmount = parseFloat(args[1]) || 1;
const fromCur = args[2]?.toUpperCase() || "USD";
const toCur = args[3]?.toUpperCase() || "IQD";
const rates = { "USD": 1, "IQD": 1480, "SAR": 3.75, "EUR": 0.92, "AED": 3.67, "KWD": 0.31, "EGP": 30.9 };
const toUSD = fromAmount / (rates[fromCur] || 1);
const toFinal = toUSD * (rates[toCur] || 1);
api.sendMessage(`💱 تحويل العملات:\n\n${fromAmount} ${fromCur} = ${toFinal.toFixed(2)} ${toCur}`, threadID, messageID);

`;

// ══════════════════════════════════════════
//   BUILD SYSTEM PROMPT
// ══════════════════════════════════════════
function buildSystemPrompt(ctx) {
  return `أنت KIRA AI — مساعد برمجي ذكي خبير في JavaScript لبوت Messenger.
مهمتك: تحليل الطلب وإنتاج كود JavaScript يُنفَّذ مباشرةً داخل دالة async.

━━━ السياق الحالي ━━━
threadID    : ${ctx.threadID}
senderID    : ${ctx.senderID}
mentions    : ${JSON.stringify(ctx.mentions)}
messageReply: ${ctx.messageReply ? JSON.stringify({ senderID: ctx.messageReply.senderID, body: ctx.messageReply.body?.substring(0,100) }) : "null"}
args        : ${JSON.stringify(ctx.args)}

━━━ المتغيرات المتاحة مباشرة ━━━
api, event, args, mentions, threadID, messageID, senderID, messageReply
getUserData, addMoney, removeMoney, ensureUser, updateUserData, getAllUsers, axios

${KNOWLEDGE_BASE}

━━━ قواعد صارمة ━━━
1. أرجع كود JavaScript نظيف فقط — بدون أي شرح أو markdown أو backticks
2. استخدم المتغيرات والدوال الموضحة فقط
3. استخدم await للعمليات async
4. أضف تحقق من الأخطاء ورسائل واضحة بالعربي
5. إذا الطلب غير واضح أرسل رسالة تسأل عن التفاصيل
6. لا تستخدم require() لمكتبات غير موجودة في السياق
7. الكود يجب أن يكون مختصراً وفعالاً
8. اعتمد على قاعدة المعرفة لفهم الأوامر بالعربية العامية
9. إذا الطلب فيه منشن، استخدم Object.keys(mentions)[0]
10. إذا الطلب فيه رد على رسالة، استخدم messageReply?.senderID`;
}

// ══════════════════════════════════════════
//   GROQ CALL
// ══════════════════════════════════════════
async function callGroq(systemPrompt, userMessage) {
  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage  }
      ],
      max_tokens: 2048,
      temperature: 0.1
    },
    {
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      timeout: 30000
    }
  );
  return res.data.choices[0].message.content.trim();
}

function cleanCode(raw) {
  return raw
    .replace(/^```(?:javascript|js)?\n?/i, "")
    .replace(/\n?```$/, "")
    .trim();
}

// ══════════════════════════════════════════
//   SAFE EVAL
// ══════════════════════════════════════════
async function safeEval(code, ctx) {
  const AsyncFn = Object.getPrototypeOf(async function(){}).constructor;
  const fn = new AsyncFn(
    "api","event","args","mentions","threadID","messageID",
    "senderID","messageReply","getUserData","addMoney","removeMoney",
    "ensureUser","updateUserData","getAllUsers","axios","global",
    code
  );
  return await fn(
    ctx.api, ctx.event, ctx.args, ctx.mentions,
    ctx.threadID, ctx.messageID, ctx.senderID, ctx.messageReply,
    getUserData, addMoney, removeMoney, ensureUser, updateUserData,
    getAllUsers, axios, global
  );
}

// ══════════════════════════════════════════
//   DB HELPERS — GitHub JSON
// ══════════════════════════════════════════
const saveCmd = async (name, code, prompt, cat, by) => {
  const cmds = await _getCmds();
  cmds[name] = { name, code, prompt: prompt||"", category: cat||"عام", createdBy: by||"",
    usageCount: cmds[name]?.usageCount || 0,
    createdAt: cmds[name]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString() };
  if (!db._cache[CMDS_FILE]) db._cache[CMDS_FILE] = { data: cmds, sha: null };
  else db._cache[CMDS_FILE].data = cmds;
  await _saveCmds();
  return cmds[name];
};
const loadCmd   = async (name) => { const c = await _getCmds(); return c[name] || null; };
const listCmds  = async ()     => { const c = await _getCmds(); return Object.values(c).sort((a,b)=>(b.usageCount||0)-(a.usageCount||0)); };
const deleteCmd = async (name) => { const c = await _getCmds(); if(!c[name]) return {deletedCount:0}; delete c[name]; if(db._cache[CMDS_FILE]) db._cache[CMDS_FILE].data=c; await _saveCmds(); return {deletedCount:1}; };
const deleteAll = async ()     => { const c = await _getCmds(); const n=Object.keys(c).length; if(db._cache[CMDS_FILE]) db._cache[CMDS_FILE].data={}; await _saveCmds(); return {deletedCount:n}; };
const incUsage  = async (name) => { const c = await _getCmds(); if(c[name]){c[name].usageCount=(c[name].usageCount||0)+1; if(db._cache[CMDS_FILE]) db._cache[CMDS_FILE].data=c;} };

// ══════════════════════════════════════════
//   FORMAT COMMANDS LIST
// ══════════════════════════════════════════
async function formatCommandsList(threadID, messageID, api) {
  const cmds = await listCmds();
  if (!cmds.length) {
    return api.sendMessage("📭 لا توجد أوامر محفوظة بعد.\n\nلحفظ أمر: كينو [طلب] احفظ باسم [الاسم]", threadID, messageID);
  }

  const byCategory = {};
  for (const c of cmds) {
    const cat = c.category || "عام";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(c);
  }

  let msg = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗜 𝗕𝗔𝗡𝗞 ━━ ⌬\n\n";
  msg += `📦 إجمالي الأوامر: ${cmds.length}\n\n`;

  for (const [cat, list] of Object.entries(byCategory)) {
    msg += `━━ ${cat} (${list.length}) ━━\n`;
    list.forEach((c, i) => {
      msg += `${i+1}. ${c.name}`;
      if (c.usageCount > 0) msg += ` [${c.usageCount}x]`;
      msg += `\n`;
    });
    msg += "\n";
  }

  msg += "━━━━━━━━━━━━━━━━━━━━\n";
  msg += "💡 لحذف أمر: كينو احذف أمر [الاسم]\n";
  msg += "🗑️ لحذف الكل: كينو احذف كل الأوامر\n";
  msg += "▶️ لتشغيل أمر: كينو شغل [الاسم]\n";
  msg += "📄 لعرض كود أمر: كينو كود [الاسم]";

  return api.sendMessage(msg, threadID, messageID);
}

// ══════════════════════════════════════════
//   RUN
// ══════════════════════════════════════════
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  // ── تحقق من الأدمن ──
  if (!global.config?.ADMINBOT?.includes(senderID))
    return api.sendMessage("⛔ هذا الأمر للأدمن فقط", threadID, messageID);

  const prompt = args.join(" ").trim();

  if (!prompt) {
    return api.sendMessage(
      "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗜 𝗨𝗟𝗧𝗥𝗔 𝗣𝗥𝗢 ━━ ⌬\n\n💡 اكتب أي طلب بالعربي:\n\n🏠 إدارة: اطرد | رقّ | قفل | فتح | غير اسم\n💰 اقتصاد: رصيدي | عمل | يومي | سرق | حول\n🎮 ألعاب: روليت | سلوت | نرد | بلاك جاك\n🎭 ترفيه: نكتة | شعر | حكمة | طالعك\n\nكينو مساعدة — للقائمة الكاملة",
      threadID, messageID
    );
  }

  // ══ أوامر نظام خاصة ══════════════════════

  if (prompt === "بياناتك" || prompt === "قائمة" || prompt === "قائمة الأوامر") {
    return formatCommandsList(threadID, messageID, api);
  }

  if (/^احذف\s+(?:أمر|امر)\s+/i.test(prompt)) {
    const name = prompt.replace(/^احذف\s+(?:أمر|امر)\s+/i, "").trim();
    const res = await deleteCmd(name);
    return api.sendMessage(
      res.deletedCount ? `🗑️ تم حذف الأمر: "${name}"` : `❌ الأمر "${name}" غير موجود`,
      threadID, messageID
    );
  }

  if (prompt === "احذف كل الأوامر" || prompt === "مسح كل الأوامر") {
    const res = await deleteAll();
    return api.sendMessage(`🗑️ تم حذف ${res.deletedCount} أمر`, threadID, messageID);
  }

  if (/^شغ[ّ]?ل\s+/i.test(prompt)) {
    const name = prompt.replace(/^شغ[ّ]?ل\s+/i, "").trim();
    const saved = await loadCmd(name);
    if (!saved) return api.sendMessage(`❌ الأمر "${name}" غير موجود`, threadID, messageID);
    await incUsage(name);
    if (api.setMessageReaction) api.setMessageReaction("▶️", messageID, () => {}, true);
    try {
      await safeEval(saved.code, { api, event, args: args.slice(1), mentions, threadID, messageID, senderID, messageReply });
      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
    } catch(e) {
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`❌ خطأ في "${name}":\n${e.message}`, threadID, messageID);
    }
    return;
  }

  if (/^كود\s+/i.test(prompt)) {
    const name = prompt.replace(/^كود\s+/i, "").trim();
    const saved = await loadCmd(name);
    if (!saved) return api.sendMessage(`❌ الأمر "${name}" غير موجود`, threadID, messageID);
    return api.sendMessage(
      `📄 كود الأمر "${name}":\n━━━━━━━━━━\n${saved.code.substring(0, 1000)}`,
      threadID, messageID
    );
  }

  // ══ الذكاء الاصطناعي ══════════════════════
  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    const ctx = { threadID, messageID, senderID, messageReply, mentions: mentions||{}, args };
    const systemPrompt = buildSystemPrompt(ctx);
    const rawCode = await callGroq(systemPrompt, prompt);
    const code = cleanCode(rawCode);

    let savedName = null;
    if (/احفظ|اخزن/i.test(prompt)) {
      const nameMatch = prompt.match(/(?:احفظ|اخزن)(?:\s+باسم)?\s+(\S+)/i);
      const catMatch  = prompt.match(/(?:فئة|كتيجوري|category)\s+(\S+)/i);
      savedName = nameMatch ? nameMatch[1] : `auto_${Date.now()}`;
      const category = catMatch ? catMatch[1] : "عام";
      await saveCmd(savedName, code, prompt, category, senderID);
    }

    await safeEval(code, { api, event, args, mentions: mentions||{}, threadID, messageID, senderID, messageReply });

    if (savedName)
      api.sendMessage(`💾 تم حفظ الأمر باسم: "${savedName}"\nلتشغيله: كينو شغل ${savedName}`, threadID, messageID);

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("❌ KIRA AI:", e);
    api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗜 ━━ ⌬\n\n❌ خطأ:\n${e.message}\n\n💡 أعد صياغة الطلب`,
      threadID, messageID
    );
  }
};
