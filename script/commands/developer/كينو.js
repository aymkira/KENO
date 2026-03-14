
// ══════════════════════════════════════════════════════════════
//   KIRA AI — ULTRA PRO MAX
//   200+ دالة — يفهم العربي — ينفذ أي أمر
// ══════════════════════════════════════════════════════════════
const axios    = require("axios");
const path     = require("path");
const mongoose = require("mongoose");
const { getUserData, addMoney, removeMoney, ensureUser, updateUserData, getAllUsers } = require(
  path.join(process.cwd(), "includes", "mongodb.js")
);

module.exports.config = {
  name: "كينو",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "Ayman",
  description: "المساعد الذكي الكامل ULTRA — 200+ دالة",
  commandCategory: "developer",
  usages: "كينو [أي طلب بالعربي]",
  cooldowns: 2
};

const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_GROQ_KEY_HERE";
const GROQ_MODEL   = "llama-3.3-70b-versatile";

// ══════════════════════════════════════════
//   MONGODB SCHEMA
// ══════════════════════════════════════════
const dynamicCmdSchema = new mongoose.Schema({
  name:      { type: String, required: true, unique: true },
  code:      { type: String, required: true },
  prompt:    { type: String, default: "" },
  category:  { type: String, default: "عام" },
  usageCount:{ type: Number, default: 0 },
  createdBy: { type: String, default: "" },
  createdAt: { type: Date,   default: Date.now },
  updatedAt: { type: Date,   default: Date.now }
});
const DynamicCmd = mongoose.models.DynamicCmd || mongoose.model("DynamicCmd", dynamicCmdSchema);

// ══════════════════════════════════════════
//   KNOWLEDGE BASE — 200+ دالة وأمر
// ══════════════════════════════════════════
const KNOWLEDGE_BASE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 قاعدة المعرفة الكاملة — 200+ دالة وأمر
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

══════════════════════════════
 ١. إدارة المجموعة الكاملة
══════════════════════════════
// طرد مستخدم
await api.removeUserFromGroup(userID, threadID);

// إضافة مستخدم
await api.addUserToGroup(userID, threadID);

// ترقية لأدمن
await api.changeAdminStatus(threadID, userID, true);

// إزالة من الأدمن
await api.changeAdminStatus(threadID, userID, false);

// تغيير اسم المجموعة
await api.changeThreadName("الاسم الجديد", threadID);

// تغيير إيموجي المجموعة
await api.changeThreadEmoji("🔥", threadID);

// تغيير لون المحادثة
await api.changeThreadColor("#FF0000", threadID);

// تغيير لقب مستخدم
await api.changeNickname("اللقب", threadID, userID);

// كتم المجموعة (بالثواني، -1 = دائمي)
await api.muteThread(threadID, -1);

// رفع الكتم
await api.muteThread(threadID, 0);

// الحصول على قائمة أعضاء المجموعة
const info = await api.getThreadInfo(threadID);
const members = info.participantIDs;
const admins  = info.adminIDs.map(a => a.id);

// طرد كل الأعضاء ما عدا الأدمنز
const info2 = await api.getThreadInfo(threadID);
const adminIDs = info2.adminIDs.map(a => a.id);
for (const uid of info2.participantIDs) {
  if (!adminIDs.includes(uid) && uid !== api.getCurrentUserID())
    await api.removeUserFromGroup(uid, threadID);
}

// إضافة قائمة مستخدمين دفعة واحدة
const toAdd = ["111", "222", "333"];
for (const uid of toAdd) await api.addUserToGroup(uid, threadID);

// ترقية كل الأعضاء لأدمن
const info3 = await api.getThreadInfo(threadID);
for (const uid of info3.participantIDs)
  await api.changeAdminStatus(threadID, uid, true);

// إزالة كل الأدمنز
const info4 = await api.getThreadInfo(threadID);
for (const ad of info4.adminIDs)
  await api.changeAdminStatus(threadID, ad.id, false);

// عدد الأعضاء
const info5 = await api.getThreadInfo(threadID);
api.sendMessage("👥 عدد الأعضاء: " + info5.participantIDs.length, threadID, messageID);

// اسم المجموعة
const info6 = await api.getThreadInfo(threadID);
api.sendMessage("📛 اسم المجموعة: " + info6.threadName, threadID, messageID);

