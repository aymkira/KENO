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
const ADMIN_IDS = (CFG.ADMINBOT || []).map(String);

function getDB() {
  try { return require(path.join(process.cwd(), 'includes', 'data.js')); }
  catch { return null; }
}

module.exports.config = {
  name: 'داتا',
  version: '1.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'إدارة نظام البيانات — GitHub JSON',
  commandCategory: 'developer',
  usages: `.داتا احصاء              ← إحصائيات كاملة
.داتا مستخدم @شخص       ← بيانات مستخدم
.داتا محفظة @شخص        ← محفظة مستخدم
.داتا حظر @شخص [سبب]    ← حظر
.داتا فتح @شخص           ← رفع حظر
.داتا محظورين            ← قائمة المحظورين
.داتا عدل @شخص | {JSON}  ← تعديل بيانات
.داتا حذف @شخص           ← حذف مستخدم
.داتا ملف [مسار]         ← قراءة ملف مخصص
.داتا رفع                ← حفظ كل شيء لـ GitHub
.داتا سجل                ← آخر الأحداث`,
  cooldowns: 3,
};

// ── handleReply — تعديل بعد القراءة ──────────────
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (senderID !== handleReply.author) return;

  const db = getDB();
  if (!db) return;

  const wait = await api.sendMessage('⏳ جاري الحفظ...', threadID);
  try {
    const newData = JSON.parse(body);

    if (handleReply.action === 'edit_user') {
      await db.setUser(handleReply.targetID, newData);
    } else if (handleReply.action === 'edit_file') {
      await db.writeCustomFile(handleReply.filePath, newData);
    }

    api.unsendMessage(wait.messageID);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم الحفظ على GitHub!`,
      threadID, messageID
    );
  } catch(e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ JSON غير صحيح:\n${e.message}`, threadID, messageID);
  }
};

