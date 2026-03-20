// ╔══════════════════════════════════════════════════════════════════╗
// ║              KIRA DATA SYSTEM v1.0                               ║
// ║   نظام بيانات كامل — GitHub JSON — repo منفصل                  ║
// ║                                                                  ║
// ║   الملفات:                                                       ║
// ║   user/users.json      ← بيانات المستخدمين الأساسية             ║
// ║   user/wallet.json     ← المحافظ (عملة، XP، ليفل)              ║
// ║   user/bans.json       ← سجل الحظر                             ║
// ║   user/history.json    ← سجل الأحداث                           ║
// ║   group/threads.json   ← بيانات المجموعات                      ║
// ╚══════════════════════════════════════════════════════════════════╝

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ══════════════════════════════════════════════════
//  إعدادات
// ══════════════════════════════════════════════════
function loadConfig() {
  for (const p of [
    path.join(__dirname, '..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}
const CFG      = loadConfig();
const TOKEN    = CFG.GITHUB_TOKEN || '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';
const REPO     = 'aymkira/data';

// ══════════════════════════════════════════════════
//  كاش متعدد الملفات
// ══════════════════════════════════════════════════
const _cache   = {};   // { 'user/users.json': { data: {}, sha: '' } }
const _dirty   = new Set();  // ملفات تحتاج رفع

// ══════════════════════════════════════════════════
//  GitHub API
// ══════════════════════════════════════════════════
function gh(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const raw = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path:     `/repos/${REPO}${endpoint}`,
      method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent':    'KIRA-DataSystem',
        'Accept':        'application/vnd.github.v3+json',
        'Content-Type':  'application/json',
        ...(raw ? { 'Content-Length': Buffer.byteLength(raw) } : {}),
      },
    }, res => {
      let out = '';
      res.on('data', c => out += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(out) }); }
        catch { resolve({ status: res.statusCode, data: out }); }
      });
    });
    req.on('error', reject);
    if (raw) req.write(raw);
    req.end();
  });
}

function encodePath(p) {
  return p.split('/').map(s => encodeURIComponent(s)).join('/');
}

// ══════════════════════════════════════════════════
//  تحميل ملف من GitHub
// ══════════════════════════════════════════════════
async function loadFile(filePath) {
  if (_cache[filePath]) return _cache[filePath].data;

  try {
    const res = await gh('GET', `/contents/${encodePath(filePath)}`);
    if (res.status === 200) {
      const data = JSON.parse(Buffer.from(res.data.content, 'base64').toString('utf8'));
      _cache[filePath] = { data, sha: res.data.sha };
      return data;
    }
  } catch(_) {}

  // ملف جديد
  _cache[filePath] = { data: {}, sha: null };
  return {};
}

// ══════════════════════════════════════════════════
//  رفع ملف لـ GitHub
// ══════════════════════════════════════════════════
async function saveFile(filePath, msg) {
  const entry = _cache[filePath];
  if (!entry) return false;

  try {
    const content = Buffer.from(JSON.stringify(entry.data, null, 2)).toString('base64');
    const body    = {
      message: `🤖 ${msg || 'update'} — KIRA`,
      content,
      ...(entry.sha ? { sha: entry.sha } : {}),
    };
    const res = await gh('PUT', `/contents/${encodePath(filePath)}`, body);
    if (res.status === 200 || res.status === 201) {
      entry.sha = res.data?.content?.sha || entry.sha;
      _dirty.delete(filePath);
      return true;
    }
    console.error(`[DATA] فشل حفظ ${filePath}:`, res.data?.message);
    return false;
  } catch(e) {
    console.error(`[DATA] خطأ ${filePath}:`, e.message);
    return false;
  }
}

// ══════════════════════════════════════════════════
//  دوال مساعدة
// ══════════════════════════════════════════════════
function now() { return new Date().toISOString(); }

function calcLevel(exp) { return Math.floor(Math.pow(exp / 40, 0.55)) + 1; }