// تغيير شعار المجموعة (من رابط)
const axios2 = require("axios");
const resImg = await axios2.get("رابط_الصورة", { responseType: "stream" });
await api.changeGroupImage(resImg.data, threadID);

// قفل المجموعة (فقط الأدمنز يكتبون) عبر كتم الكل
// ليس مدعوماً مباشرة — نستخدم muteThread

══════════════════════════════
 ٢. إدارة الرسائل
══════════════════════════════
// إرسال نص عادي
api.sendMessage("نص", threadID);

// إرسال مع رد على رسالة
api.sendMessage({ body: "نص" }, threadID, () => {}, messageID);

// حذف رسالة
await api.unsendMessage(messageID);

// تفاعل على رسالة
api.setMessageReaction("❤️", messageID, () => {}, true);

// إزالة تفاعل
api.setMessageReaction("", messageID, () => {}, true);

// إرسال لجميع الأعضاء (DM)
const info7 = await api.getThreadInfo(threadID);
for (const uid of info7.participantIDs)
  api.sendMessage("رسالة خاصة", uid);

// إرسال رسالة لمجموعات متعددة
const threads = await api.getThreadList(50, null, ["INBOX"]);
for (const t of threads) api.sendMessage("رسالة للكل", t.threadID);

// إرسال رسالة مؤجلة (بعد 5 ثواني)
setTimeout(() => api.sendMessage("رسالة مؤجلة", threadID), 5000);

// رد تلقائي متكرر (كل دقيقة)
setInterval(() => api.sendMessage("🔄 تذكير تلقائي", threadID), 60000);

// تحويل رسالة
await api.forwardMessage(event.messageReply?.messageID, threadID);

// إرسال صورة من رابط
const axiosImg = require("axios");
const resI = await axiosImg.get("رابط_الصورة", { responseType: "stream" });
api.sendMessage({ attachment: resI.data }, threadID, () => {}, messageID);

// إرسال ملف صوتي
const resAudio = await axiosImg.get("رابط_الصوت", { responseType: "stream" });
api.sendMessage({ attachment: resAudio.data }, threadID);

══════════════════════════════
 ٣. الاقتصاد الكامل
══════════════════════════════
// جلب بيانات مستخدم
const data = await getUserData(userID);
const money   = data?.currency?.money ?? 0;
const exp     = data?.currency?.exp ?? 0;
const level   = data?.currency?.level ?? 1;
const rank    = data?.currency?.rank ?? "مبتدئ";
const msgCount= data?.currency?.messageCount ?? 0;
const progress= data?.calculated?.progress ?? 0;

// إضافة فلوس
await addMoney(userID, 1000);

// سحب فلوس
const result = await removeMoney(userID, 500);
if (!result.success) api.sendMessage("❌ رصيد غير كافٍ", threadID);

// تعيين رصيد محدد
const curData = await getUserData(userID);
const cur = curData?.currency?.money ?? 0;
if (1000 > cur) await addMoney(userID, 1000 - cur);
else await removeMoney(userID, cur - 1000);

// إضافة XP
await updateUserData(userID, { exp: (data?.currency?.exp ?? 0) + 500 });

// تغيير الرتبة
await updateUserData(userID, { rank: "أسطورة" });

// تغيير المستوى
await updateUserData(userID, { level: 50 });

// ريست الاقتصاد
await updateUserData(userID, { money: 0, exp: 0, level: 1, rank: "مبتدئ" });

// إعطاء كل الأعضاء فلوس
const infoE = await api.getThreadInfo(threadID);
for (const uid of infoE.participantIDs) {
  await ensureUser(uid);
  await addMoney(uid, 500);
}
api.sendMessage("✅ تم إعطاء كل الأعضاء 500 $", threadID, messageID);

