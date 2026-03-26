// ╔══════════════════════════════════════════════════════════════════╗
// ║              KIRA DATA SYSTEM v2.0                               ║
// ║   نظام بيانات موحّد — GitHub JSON — بدون race condition         ║
// ║                                                                  ║
// ║   الملفات:                                                       ║
// ║   user/users.json      ← بيانات المستخدمين الأساسية             ║
// ║   user/wallet.json     ← المحافظ (عملة، XP، ليفل)              ║
// ║   user/bans.json       ← سجل الحظر                             ║
// ║   user/history.json    ← سجل الأحداث                           ║
// ║   group/threads.json   ← بيانات المجموعات                      ║
// ║   user/analysis.json   ← تحليل الشخصيات                        ║
// ║   user/kicked.json     ← المطرودون الدائمون                     ║
// ╚══════════════════════════════════════════════════════════════════╝

'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ══════════════════════════════════════════════════
//  إعدادات — من config.json فقط، لا fallback مكشوف
// ══════════════════════════════════════════════════
function loadConfig() {
  for (const p of [
    path.join(__dirname, '..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}

const CFG   = loadConfig();
const TOKEN = CFG.GITHUB_TOKEN;
const REPO  = CFG.GITHUB_DATA_REPO || 'aymkira/data';

if (!TOKEN) {
  console.error('[DATA] ❌ GITHUB_TOKEN مو موجود في config.json أو Railway Env!');
}

// ══════════════════════════════════════════════════
//  كاش + Write Queue (حل Race Condition)
// ══════════════════════════════════════════════════
const _cache      = {};   // filePath → { data, sha }
const _saveTimers = {};   // filePath → timeout handle  ← القلب الجديد
const SAVE_DELAY  = 2500; // ms — بعد آخر تعديل بـ 2.5 ثانية يرفع

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
//  تحميل ملف من GitHub (مع كاش)
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

  _cache[filePath] = { data: {}, sha: null };
  return {};
}

// ══════════════════════════════════════════════════
//  رفع ملف لـ GitHub (الرفع الحقيقي)
// ══════════════════════════════════════════════════
async function _doSave(filePath) {
  const entry = _cache[filePath];
  if (!entry) return false;

  try {
    const content = Buffer.from(JSON.stringify(entry.data, null, 2)).toString('base64');
    const body    = {
      message: `🤖 auto-save — KIRA`,
      content,
      ...(entry.sha ? { sha: entry.sha } : {}),
    };
    const res = await gh('PUT', `/contents/${encodePath(filePath)}`, body);
    if (res.status === 200 || res.status === 201) {
      entry.sha = res.data?.content?.sha || entry.sha;
      return true;
    }
    // لو فشل بسبب conflict (409) — أعد تحميل الـ sha وحاول مرة ثانية
    if (res.status === 409 || res.status === 422) {
      console.warn(`[DATA] ⚠️ conflict في ${filePath} — إعادة sync...`);
      delete _cache[filePath];
      await loadFile(filePath);
      // لا ترفع مرة ثانية تلقائياً — الـ scheduleSave التالي سيعالجها
    }
    return false;
  } catch(e) {
    console.error(`[DATA] خطأ في حفظ ${filePath}:`, e.message);
    return false;
  }
}

// ══════════════════════════════════════════════════
//  الجدولة — بدل saveFile المباشر
//  كل التعديلات تمر هنا، يرفع مرة واحدة بعد SAVE_DELAY
// ══════════════════════════════════════════════════
function scheduleSave(filePath) {
  if (_saveTimers[filePath]) clearTimeout(_saveTimers[filePath]);
  _saveTimers[filePath] = setTimeout(async () => {
    delete _saveTimers[filePath];
    await _doSave(filePath);
  }, SAVE_DELAY);
}

// حفظ فوري لملف معين (للـ flushAll أو عند إيقاف البوت)
async function saveFile(filePath) {
  if (_saveTimers[filePath]) {
    clearTimeout(_saveTimers[filePath]);
    delete _saveTimers[filePath];
  }
  return await _doSave(filePath);
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
//  ثوابت المسارات
// ═══════════════════════════════════════════════════════
const FILES = {
  USERS:    'user/users.json',
  WALLET:   'user/wallet.json',
  BANS:     'user/bans.json',
  HISTORY:  'user/history.json',
  THREADS:  'group/threads.json',
  ANALYSIS: 'user/analysis.json',
  KICKED:   'user/kicked.json',
};

// ═══════════════════════════════════════════════════════
//  ① USERS — بيانات المستخدمين
// ═══════════════════════════════════════════════════════
async function getUser(userID) {
  const db = await loadFile(FILES.USERS);
  return db[String(userID)] || null;
}

async function setUser(userID, data) {
  const db = await loadFile(FILES.USERS);
  const id = String(userID);
  db[id] = { ...(db[id] || { userID: id, createdAt: now() }), ...data, updatedAt: now() };
  _cache[FILES.USERS].data = db;
  scheduleSave(FILES.USERS);
  return db[id];
}

async function ensureUser(userID, name = '') {
  let user = await getUser(userID);
  if (!user) {
    await setUser(userID, { name, messageCount: 0 });
    await ensureWallet(userID);
    user = await getUser(userID);
  }
  return user;
}

async function deleteUser(userID) {
  const db = await loadFile(FILES.USERS);
  const id = String(userID);
  if (!db[id]) return false;
  delete db[id];
  _cache[FILES.USERS].data = db;
  scheduleSave(FILES.USERS);
  return true;
}

async function getAllUsers() {
  const db = await loadFile(FILES.USERS);
  return Object.values(db);
}

async function incrementMessages(userID, name = '') {
  await ensureUser(userID, name);
  const db = await loadFile(FILES.USERS);
  const id = String(userID);
  db[id].messageCount = (db[id].messageCount || 0) + 1;
  db[id].lastSeen     = now();
  if (name && !db[id].name) db[id].name = name;
  _cache[FILES.USERS].data = db;
  scheduleSave(FILES.USERS);
  // XP تلقائي
  try { await addExp(userID, 1); } catch(_) {}
  return db[id];
}

// ═══════════════════════════════════════════════════════
//  ② WALLET — المحافظ (موحّد مع Currencies القديم)
// ═══════════════════════════════════════════════════════
async function ensureWallet(userID) {
  const db = await loadFile(FILES.WALLET);
  const id = String(userID);
  if (!db[id]) {
    db[id] = {
      userID: id,
      money: 0,
      bank: 0,
      exp: 0,
      level: 1,
      rank: 'مبتدئ',
      rankEmoji: '🔰',
      totalEarned: 0,
      createdAt: now(),
    };
    _cache[FILES.WALLET].data = db;
    scheduleSave(FILES.WALLET);
  }
  return db[id];
}

async function getWallet(userID) {
  const db = await loadFile(FILES.WALLET);
  return db[String(userID)] || await ensureWallet(userID);
}

// ── دالة موحّدة للتعديل على المحفظة — كل عمليات الفلوس تمر هنا
async function _mutateWallet(userID, mutateFn) {
  await ensureWallet(userID);
  const db = await loadFile(FILES.WALLET);
  const id = String(userID);
  mutateFn(db[id]);
  db[id].updatedAt = now();
  _cache[FILES.WALLET].data = db;
  scheduleSave(FILES.WALLET);
  return db[id];
}

async function addMoney(userID, amount) {
  amount = Number(amount);
  return _mutateWallet(userID, w => {
    w.money       = (w.money || 0) + amount;
    w.totalEarned = (w.totalEarned || 0) + Math.max(0, amount);
  });
}

async function removeMoney(userID, amount) {
  amount = Number(amount);
  const db = await loadFile(FILES.WALLET);
  const id = String(userID);
  await ensureWallet(userID);
  if ((db[id].money || 0) < amount) return { success: false, balance: db[id].money };
  await _mutateWallet(userID, w => { w.money -= amount; });
  return { success: true, balance: db[String(userID)].money };
}

async function addBank(userID, amount) {
  amount = Number(amount);
  return _mutateWallet(userID, w => { w.bank = (w.bank || 0) + amount; });
}

async function removeBank(userID, amount) {
  amount = Number(amount);
  const db = await loadFile(FILES.WALLET);
  const id = String(userID);
  await ensureWallet(userID);
  if ((db[id].bank || 0) < amount) return { success: false, balance: db[id].bank };
  await _mutateWallet(userID, w => { w.bank -= amount; });
  return { success: true, balance: db[String(userID)].bank };
}

async function addExp(userID, amount = 1) {
  amount = Number(amount);
  let levelUp = false, newLevel, rank;
  await _mutateWallet(userID, w => {
    const oldLevel = w.level || 1;
    w.exp          = (w.exp || 0) + amount;
    newLevel       = calcLevel(w.exp);
    rank           = rankName(newLevel);
    w.level        = newLevel;
    w.rank         = rank.name;
    w.rankEmoji    = rank.emoji;
    levelUp        = newLevel > oldLevel;
  });
  return { exp: (await getWallet(userID)).exp, level: newLevel, levelUp, rank };
}

// توافق مع Currencies القديم (للأوامر اللي استخدمت Currencies.increaseMoney)
async function increaseMoney(userID, amount) {
  return addMoney(userID, amount);
}

async function decreaseMoney(userID, amount) {
  return removeMoney(userID, amount);
}

// getData — توافق مع Currencies.getData(senderID).money
async function getData(userID) {
  return getWallet(userID);
}

// ═══════════════════════════════════════════════════════
//  ③ BANS — الحظر
// ═══════════════════════════════════════════════════════
async function banUser(userID, reason = '', bannedBy = '', duration = 0) {
  const db = await loadFile(FILES.BANS);
  const id = String(userID);
  const expiresAt = duration > 0 ? new Date(Date.now() + duration * 60000).toISOString() : null;

  db[id] = {
    userID: id, banned: true,
    reason, bannedBy,
    bannedAt:  now(),
    expiresAt,
    duration,
    history: [...(db[id]?.history || []), { action: 'ban', reason, by: bannedBy, at: now() }],
  };
  _cache[FILES.BANS].data = db;
  scheduleSave(FILES.BANS);
  global.data?.userBanned?.set(id, { reason, dateAdded: now(), expiresAt });
  return db[id];
}

async function unbanUser(userID, unbannedBy = '') {
  const db = await loadFile(FILES.BANS);
  const id = String(userID);
  if (!db[id]?.banned) return false;
  db[id].banned     = false;
  db[id].unbannedAt = now();
  db[id].unbannedBy = unbannedBy;
  db[id].history    = [...(db[id].history || []), { action: 'unban', by: unbannedBy, at: now() }];
  _cache[FILES.BANS].data = db;
  scheduleSave(FILES.BANS);
  global.data?.userBanned?.delete(id);
  return true;
}

async function getBan(userID) {
  const db = await loadFile(FILES.BANS);
  return db[String(userID)] || null;
}

async function getAllBans() {
  const db = await loadFile(FILES.BANS);
  return Object.values(db).filter(u => u.banned);
}

// ═══════════════════════════════════════════════════════
//  ④ KICKED — المطرودون الدائمون
// ═══════════════════════════════════════════════════════
async function kickUser(userID, reason = '', kickedBy = '') {
  const db = await loadFile(FILES.KICKED);
  const id = String(userID);
  db[id] = { userID: id, reason, kickedBy: String(kickedBy), kickedAt: now() };
  _cache[FILES.KICKED].data = db;
  scheduleSave(FILES.KICKED);
  if (!global._kickedUsers) global._kickedUsers = new Map();
  global._kickedUsers.set(id, db[id]);
  return db[id];
}

async function unkickUser(userID) {
  const db = await loadFile(FILES.KICKED);
  const id = String(userID);
  if (!db[id]) return false;
  delete db[id];
  _cache[FILES.KICKED].data = db;
  scheduleSave(FILES.KICKED);
  global._kickedUsers?.delete(id);
  return true;
}

async function getKick(userID) {
  const db = await loadFile(FILES.KICKED);
  return db[String(userID)] || null;
}

async function getAllKicked() {
  const db = await loadFile(FILES.KICKED);
  return Object.values(db);
}

// تحميل المطرودين عند البدء
;(async () => {
  try {
    if (!global._kickedUsers) global._kickedUsers = new Map();
    const db = await loadFile(FILES.KICKED);
    for (const [id, data] of Object.entries(db))
      global._kickedUsers.set(id, data);
    if (Object.keys(db).length)
      console.log(`[DATA] 🚫 تم تحميل ${Object.keys(db).length} مطرود للذاكرة`);
  } catch(_) {}
})();

// تحميل المحظورين (users) عند البدء
;(async () => {
  try {
    if (!global.data) global.data = {};
    if (!global.data.userBanned) global.data.userBanned = new Map();
    const db = await loadFile(FILES.BANS);
    let count = 0;
    const now_ = Date.now();
    for (const [id, entry] of Object.entries(db)) {
      if (!entry.banned) continue;
      // تجاهل الحظر المنتهي
      if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= now_) continue;
      global.data.userBanned.set(id, {
        reason:    entry.reason    || '',
        dateAdded: entry.bannedAt  || '',
        expiresAt: entry.expiresAt || null,
      });
      count++;
    }
    if (count) console.log(`[DATA] 🔴 تم تحميل ${count} محظور للذاكرة`);
  } catch(_) {}
})();

// تحميل المجموعات المحظورة عند البدء
;(async () => {
  try {
    if (!global.data) global.data = {};
    if (!global.data.threadBanned) global.data.threadBanned = new Map();
    const db = await loadFile(FILES.THREADS);
    let count = 0;
    for (const [id, entry] of Object.entries(db)) {
      if (!entry.banned) continue;
      global.data.threadBanned.set(id, {
        reason:    entry.banReason || entry.reason || '',
        dateAdded: entry.bannedAt  || '',
      });
      count++;
    }
    if (count) console.log(`[DATA] 🔴 تم تحميل ${count} مجموعة محظورة للذاكرة`);
  } catch(_) {}
})();

// ═══════════════════════════════════════════════════════
//  ⑤ HISTORY — سجل الأحداث
// ═══════════════════════════════════════════════════════
async function logEvent(type, data) {
  const db  = await loadFile(FILES.HISTORY);
  const key = `${Date.now()}_${type}`;
  db[key]   = { type, ...data, at: now() };
  // احتفظ بآخر 500 فقط
  const keys = Object.keys(db).sort();
  if (keys.length > 500)
    for (const k of keys.slice(0, keys.length - 500)) delete db[k];
  _cache[FILES.HISTORY].data = db;
  scheduleSave(FILES.HISTORY);
}

async function getHistory(limit = 20) {
  const db   = await loadFile(FILES.HISTORY);
  const keys = Object.keys(db).sort().reverse().slice(0, limit);
  return keys.map(k => db[k]);
}

// ═══════════════════════════════════════════════════════
//  ⑥ THREADS — المجموعات
// ═══════════════════════════════════════════════════════
async function getThread(threadID) {
  const db = await loadFile(FILES.THREADS);
  return db[String(threadID)] || null;
}

async function setThread(threadID, data) {
  const db = await loadFile(FILES.THREADS);
  const id = String(threadID);
  db[id]   = { ...(db[id] || { threadID: id, createdAt: now() }), ...data, updatedAt: now() };
  _cache[FILES.THREADS].data = db;
  scheduleSave(FILES.THREADS);
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

async function getAllThreads() {
  const db = await loadFile(FILES.THREADS);
  return Object.values(db);
}

// ═══════════════════════════════════════════════════════
//  ⑦ ANALYSIS — تحليل الشخصيات
// ═══════════════════════════════════════════════════════
async function getAnalysis(userID) {
  const db = await loadFile(FILES.ANALYSIS);
  return db[String(userID)] || null;
}

async function setAnalysis(userID, data) {
  const db = await loadFile(FILES.ANALYSIS);
  const id = String(userID);
  db[id] = { ...(db[id] || { userID: id, createdAt: now() }), ...data, updatedAt: now() };
  _cache[FILES.ANALYSIS].data = db;
  scheduleSave(FILES.ANALYSIS);
  return db[id];
}

async function getAllAnalysis() {
  const db = await loadFile(FILES.ANALYSIS);
  return Object.values(db);
}

// ═══════════════════════════════════════════════════════
//  ⑧ ملفات مخصصة
// ═══════════════════════════════════════════════════════
async function createCustomFile(filePath, initialData = {}) {
  if (!filePath.startsWith('user/') && !filePath.startsWith('group/'))
    filePath = `user/${filePath}`;
  if (!filePath.endsWith('.json')) filePath += '.json';
  _cache[filePath] = { data: initialData, sha: null };
  scheduleSave(filePath);
  return filePath;
}

async function readCustomFile(filePath) {
  return await loadFile(filePath);
}

async function writeCustomFile(filePath, data) {
  if (!_cache[filePath]) _cache[filePath] = { data: {}, sha: null };
  _cache[filePath].data = data;
  scheduleSave(filePath);
  return true;
}

// ═══════════════════════════════════════════════════════
//  إدارة عامة
// ═══════════════════════════════════════════════════════

// حفظ كل الملفات المعلقة فوراً (للإيقاف النظيف)
async function flushAll() {
  const pending = Object.keys(_saveTimers);
  if (!pending.length) return true;
  const results = await Promise.all(pending.map(f => saveFile(f)));
  return results.every(Boolean);
}

// إعادة تحميل من GitHub
async function reload(filePath) {
  delete _cache[filePath];
  return await loadFile(filePath);
}

// إحصائيات
async function stats() {
  const users   = await loadFile(FILES.USERS);
  const wallets = await loadFile(FILES.WALLET);
  const bans    = await loadFile(FILES.BANS);
  const threads = await loadFile(FILES.THREADS);
  return {
    users:       Object.keys(users).length,
    wallets:     Object.keys(wallets).length,
    activeBans:  Object.values(bans).filter(b => b.banned).length,
    threads:     Object.keys(threads).length,
    pendingSave: Object.keys(_saveTimers).length,
    cachedFiles: Object.keys(_cache).length,
  };
}

// ══════════════════════════════════════════════════
//  حفظ تلقائي كل 5 دقائق (خط دفاع ثانٍ)
// ══════════════════════════════════════════════════
setInterval(async () => {
  const pending = Object.keys(_saveTimers);
  if (pending.length > 0) {
    console.log(`[DATA] 💾 flush دوري لـ ${pending.length} ملف...`);
    await flushAll();
  }
}, 5 * 60 * 1000);

// حفظ نظيف عند إيقاف البوت
process.on('SIGTERM', async () => { await flushAll(); });
process.on('SIGINT',  async () => { await flushAll(); });

// ══════════════════════════════════════════════════
//  تصدير كل شيء
// ══════════════════════════════════════════════════
module.exports = {
  // ── مستخدمين ──
  getUser, setUser, ensureUser, deleteUser, getAllUsers, incrementMessages,

  // ── محافظ (+ توافق مع Currencies القديم) ──
  getWallet, ensureWallet,
  addMoney, removeMoney,
  addBank, removeBank,
  addExp,
  increaseMoney,   // ← Currencies.increaseMoney
  decreaseMoney,   // ← Currencies.decreaseMoney
  getData,         // ← Currencies.getData

  // ── حظر ──
  banUser, unbanUser, getBan, getAllBans,

  // ── طرد دائم ──
  kickUser, unkickUser, getKick, getAllKicked,

  // ── مجموعات ──
  getThread, setThread, banThread, unbanThread, getAllThreads,

  // ── سجل ──
  logEvent, getHistory,

  // ── تحليل ──
  getAnalysis, setAnalysis, getAllAnalysis,

  // ── ملفات مخصصة ──
  createCustomFile, readCustomFile, writeCustomFile,

  // ── إدارة ──
  flushAll, reload, stats,
  loadFile, saveFile, scheduleSave,

  // ── ثوابت ──
  FILES,
};