function rankName(level) {
  if (level >= 100) return { name: 'خالد',       emoji: '😈' };
  if (level >= 75)  return { name: 'إله',         emoji: '🔥' };
  if (level >= 50)  return { name: 'إمبراطور',    emoji: '🌟' };
  if (level >= 40)  return { name: 'ملك',         emoji: '🔱' };
  if (level >= 30)  return { name: 'أسطورة',      emoji: '⚡' };
  if (level >= 20)  return { name: 'بطل',         emoji: '👑' };
  if (level >= 15)  return { name: 'نخبة',        emoji: '💎' };
  if (level >= 10)  return { name: 'فارس',        emoji: '🛡️' };
  if (level >= 5)   return { name: 'محارب',       emoji: '⚔️' };
  return { name: 'مبتدئ', emoji: '🔰' };
}

// ═══════════════════════════════════════════════════════
//  ① users.json — بيانات المستخدمين الأساسية
// ═══════════════════════════════════════════════════════
const USERS_FILE    = 'user/users.json';
const WALLET_FILE   = 'user/wallet.json';
const BANS_FILE     = 'user/bans.json';
const HISTORY_FILE  = 'user/history.json';
const THREADS_FILE  = 'group/threads.json';
const ANALYSIS_FILE = 'user/analysis.json';
const KICKED_FILE   = 'user/kicked.json';

// جلب مستخدم
async function getUser(userID) {
  const db = await loadFile(USERS_FILE);
  return db[String(userID)] || null;
}

// إنشاء أو تحديث مستخدم
async function setUser(userID, data, save = true) {
  const db  = await loadFile(USERS_FILE);
  const id  = String(userID);
  db[id]    = { ...(db[id] || { userID: id, createdAt: now() }), ...data, updatedAt: now() };
  _cache[USERS_FILE].data = db;
  _dirty.add(USERS_FILE);
  if (save) await saveFile(USERS_FILE, `update user ${id}`);
  return db[id];
}

// التأكد من وجود المستخدم (إنشاء لو ما موجود)
async function ensureUser(userID, name = '') {
  const user = await getUser(userID);
  if (!user) {
    await setUser(userID, { name, messageCount: 0 });
    await ensureWallet(userID);
  }
  return await getUser(userID);
}

// حذف مستخدم
async function deleteUser(userID, save = true) {
  const db = await loadFile(USERS_FILE);
  const id  = String(userID);
  if (!db[id]) return false;
  delete db[id];
  _cache[USERS_FILE].data = db;
  _dirty.add(USERS_FILE);
  if (save) await saveFile(USERS_FILE, `delete user ${id}`);
  return true;
}

// كل المستخدمين
async function getAllUsers() {
  const db = await loadFile(USERS_FILE);
  return Object.values(db);
}

// زيادة عداد الرسائل
async function incrementMessages(userID, name = '') {
  await ensureUser(userID, name);
  const db = await loadFile(USERS_FILE);
  const id  = String(userID);
  db[id].messageCount = (db[id].messageCount || 0) + 1;
  db[id].lastSeen     = now();
  if (name && !db[id].name) db[id].name = name;
  _cache[USERS_FILE].data = db;
  _dirty.add(USERS_FILE);

  // ── XP تلقائي — نقطة لكل رسالة ──────────────────
  try { await addExp(userID, 1); } catch(_) {}
  // لا نحفظ كل رسالة — الحفظ التلقائي كل 5 دقائق
  return db[id];
}

// ═══════════════════════════════════════════════════════
//  ② wallet.json — المحافظ
// ═══════════════════════════════════════════════════════
async function ensureWallet(userID) {
  const db = await loadFile(WALLET_FILE);
  const id  = String(userID);
  if (!db[id]) {
    db[id] = { userID: id, money: 0, bank: 0, exp: 0, level: 1, rank: 'مبتدئ', rankEmoji: '🔰', totalEarned: 0, createdAt: now() };
    _cache[WALLET_FILE].data = db;
    _dirty.add(WALLET_FILE);
    await saveFile(WALLET_FILE, `create wallet ${id}`);
  }
  return db[id];
}

async function getWallet(userID) {
  const db = await loadFile(WALLET_FILE);
  return db[String(userID)] || await ensureWallet(userID);
}