// سلب فلوس المنشن وإعطاءها للمرسل
const t1 = Object.keys(mentions)[0];
const d1 = await getUserData(t1);
const stolen = Math.floor((d1?.currency?.money ?? 0) * 0.1);
await removeMoney(t1, stolen);
await addMoney(senderID, stolen);
api.sendMessage(\`💰 سرقت \${stolen} $ من المستخدم\`, threadID, messageID);

// ترتيب المستخدمين بالفلوس
const allU = await getAllUsers();
const sorted = allU.sort((a,b) => (b.money??0) - (a.money??0)).slice(0,10);
let board = "🏆 لوحة الأثرياء:\n\n";
sorted.forEach((u,i) => { board += \`\${i+1}. \${u.userID}: \${u.money??0} $\n\`; });
api.sendMessage(board, threadID, messageID);

// مضاعفة فلوس المنشن
const t2 = Object.keys(mentions)[0];
const d2 = await getUserData(t2);
const cur2 = d2?.currency?.money ?? 0;
await addMoney(t2, cur2);
api.sendMessage(\`✅ تم مضاعفة رصيد المستخدم إلى \${cur2*2} $\`, threadID, messageID);

// تقسيم فلوس على كل الأعضاء
const totalPool = 10000;
const infoPool  = await api.getThreadInfo(threadID);
const share = Math.floor(totalPool / infoPool.participantIDs.length);
for (const uid of infoPool.participantIDs) {
  await ensureUser(uid);
  await addMoney(uid, share);
}
api.sendMessage(\`✅ تم توزيع \${share} $ على كل عضو\`, threadID, messageID);

══════════════════════════════
 ٤. نظام الحظر الكامل
══════════════════════════════
// حظر مستخدم
global.data.userBanned.set(userID, { reason: "سبب الحظر", date: Date.now() });

// رفع حظر مستخدم
global.data.userBanned.delete(userID);

// حظر مجموعة
global.data.threadBanned.set(threadID, { reason: "سبب", date: Date.now() });

// رفع حظر مجموعة
global.data.threadBanned.delete(threadID);

// حظر أمر في مجموعة
const cmdBanned = global.data.commandBanned.get(threadID) || [];
cmdBanned.push("اسم_الأمر");
global.data.commandBanned.set(threadID, cmdBanned);

// رفع حظر أمر في مجموعة
const cb = global.data.commandBanned.get(threadID) || [];
global.data.commandBanned.set(threadID, cb.filter(c => c !== "اسم_الأمر"));

// قائمة المحظورين
const banned = [...global.data.userBanned.entries()];
let banList = "🚫 قائمة المحظورين:\n\n";
banned.forEach(([id, info]) => { banList += \`• \${id}: \${info.reason}\n\`; });
api.sendMessage(banList || "✅ لا يوجد محظورون", threadID, messageID);

// حظر كل الأعضاء ما عدا الأدمن
const infoBan = await api.getThreadInfo(threadID);
const adminsBan = infoBan.adminIDs.map(a => a.id);
for (const uid of infoBan.participantIDs) {
  if (!adminsBan.includes(uid) && !global.config.ADMINBOT.includes(uid))
    global.data.userBanned.set(uid, { reason: "حظر جماعي" });
}

// رفع كل الحظر
global.data.userBanned.clear();
api.sendMessage("✅ تم رفع حظر الجميع", threadID, messageID);

══════════════════════════════
 ٥. معلومات وإحصائيات
══════════════════════════════
// معلومات مستخدم كاملة
const uInfo = await api.getUserInfo(userID);
const u = uInfo[userID];
api.sendMessage(\`👤 الاسم: \${u.name}\nالجنس: \${u.gender}\nالنوع: \${u.type}\`, threadID, messageID);

// معلومات المجموعة الكاملة
const tInfo = await api.getThreadInfo(threadID);
api.sendMessage(\`📌 اسم: \${tInfo.threadName}\n👥 أعضاء: \${tInfo.participantIDs.length}\n👑 أدمن: \${tInfo.adminIDs.length}\`, threadID, messageID);

// بيانات اقتصادية للمستخدم
const eData = await getUserData(senderID);
api.sendMessage(
  \`💰 رصيدك: \${eData?.currency?.money ?? 0} $\n⭐ XP: \${eData?.currency?.exp ?? 0}\nمستوى: \${eData?.currency?.level ?? 1}\nرتبة: \${eData?.currency?.rank ?? "مبتدئ"}\`,
  threadID, messageID
);

// عدد الأوامر الكلي
const cmdCount = global.client.commands.size;
api.sendMessage("🤖 عدد الأوامر: " + cmdCount, threadID, messageID);

// قائمة كل الأوامر
const cmdList = [...global.client.commands.keys()].join(", ");
api.sendMessage("📋 الأوامر:\n" + cmdList, threadID, messageID);

// معلومات النظام
const os = require("os");
api.sendMessage(
  \`⚙️ معلومات النظام:\nRAM: \${(os.freemem()/1024/1024).toFixed(0)} MB حر من \${(os.totalmem()/1024/1024).toFixed(0)} MB\nCPU: \${os.cpus()[0].model}\n\`,
  threadID, messageID
);

// وقت التشغيل
const uptime = process.uptime();
const h = Math.floor(uptime/3600), m = Math.floor((uptime%3600)/60), s = Math.floor(uptime%60);
api.sendMessage(\`⏱️ وقت التشغيل: \${h}h \${m}m \${s}s\`, threadID, messageID);

// إحصائيات المجموعة
const statsInfo = await api.getThreadInfo(threadID);
const allMembersData = await Promise.all(statsInfo.participantIDs.map(uid => getUserData(uid)));
const totalMoney = allMembersData.reduce((s, d) => s + (d?.currency?.money ?? 0), 0);
api.sendMessage(
  \`📊 إحصائيات المجموعة:\n👥 أعضاء: \${statsInfo.participantIDs.length}\n💰 مجموع الفلوس: \${totalMoney} $\`,
  threadID, messageID
);

══════════════════════════════
 ٦. أوامر ترفيهية وألعاب
══════════════════════════════
// نكتة عشوائية
const jokes = ["لماذا لا يلعب البرمجيون كرة القدم؟ لأنهم دائماً يتعاملون مع الـ bugs!", "ما الفرق بين البرمجي والبيتزا؟ البيتزا تطعم أسرة من 4 أشخاص!", "كيف تعرف إن برمجي يكذب؟ شفتاه تتحركان!"];
api.sendMessage("😄 " + jokes[Math.floor(Math.random() * jokes.length)], threadID, messageID);

// رقم عشوائي
const min = parseInt(args[0]) || 1;
const max = parseInt(args[1]) || 100;
api.sendMessage(\`🎲 الرقم العشوائي: \${Math.floor(Math.random()*(max-min+1))+min}\`, threadID, messageID);

// اختيار شخص عشوائي من المجموعة
const infoRand = await api.getThreadInfo(threadID);
const chosen = infoRand.participantIDs[Math.floor(Math.random()*infoRand.participantIDs.length)];
const chosenInfo = await api.getUserInfo(chosen);
api.sendMessage(\`🎯 الشخص المختار: @\${chosenInfo[chosen].name}\`, threadID, messageID);

// لعبة قفشة
const rand = Math.random();
const outcome = rand > 0.6 ? "فزت! 🏆" : rand > 0.3 ? "تعادل 🤝" : "خسرت 💀";
api.sendMessage("نتيجة القفشة: " + outcome, threadID, messageID);

// 8ball
const answers = ["نعم بالتأكيد ✅","لا أعتقد ❌","ربما 🤔","غير واضح 🌫️","بالتأكيد لا ❌","نعم! ✅"];
api.sendMessage("🎱 " + answers[Math.floor(Math.random()*answers.length)], threadID, messageID);

// عداد تنازلي
let count = 5;
const timer = setInterval(() => {
  if (count <= 0) { clearInterval(timer); return api.sendMessage("🚀 انطلاق!", threadID); }
  api.sendMessage(\`⏳ \${count--}\`, threadID);
}, 1000);

══════════════════════════════
 ٧. إدارة البوت والإعدادات
══════════════════════════════
// تغيير البادئة
global.config.PREFIX = ".";
api.sendMessage("✅ تم تغيير البادئة إلى: .", threadID, messageID);

// تفعيل وضع المطور
global.config.DeveloperMode = true;
api.sendMessage("✅ وضع المطور مفعّل", threadID, messageID);

// إيقاف البوت
api.sendMessage("⚠️ سيتوقف البوت في 3 ثواني...", threadID, messageID);
setTimeout(() => process.exit(0), 3000);

// إعادة تشغيل البوت
api.sendMessage("🔄 إعادة التشغيل...", threadID, messageID);
setTimeout(() => process.exit(1), 2000);

// تفعيل الوضع الصامت (adminOnly)
global.config.adminOnly = true;
api.sendMessage("🔇 البوت الآن في الوضع الصامت", threadID, messageID);

// إلغاء الوضع الصامت
global.config.adminOnly = false;
api.sendMessage("🔊 البوت الآن متاح للجميع", threadID, messageID);

// إضافة أدمن للبوت
global.config.ADMINBOT.push(userID);
api.sendMessage("✅ تمت إضافة أدمن للبوت", threadID, messageID);

// إزالة أدمن من البوت
global.config.ADMINBOT = global.config.ADMINBOT.filter(id => id !== userID);
api.sendMessage("✅ تمت إزالة الأدمن من البوت", threadID, messageID);

// قائمة أدمنز البوت
api.sendMessage("👑 أدمنز البوت:\n" + global.config.ADMINBOT.join("\n"), threadID, messageID);

══════════════════════════════
 ٨. الردود التلقائية
══════════════════════════════
// إضافة رد تلقائي
if (!global.data.autoReply) global.data.autoReply = new Map();
global.data.autoReply.set("مرحبا", "وعليكم السلام 👋");
api.sendMessage("✅ تم إضافة الرد التلقائي", threadID, messageID);

// حذف رد تلقائي
if (global.data.autoReply) global.data.autoReply.delete("مرحبا");
api.sendMessage("✅ تم حذف الرد التلقائي", threadID, messageID);

══════════════════════════════
 ٩. عمليات متقدمة
══════════════════════════════
// نسخ احتياطي لبيانات المجموعة
const backupInfo = await api.getThreadInfo(threadID);
const backup = JSON.stringify({ name: backupInfo.threadName, members: backupInfo.participantIDs, admins: backupInfo.adminIDs });
api.sendMessage("💾 نسخة احتياطية:\n" + backup.substring(0, 500), threadID, messageID);

// إرسال رسالة ترحيب مخصصة للأعضاء الجدد
const newMemberInfo = await api.getUserInfo(senderID);
api.sendMessage(\`🎉 مرحباً \${newMemberInfo[senderID].name} في المجموعة!\nنتمنى لك وقتاً ممتعاً 🌟\`, threadID);

// تنظيف الكاش
if (global.data.threadInfo) global.data.threadInfo.clear();
api.sendMessage("🧹 تم تنظيف الكاش", threadID, messageID);

// بث رسالة لكل المجموعات
const allThreads = await api.getThreadList(100, null, ["INBOX"]);
let sentCount = 0;
for (const t of allThreads) {
  try { api.sendMessage("📢 إعلان: " + args.join(" "), t.threadID); sentCount++; } catch(_) {}
}
api.sendMessage(\`✅ تم الإرسال لـ \${sentCount} مجموعة\`, threadID, messageID);

// تغيير ألوان عشوائية للمجموعة
const colors = ["#FF0000","#00FF00","#0000FF","#FF00FF","#FFFF00","#00FFFF"];
const randomColor = colors[Math.floor(Math.random()*colors.length)];
await api.changeThreadColor(randomColor, threadID);
api.sendMessage("🎨 تم تغيير اللون إلى " + randomColor, threadID, messageID);

// إرسال رسالة منسقة بالجدول
const tableData = [["الاسم","الفلوس","الرتبة"],["أيمن","5000","ملك"],["خالد","3000","أسطورة"]];
const table = tableData.map(row => row.join(" | ")).join("\n");
api.sendMessage("📊 الجدول:\n\n" + table, threadID, messageID);

// تشغيل أمر آخر برمجياً
const targetCmd = global.client.commands.get("اسم_الأمر");
if (targetCmd) await targetCmd.run({ api, event, args, mentions, threadID, messageID, senderID });

// فحص اتصال الإنترنت
try {
  await axios.get("https://www.google.com", { timeout: 5000 });
  api.sendMessage("✅ الاتصال بالإنترنت يعمل", threadID, messageID);
} catch { api.sendMessage("❌ لا يوجد اتصال", threadID, messageID); }

// حساب الوقت المنقضي منذ آخر رسالة
const lastMsg = event.timestamp;
const elapsed = Date.now() - lastMsg;
api.sendMessage(\`⏱️ منذ آخر رسالة: \${(elapsed/1000).toFixed(1)} ثانية\`, threadID, messageID);

══════════════════════════════
 ١٠. نماذج أوامر جاهزة كاملة
══════════════════════════════
// نموذج: طرد المنشن مع تأكيد
const kickTarget = Object.keys(mentions)[0];
if (!kickTarget) return api.sendMessage("❌ منشن شخصاً لطرده", threadID, messageID);
if (global.config.ADMINBOT.includes(kickTarget)) return api.sendMessage("❌ لا يمكن طرد أدمن البوت", threadID, messageID);
await api.removeUserFromGroup(kickTarget, threadID);
const kickInfo = await api.getUserInfo(kickTarget);
api.sendMessage(\`🚫 تم طرد \${kickInfo[kickTarget]?.name ?? kickTarget}\`, threadID, messageID);

// نموذج: باند مع طرد
const banTarget = Object.keys(mentions)[0];
if (!banTarget) return api.sendMessage("❌ منشن شخصاً", threadID, messageID);
global.data.userBanned.set(banTarget, { reason: args.slice(1).join(" ") || "بدون سبب", date: Date.now() });
await api.removeUserFromGroup(banTarget, threadID);
api.sendMessage(\`⛔ تم حظر وطرد المستخدم\`, threadID, messageID);

// نموذج: إعطاء فلوس مع رسالة
const giveTarget = Object.keys(mentions)[0];
const giveAmount = parseInt(args[0]) || 1000;
if (!giveTarget) return api.sendMessage("❌ منشن شخصاً", threadID, messageID);
await ensureUser(giveTarget);
await addMoney(giveTarget, giveAmount);
const giveInfo = await api.getUserInfo(giveTarget);
api.sendMessage(\`💰 تم إعطاء \${giveAmount} $ لـ \${giveInfo[giveTarget]?.name ?? giveTarget}\`, threadID, messageID);

// نموذج: بروفايل كامل
const profileTarget = Object.keys(mentions)[0] || senderID;
const profileData = await getUserData(profileTarget);
const profileInfo = await api.getUserInfo(profileTarget);
const pName = profileInfo[profileTarget]?.name ?? "مجهول";
api.sendMessage(
  \`👤 بروفايل: \${pName}\n━━━━━━━━━━━━\n💰 فلوس: \${profileData?.currency?.money ?? 0} $\n⭐ XP: \${profileData?.currency?.exp ?? 0}\n📊 مستوى: \${profileData?.currency?.level ?? 1}\n🏆 رتبة: \${profileData?.currency?.rank ?? "مبتدئ"}\n💬 رسائل: \${profileData?.currency?.messageCount ?? 0}\`,
  threadID, messageID
);

// نموذج: تحذير مع عداد
if (!global.data.warnings) global.data.warnings = new Map();
const warnTarget = Object.keys(mentions)[0];
if (!warnTarget) return api.sendMessage("❌ منشن شخصاً", threadID, messageID);
const warnKey = \`\${threadID}_\${warnTarget}\`;
const warnCount = (global.data.warnings.get(warnKey) || 0) + 1;
global.data.warnings.set(warnKey, warnCount);
if (warnCount >= 3) {
  await api.removeUserFromGroup(warnTarget, threadID);
  global.data.warnings.delete(warnKey);
  api.sendMessage(\`🚫 تم طرد المستخدم بعد \${warnCount} تحذيرات\`, threadID, messageID);
} else {
  api.sendMessage(\`⚠️ تحذير \${warnCount}/3 — المزيد سيؤدي للطرد\`, threadID, messageID);
}

// نموذج: لوحة ترتيب كاملة
const rankUsers = await getAllUsers();
const top10 = rankUsers.sort((a,b) => (b.money??0)-(a.money??0)).slice(0,10);
let leaderboard = "🏆 لوحة المتصدرين:\n━━━━━━━━━━━━\n";
const medals = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
top10.forEach((u,i) => { leaderboard += \`\${medals[i]} \${u.userID}: \${u.money??0} $\n\`; });
api.sendMessage(leaderboard, threadID, messageID);
`;

// ══════════════════════════════════════════
//   SYSTEM PROMPT
// ══════════════════════════════════════════
function buildSystemPrompt(ctx) {
  return `أنت KIRA AI — مساعد خارق داخل بوت فيسبوك ماسنجر.
مهمتك: فهم الطلب العربي وتوليد كود JavaScript ينفذه فوراً.

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
1. أرجع كود JavaScript نظيف فقط — بدون أي شرح أو markdown
2. استخدم المتغيرات والدوال الموضحة فقط
3. استخدم await للعمليات async
4. أضف تحقق من الأخطاء ورسائل واضحة بالعربي
5. إذا الطلب غير واضح أرسل رسالة تسأل عن التفاصيل
6. لا تستخدم require() لمكتبات غير موجودة في السياق
7. الكود يجب أن يكون مختصراً وفعالاً`;
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
      temperature: 0.15
    },
    {
      headers: { "Authorization": `Bearer ${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}`, "Content-Type": "application/json" },
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
//   DB HELPERS
// ══════════════════════════════════════════
const saveCmd   = (name, code, prompt, cat, by) =>
  DynamicCmd.findOneAndUpdate({ name }, { code, prompt, category: cat||"عام", createdBy: by, updatedAt: new Date() }, { upsert:true, new:true });

const loadCmd   = name  => DynamicCmd.findOne({ name });
const listCmds  = ()    => DynamicCmd.find({}, "name prompt category usageCount createdAt").sort({ usageCount:-1 });
const deleteCmd = name  => DynamicCmd.deleteOne({ name });
const deleteAll = ()    => DynamicCmd.deleteMany({});
const incUsage  = name  => DynamicCmd.updateOne({ name }, { $inc: { usageCount:1 } });

// ══════════════════════════════════════════
//   FORMAT COMMANDS LIST
// ══════════════════════════════════════════
async function formatCommandsList(threadID, messageID, api) {
  const cmds = await listCmds();
  if (!cmds.length) {
    return api.sendMessage("📭 لا توجد أوامر محفوظة بعد.\n\nلحفظ أمر: كينو [طلب] احفظ باسم [الاسم]", threadID, messageID);
  }

  // تقسيم حسب الفئة
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

  // سؤال عن الحذف
  msg += "\n\n🗑️ هل تود حذف أي أمر؟ اكتب:\nكينو احذف أمر [الاسم]";

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
      "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗜 𝗨𝗟𝗧𝗥𝗔 ━━ ⌬\n\n💡 اكتب أي طلب بالعربي:\n\nأمثلة:\n• كينو اطرد المنشن\n• كينو أعطِ المنشن 5000 فلوس\n• كينو رقّ المنشن لأدمن\n• كينو احظر المنشن\n• كينو بياناتك\n• كينو احذف أمر [اسم]\n• كينو شغل [اسم]\n• كينو كود [اسم]",
      threadID, messageID
    );
  }

  // ══ أوامر نظام خاصة ══════════════════════

  // بياناتك — عرض كل الأوامر المحفوظة
  if (prompt === "بياناتك" || prompt === "قائمة" || prompt === "قائمة الأوامر") {
    return formatCommandsList(threadID, messageID, api);
  }

  // احذف أمر
  if (/^احذف\s+أمر\s+/i.test(prompt) || /^احذف\s+امر\s+/i.test(prompt)) {
    const name = prompt.replace(/^احذف\s+(?:أمر|امر)\s+/i, "").trim();
    const res = await deleteCmd(name);
    return api.sendMessage(
      res.deletedCount ? `🗑️ تم حذف الأمر: "${name}"` : `❌ الأمر "${name}" غير موجود`,
      threadID, messageID
    );
  }

  // احذف كل الأوامر
  if (prompt === "احذف كل الأوامر" || prompt === "مسح كل الأوامر") {
    const res = await deleteAll();
    return api.sendMessage(`🗑️ تم حذف ${res.deletedCount} أمر`, threadID, messageID);
  }

  // شغل أمر
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

  // عرض كود أمر
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

    // حفظ تلقائي لو فيه "احفظ" أو "اخزن"
    let savedName = null;
    if (/احفظ|اخزن/i.test(prompt)) {
      const nameMatch = prompt.match(/(?:احفظ|اخزن)(?:\s+باسم)?\s+(\S+)/i);
      const catMatch  = prompt.match(/(?:فئة|كتيجوري|category)\s+(\S+)/i);
      savedName = nameMatch ? nameMatch[1] : `auto_${Date.now()}`;
      const category = catMatch ? catMatch[1] : "عام";
      await saveCmd(savedName, code, prompt, category, senderID);
    }

    // تنفيذ
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