// ══════════════════════════════════════════════════
module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply, body } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const db = getDB();
  if (!db) return api.sendMessage(
    '❌ ملف includes/data.js مو موجود!\nضعه في مجلد includes/', threadID, messageID
  );

  const sub = args[0]?.toLowerCase();

  // تحديد الهدف
  const mentionIDs = Object.keys(mentions || {});
  const getTarget  = () => {
    if (mentionIDs.length)                           return mentionIDs[0];
    if (type === 'message_reply' && messageReply)    return messageReply.senderID;
    const id = args[1];
    if (id && /^\d{10,}$/.test(id))                 return id;
    return null;
  };

  // ─ احصاء ────────────────────────────────────────
  if (!sub || sub === 'احصاء' || sub === 'stats') {
    const wait = await api.sendMessage('⏳...', threadID);
    const s    = await db.stats();
    api.unsendMessage(wait.messageID);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n📊 إحصائيات قاعدة البيانات\n━━━━━━━━━━━━━━\n👥 المستخدمون:  ${s.users}\n💰 المحافظ:     ${s.wallets}\n🚫 المحظورون:   ${s.activeBans}\n🏠 المجموعات:   ${s.threads}\n📁 ملفات مكاش:  ${s.cachedFiles}\n💾 بانتظار رفع: ${s.dirtyFiles}\n\n🗄️ GitHub: aymkira/data`,
      threadID, messageID
    );
  }

  // ─ مستخدم ───────────────────────────────────────
  if (sub === 'مستخدم' || sub === 'user') {
    const tid = getTarget();
    if (!tid) return api.sendMessage('📝 منشن أو ID', threadID, messageID);

    const wait = await api.sendMessage('⏳...', threadID);
    const user = await db.getUser(tid);
    api.unsendMessage(wait.messageID);

    if (!user) return api.sendMessage(`⚠️ ${tid} مو موجود في قاعدة البيانات`, threadID, messageID);

    const json   = JSON.stringify(user, null, 2);
    const preview = json.length > 1500 ? json.slice(0, 1500) + '\n...' : json;
    const sent   = await api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n👤 ${user.name || tid}\n━━━━━━━━━━\n${preview}\n\n✏️ رد بـ JSON معدّل للتعديل`,
      threadID, messageID
    );
    global.client?.handleReply?.push({
      name: module.exports.config.name, messageID: sent.messageID,
      author: senderID, action: 'edit_user', targetID: tid,
    });
    return;
  }

  // ─ محفظة ────────────────────────────────────────
  if (sub === 'محفظة' || sub === 'wallet') {
    const tid = getTarget();
    if (!tid) return api.sendMessage('📝 منشن أو ID', threadID, messageID);

    const wait   = await api.sendMessage('⏳...', threadID);
    const wallet = await db.getWallet(tid);
    api.unsendMessage(wait.messageID);

    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n💰 محفظة ${tid}\n━━━━━━━━━━\n💵 الرصيد:  ${wallet.money?.toLocaleString() || 0}\n🏦 البنك:   ${wallet.bank?.toLocaleString() || 0}\n⭐ XP:      ${wallet.exp || 0}\n📊 الليفل:  ${wallet.level || 1}\n🏅 الرتبة:  ${wallet.rankEmoji} ${wallet.rank || 'مبتدئ'}\n💎 المجموع: ${wallet.totalEarned?.toLocaleString() || 0}`,
      threadID, messageID
    );
  }

  // ─ حظر ──────────────────────────────────────────
  if (sub === 'حظر' || sub === 'ban') {
    const tid    = getTarget();
    if (!tid) return api.sendMessage('📝 منشن أو ID', threadID, messageID);

    const reason = args.slice(2).join(' ') || 'لا يوجد سبب';
    const wait   = await api.sendMessage('⏳...', threadID);
    await db.banUser(tid, reason, senderID);
    api.unsendMessage(wait.messageID);

    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n🚫 تم الحظر!\n🆔 ${tid}\n📋 ${reason}`,
      threadID, messageID
    );
  }

  // ─ فتح ──────────────────────────────────────────
  if (sub === 'فتح' || sub === 'unban') {
    const tid  = getTarget();
    if (!tid) return api.sendMessage('📝 منشن أو ID', threadID, messageID);

    const wait = await api.sendMessage('⏳...', threadID);
    const ok   = await db.unbanUser(tid, senderID);
    api.unsendMessage(wait.messageID);

    return api.sendMessage(
      ok ? `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم رفع الحظر عن ${tid}`
         : `⚠️ ${tid} مو محظور أصلاً`,
      threadID, messageID
    );
  }

  // ─ محظورين ──────────────────────────────────────
  if (sub === 'محظورين' || sub === 'bans') {
    const wait = await api.sendMessage('⏳...', threadID);
    const bans = await db.getAllBans();
    api.unsendMessage(wait.messageID);

    if (!bans.length) return api.sendMessage('✅ لا يوجد محظورون', threadID, messageID);
    const lines = bans.map((b, i) => `${i+1}. ${b.userID} — ${b.reason || '—'}`);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n🚫 المحظورون (${bans.length}):\n${lines.join('\n')}`,
      threadID, messageID
    );
  }

  // ─ عدل ──────────────────────────────────────────
  if (sub === 'عدل' || sub === 'edit') {
    const parts = (body || '').split('|');
    if (parts.length < 2) return api.sendMessage('📝 .داتا عدل @شخص | {"key":"val"}', threadID, messageID);

    const tid     = getTarget();
    if (!tid) return api.sendMessage('📝 منشن أو ID', threadID, messageID);

    const jsonStr = parts.slice(1).join('|').trim();
    const wait    = await api.sendMessage('⏳...', threadID);
    try {
      await db.setUser(tid, JSON.parse(jsonStr));
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`✅ تم تعديل ${tid}`, threadID, messageID);
    } catch(e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ JSON خاطئ: ${e.message}`, threadID, messageID);
    }
  }

  // ─ حذف ──────────────────────────────────────────
  if (sub === 'حذف' || sub === 'delete') {
    const tid  = getTarget();
    if (!tid) return api.sendMessage('📝 منشن أو ID', threadID, messageID);

    const wait = await api.sendMessage('⏳...', threadID);
    const ok   = await db.deleteUser(tid);
    api.unsendMessage(wait.messageID);

    return api.sendMessage(
      ok ? `🗑️ تم حذف ${tid} من قاعدة البيانات وGitHub`
         : `⚠️ ${tid} مو موجود`,
      threadID, messageID
    );
  }

  // ─ ملف مخصص ─────────────────────────────────────
  if (sub === 'ملف' || sub === 'file') {
    const filePath = args[1];
    if (!filePath) return api.sendMessage('📝 .داتا ملف [مسار]', threadID, messageID);

    const wait = await api.sendMessage('⏳...', threadID);
    const data = await db.loadFile(filePath);
    api.unsendMessage(wait.messageID);

    const json    = JSON.stringify(data, null, 2);
    const preview = json.length > 1500 ? json.slice(0,1500) + '\n...' : json;
    const sent    = await api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n📄 ${filePath}\n━━━━━━━━━━\n${preview}\n\n✏️ رد لتعديل`,
      threadID, messageID
    );
    global.client?.handleReply?.push({
      name: module.exports.config.name, messageID: sent.messageID,
      author: senderID, action: 'edit_file', filePath,
    });
    return;
  }

  // ─ سجل ──────────────────────────────────────────
  if (sub === 'سجل' || sub === 'log') {
    const wait    = await api.sendMessage('⏳...', threadID);
    const history = await db.getHistory(15);
    api.unsendMessage(wait.messageID);

    if (!history.length) return api.sendMessage('📭 السجل فارغ', threadID, messageID);
    const lines = history.map(h => `• [${h.type}] ${h.userID || ''} — ${new Date(h.at).toLocaleTimeString('ar')}`);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n📋 آخر الأحداث:\n${lines.join('\n')}`,
      threadID, messageID
    );
  }

  // ─ رفع ──────────────────────────────────────────
  if (sub === 'رفع' || sub === 'push') {
    const wait = await api.sendMessage('⏳ جاري رفع كل شيء لـ GitHub...', threadID);
    const ok   = await db.flushAll();
    api.unsendMessage(wait.messageID);
    return api.sendMessage(
      ok ? '✅ تم رفع كل الملفات لـ GitHub!' : '❌ فشل الرفع — تحقق من التوكن',
      threadID, messageID
    );
  }

  // ─ مساعدة ───────────────────────────────────────
  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n📁 نظام البيانات — GitHub JSON\n\n` +
    `.داتا احصاء          ← إحصائيات\n` +
    `.داتا مستخدم @شخص    ← بيانات + تعديل\n` +
    `.داتا محفظة @شخص     ← المحفظة\n` +
    `.داتا حظر @شخص [سبب] ← حظر\n` +
    `.داتا فتح @شخص        ← رفع حظر\n` +
    `.داتا محظورين         ← قائمة المحظورين\n` +
    `.داتا عدل @شخص | {}   ← تعديل مباشر\n` +
    `.داتا حذف @شخص        ← حذف\n` +
    `.داتا ملف [مسار]      ← ملف مخصص\n` +
    `.داتا سجل             ← آخر الأحداث\n` +
    `.داتا رفع             ← حفظ لـ GitHub`,
    threadID, messageID
  );
};