async function addMoney(userID, amount) {
  const db  = await loadFile(WALLET_FILE);
  const id  = String(userID);
  await ensureWallet(userID);
  db[id].money       = (db[id].money || 0) + Number(amount);
  db[id].totalEarned = (db[id].totalEarned || 0) + Math.max(0, Number(amount));
  db[id].updatedAt   = now();
  _cache[WALLET_FILE].data = db;
  _dirty.add(WALLET_FILE);
  await saveFile(WALLET_FILE, `add money ${id}`);
  return db[id].money;
}

async function removeMoney(userID, amount) {
  const db  = await loadFile(WALLET_FILE);
  const id  = String(userID);
  await ensureWallet(userID);
  if ((db[id].money || 0) < Number(amount)) return { success: false, balance: db[id].money };
  db[id].money     -= Number(amount);
  db[id].updatedAt  = now();
  _cache[WALLET_FILE].data = db;
  _dirty.add(WALLET_FILE);
  await saveFile(WALLET_FILE, `remove money ${id}`);
  return { success: true, balance: db[id].money };
}

async function addBank(userID, amount) {
  const db  = await loadFile(WALLET_FILE);
  const id  = String(userID);
  await ensureWallet(userID);
  db[id].bank      = (db[id].bank || 0) + Number(amount);
  db[id].updatedAt  = now();
  _cache[WALLET_FILE].data = db;
  _dirty.add(WALLET_FILE);
  await saveFile(WALLET_FILE, `add bank ${id}`);
  return db[id].bank;
}

async function addExp(userID, amount = 1) {
  const db  = await loadFile(WALLET_FILE);
  const id  = String(userID);
  await ensureWallet(userID);
  const oldLevel  = db[id].level || 1;
  db[id].exp      = (db[id].exp || 0) + Number(amount);
  const newLevel  = calcLevel(db[id].exp);
  const rank      = rankName(newLevel);
  db[id].level    = newLevel;
  db[id].rank     = rank.name;
  db[id].rankEmoji = rank.emoji;
  db[id].updatedAt = now();
  _cache[WALLET_FILE].data = db;
  _dirty.add(WALLET_FILE);
  await saveFile(WALLET_FILE, `add exp ${id}`);
  return { exp: db[id].exp, level: newLevel, levelUp: newLevel > oldLevel, rank };
}

// ═══════════════════════════════════════════════════════
//  ③ bans.json — الحظر
// ═══════════════════════════════════════════════════════
async function banUser(userID, reason = '', bannedBy = '', duration = 0) {
  const db  = await loadFile(BANS_FILE);
  const id  = String(userID);
  const expiresAt = duration > 0 ? new Date(Date.now() + duration * 60000).toISOString() : null;

  db[id] = {
    userID: id, banned: true,
    reason, bannedBy,
    bannedAt:  now(),
    expiresAt,
    duration,
    history:   [...(db[id]?.history || []), { action: 'ban', reason, by: bannedBy, at: now() }],
  };
  _cache[BANS_FILE].data = db;
  _dirty.add(BANS_FILE);
  await saveFile(BANS_FILE, `ban user ${id}`);

  // تحديث حالة الحظر في global
  global.data?.userBanned?.set(id, { reason, dateAdded: now(), expiresAt });
  return db[id];
}

async function unbanUser(userID, unbannedBy = '') {
  const db  = await loadFile(BANS_FILE);
  const id  = String(userID);
  if (!db[id]?.banned) return false;

  db[id].banned      = false;
  db[id].unbannedAt  = now();
  db[id].unbannedBy  = unbannedBy;
  db[id].history     = [...(db[id].history || []), { action: 'unban', by: unbannedBy, at: now() }];
  _cache[BANS_FILE].data = db;
  _dirty.add(BANS_FILE);
  await saveFile(BANS_FILE, `unban user ${id}`);

  // رفع من global
  global.data?.userBanned?.delete(id);
  return true;
}

async function getBan(userID) {
  const db = await loadFile(BANS_FILE);
  return db[String(userID)] || null;
}

async function getAllBans() {
  const db = await loadFile(BANS_FILE);
  return Object.values(db).filter(u => u.banned);
}

// ═══════════════════════════════════════════════════════
//  ③-b kicked.json — المطرودون الدائمون
// ═══════════════════════════════════════════════════════
async function kickUser(userID, reason = '', kickedBy = '') {
  const db = await loadFile(KICKED_FILE);
  const id = String(userID);
  db[id] = {
    userID: id,
    reason,
    kickedBy: String(kickedBy),
    kickedAt: now(),
  };
  _cache[KICKED_FILE].data = db;
  _dirty.add(KICKED_FILE);
  await saveFile(KICKED_FILE, `kick user ${id}`);

  // تحديث الذاكرة
  if (!global._kickedUsers) global._kickedUsers = new Map();
  global._kickedUsers.set(id, db[id]);
  return db[id];
}

async function unkickUser(userID) {
  const db = await loadFile(KICKED_FILE);
  const id = String(userID);
  if (!db[id]) return false;
  delete db[id];
  _cache[KICKED_FILE].data = db;
  _dirty.add(KICKED_FILE);
  await saveFile(KICKED_FILE, `unkick user ${id}`);
  global._kickedUsers?.delete(id);
  return true;
}

async function getKick(userID) {
  const db = await loadFile(KICKED_FILE);
  return db[String(userID)] || null;
}

async function getAllKicked() {
  const db = await loadFile(KICKED_FILE);
  return Object.values(db);
}

// تحميل المطرودين للذاكرة عند بدء التشغيل
;(async () => {
  try {
    if (!global._kickedUsers) global._kickedUsers = new Map();
    const db = await loadFile(KICKED_FILE);
    for (const [id, data] of Object.entries(db))
      global._kickedUsers.set(id, data);
    if (Object.keys(db).length)
      console.log(`[DATA] 🚫 تم تحميل ${Object.keys(db).length} مطرود للذاكرة`);
  } catch(_) {}
})();

// ═══════════════════════════════════════════════════════
//  ④ history.json — سجل الأحداث
// ═══════════════════════════════════════════════════════
async function logEvent(type, data) {
  const db  = await loadFile(HISTORY_FILE);
  const key  = `${Date.now()}_${type}`;
  db[key]    = { type, ...data, at: now() };

  // احتفظ بآخر 500 حدث فقط
  const keys = Object.keys(db).sort();
  if (keys.length > 500) {
    for (const k of keys.slice(0, keys.length - 500)) delete db[k];
  }
  _cache[HISTORY_FILE].data = db;
  _dirty.add(HISTORY_FILE);
  // لا نحفظ فوراً — الحفظ التلقائي
}

async function getHistory(limit = 20) {
  const db   = await loadFile(HISTORY_FILE);
  const keys = Object.keys(db).sort().reverse().slice(0, limit);
  return keys.map(k => db[k]);
}

// ═══════════════════════════════════════════════════════
//  ⑤ threads.json — المجموعات
// ═══════════════════════════════════════════════════════
async function getThread(threadID) {
  const db = await loadFile(THREADS_FILE);
  return db[String(threadID)] || null;
}

async function setThread(threadID, data, save = true) {
  const db  = await loadFile(THREADS_FILE);
  const id  = String(threadID);
  db[id]    = { ...(db[id] || { threadID: id, createdAt: now() }), ...data, updatedAt: now() };
  _cache[THREADS_FILE].data = db;
  _dirty.add(THREADS_FILE);
  if (save) await saveFile(THREADS_FILE, `update thread ${id}`);
  return db[id];
}

async function banThread(threadID, reason = '', bannedBy = '') {
  const entry = await setThread(threadID, { banned: true, banReason: reason, bannedBy, bannedAt: now() });
  global.data?.threadBanned?.set(String(threadID), { reason, dateAdded: now() });
  return entry;
}

async function unbanThread(threadID) {
  const entry = await setThread(threadID, { banned: false, banReason: '', bannedBy: '', unbannedAt: now() });
  global.data?.threadBanned?.delete(String(threadID));
  return entry;
}

// ═══════════════════════════════════════════════════════
//  ⑥ analysis.json — تحليل الشخصيات
// ═══════════════════════════════════════════════════════
async function getAnalysis(userID) {
  const db = await loadFile(ANALYSIS_FILE);
  return db[String(userID)] || null;
}

async function setAnalysis(userID, data) {
  const db = await loadFile(ANALYSIS_FILE);
  const id = String(userID);
  db[id] = { ...(db[id] || { userID: id, createdAt: now() }), ...data, updatedAt: now() };
  _cache[ANALYSIS_FILE].data = db;
  _dirty.add(ANALYSIS_FILE);
  await saveFile(ANALYSIS_FILE, `analysis ${id}`);
  return db[id];
}

async function getAllAnalysis() {
  const db = await loadFile(ANALYSIS_FILE);
  return Object.values(db);
}

// ══════════════════════════════════════════════════
//  إدارة الملفات
// ══════════════════════════════════════════════════

// إنشاء ملف مخصص داخل مجلد user أو group
async function createCustomFile(filePath, initialData = {}) {
  if (!filePath.startsWith('user/') && !filePath.startsWith('group/')) {
    filePath = `user/${filePath}`;
  }
  if (!filePath.endsWith('.json')) filePath += '.json';
  _cache[filePath] = { data: initialData, sha: null };
  _dirty.add(filePath);
  await saveFile(filePath, `create ${filePath}`);
  return filePath;
}

async function readCustomFile(filePath) {
  return await loadFile(filePath);
}

async function writeCustomFile(filePath, data, msg) {
  if (!_cache[filePath]) _cache[filePath] = { data: {}, sha: null };
  _cache[filePath].data = data;
  _dirty.add(filePath);
  return await saveFile(filePath, msg || `update ${filePath}`);
}

// حفظ يدوي لكل الملفات المعدّلة
async function flushAll() {
  const files  = [..._dirty];
  const results = await Promise.all(files.map(f => saveFile(f, 'flush all')));
  return results.every(Boolean);
}

// إعادة تحميل ملف من GitHub
async function reload(filePath) {
  if (_cache[filePath]) delete _cache[filePath];
  return await loadFile(filePath);
}

// إحصائيات
async function stats() {
  const users   = await loadFile(USERS_FILE);
  const wallets = await loadFile(WALLET_FILE);
  const bans    = await loadFile(BANS_FILE);
  const threads = await loadFile(THREADS_FILE);
  return {
    users:        Object.keys(users).length,
    wallets:      Object.keys(wallets).length,
    activeBans:   Object.values(bans).filter(b => b.banned).length,
    threads:      Object.keys(threads).length,
    dirtyFiles:   _dirty.size,
    cachedFiles:  Object.keys(_cache).length,
  };
}

// ══════════════════════════════════════════════════
//  حفظ تلقائي كل 5 دقائق
// ══════════════════════════════════════════════════
setInterval(async () => {
  if (_dirty.size > 0) {
    console.log(`[DATA] 💾 حفظ تلقائي لـ ${_dirty.size} ملف...`);
    await flushAll();
  }
}, 5 * 60 * 1000);

// ══════════════════════════════════════════════════
//  تصدير كل شيء
// ══════════════════════════════════════════════════
module.exports = {
  // ── مستخدمين ──
  getUser, setUser, ensureUser, deleteUser, getAllUsers, incrementMessages,

  // ── محافظ ──
  getWallet, ensureWallet, addMoney, removeMoney, addBank, addExp,

  // ── حظر ──
  banUser, unbanUser, getBan, getAllBans,

  // ── طرد دائم ──
  kickUser, unkickUser, getKick, getAllKicked,

  // ── مجموعات ──
  getThread, setThread, banThread, unbanThread,

  // ── سجل ──
  logEvent, getHistory,

  // ── ملفات مخصصة ──
  createCustomFile, readCustomFile, writeCustomFile,

  // ── إدارة ──
  flushAll, reload, stats,
  loadFile, saveFile,

  // ── تحليل ──
  getAnalysis, setAnalysis, getAllAnalysis,

  // ── ثوابت ──
  FILES: { USERS: USERS_FILE, WALLET: WALLET_FILE, BANS: BANS_FILE, HISTORY: HISTORY_FILE, THREADS: THREADS_FILE, ANALYSIS: ANALYSIS_FILE, KICKED: KICKED_FILE },
};
