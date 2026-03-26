// ╔══════════════════════════════════════════════════════════════════╗
// ║              KIRA DATA SYSTEM v3.0 — MongoDB                    ║
// ║   نفس API القديم بالكامل — MongoDB backend                      ║
// ╚══════════════════════════════════════════════════════════════════╝

'use strict';

const mongoose = require('mongoose');
const path     = require('path');

// ══════════════════════════════════════════════════
//  اتصال MongoDB
// ══════════════════════════════════════════════════
function loadConfig() {
  for (const p of [
    path.join(__dirname, '..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(require('fs').readFileSync(p, 'utf8')); } catch(_) {} }
  return {};
}

const CFG       = loadConfig();
const MONGO_URI = CFG.MONGO_URI || "mongodb+srv://kkayman200_db_user:ukhzlLzjRxQgSnTl@cluster0.7nsuoil.mongodb.net/KiraDB?retryWrites=true&w=majority";

let _connected = false;
async function connect() {
  if (_connected || mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  _connected = true;
  console.log('✅ [DATA] MongoDB connected');
}
connect().catch(e => console.error('❌ [DATA] MongoDB error:', e.message));

// ══════════════════════════════════════════════════
//  Schemas
// ══════════════════════════════════════════════════
const { Schema } = mongoose;

const userSchema = new Schema({
  userID:       { type: String, required: true, unique: true },
  name:         { type: String, default: '' },
  messageCount: { type: Number, default: 0 },
  lastSeen:     { type: String, default: null },
  data:         { type: Object, default: {} },
  createdAt:    { type: String, default: () => now() },
  updatedAt:    { type: String, default: () => now() },
});

const walletSchema = new Schema({
  userID:      { type: String, required: true, unique: true },
  money:       { type: Number, default: 0 },
  bank:        { type: Number, default: 0 },
  exp:         { type: Number, default: 0 },
  level:       { type: Number, default: 1 },
  rank:        { type: String, default: 'مبتدئ' },
  rankEmoji:   { type: String, default: '🔰' },
  totalEarned: { type: Number, default: 0 },
  createdAt:   { type: String, default: () => now() },
  updatedAt:   { type: String, default: () => now() },
});

const banSchema = new Schema({
  userID:     { type: String, required: true, unique: true },
  banned:     { type: Boolean, default: true },
  reason:     { type: String, default: '' },
  bannedBy:   { type: String, default: '' },
  bannedAt:   { type: String, default: () => now() },
  expiresAt:  { type: String, default: null },
  unbannedAt: { type: String, default: null },
  unbannedBy: { type: String, default: '' },
  history:    { type: Array,  default: [] },
});

const kickSchema = new Schema({
  userID:   { type: String, required: true, unique: true },
  reason:   { type: String, default: '' },
  kickedBy: { type: String, default: '' },
  kickedAt: { type: String, default: () => now() },
});

const threadSchema = new Schema({
  threadID:   { type: String, required: true, unique: true },
  threadName: { type: String, default: '' },
  banned:     { type: Boolean, default: false },
  banReason:  { type: String, default: '' },
  bannedBy:   { type: String, default: '' },
  bannedAt:   { type: String, default: null },
  unbannedAt: { type: String, default: null },
  threadInfo: { type: Object, default: {} },
  data:       { type: Object, default: {} },
  createdAt:  { type: String, default: () => now() },
  updatedAt:  { type: String, default: () => now() },
});

const historySchema = new Schema({
  key:  { type: String, required: true, unique: true },
  type: { type: String, default: '' },
  data: { type: Object, default: {} },
  at:   { type: String, default: () => now() },
});

const analysisSchema = new Schema({
  userID:    { type: String, required: true, unique: true },
  data:      { type: Object, default: {} },
  createdAt: { type: String, default: () => now() },
  updatedAt: { type: String, default: () => now() },
});

const customFileSchema = new Schema({
  filePath: { type: String, required: true, unique: true },
  data:     { type: Object, default: {} },
});

// ══════════════════════════════════════════════════
//  Models
// ══════════════════════════════════════════════════
const UserM       = mongoose.models.KiraUser       || mongoose.model('KiraUser',       userSchema);
const WalletM     = mongoose.models.KiraWallet     || mongoose.model('KiraWallet',     walletSchema);
const BanM        = mongoose.models.KiraBan        || mongoose.model('KiraBan',        banSchema);
const KickM       = mongoose.models.KiraKick       || mongoose.model('KiraKick',       kickSchema);
const ThreadM     = mongoose.models.KiraThread     || mongoose.model('KiraThread',     threadSchema);
const HistoryM    = mongoose.models.KiraHistory    || mongoose.model('KiraHistory',    historySchema);
const AnalysisM   = mongoose.models.KiraAnalysis   || mongoose.model('KiraAnalysis',   analysisSchema);
const CustomFileM = mongoose.models.KiraCustomFile || mongoose.model('KiraCustomFile', customFileSchema);

// ══════════════════════════════════════════════════
//  ثوابت
// ══════════════════════════════════════════════════
const FILES = {
  USERS:    'user/users.json',
  WALLET:   'user/wallet.json',
  BANS:     'user/bans.json',
  HISTORY:  'user/history.json',
  THREADS:  'group/threads.json',
  ANALYSIS: 'user/analysis.json',
  KICKED:   'user/kicked.json',
};

// كاش وهمي — بعض الكود القديم يلمس _cache مباشرة
const _cache = new Proxy({}, {
  get(t, k)    { return t[k] ?? { data: {}, sha: null }; },
  set(t, k, v) { t[k] = v; return true; },
});

function now() { return new Date().toISOString(); }

function scheduleSave() {}
async function saveFile()  { return true; }
async function flushAll()  { return true; }
async function reload(fp)  { return loadFile(fp); }

// ══════════════════════════════════════════════════
//  loadFile — توافق مع الكود القديم
// ══════════════════════════════════════════════════
async function loadFile(filePath) {
  await connect();
  if (filePath === FILES.USERS) {
    const all = await UserM.find({}).lean();
    return Object.fromEntries(all.map(u => [u.userID, u]));
  }
  if (filePath === FILES.WALLET) {
    const all = await WalletM.find({}).lean();
    return Object.fromEntries(all.map(w => [w.userID, w]));
  }
  if (filePath === FILES.BANS) {
    const all = await BanM.find({}).lean();
    return Object.fromEntries(all.map(b => [b.userID, b]));
  }
  if (filePath === FILES.THREADS) {
    const all = await ThreadM.find({}).lean();
    return Object.fromEntries(all.map(t => [t.threadID, t]));
  }
  if (filePath === FILES.KICKED) {
    const all = await KickM.find({}).lean();
    return Object.fromEntries(all.map(k => [k.userID, k]));
  }
  if (filePath === FILES.HISTORY) {
    const all = await HistoryM.find({}).sort({ at: -1 }).limit(500).lean();
    return Object.fromEntries(all.map(h => [h.key, h]));
  }
  if (filePath === FILES.ANALYSIS) {
    const all = await AnalysisM.find({}).lean();
    return Object.fromEntries(all.map(a => [a.userID, a]));
  }
  const rec = await CustomFileM.findOne({ filePath }).lean();
  return rec?.data || {};
}

// ══════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════
function calcLevel(exp) { return Math.floor(Math.pow(exp / 40, 0.55)) + 1; }

function rankName(level) {
  if (level >= 100) return { name: 'خالد',    emoji: '😈' };
  if (level >= 75)  return { name: 'إله',      emoji: '🔥' };
  if (level >= 50)  return { name: 'إمبراطور', emoji: '🌟' };
  if (level >= 40)  return { name: 'ملك',      emoji: '🔱' };
  if (level >= 30)  return { name: 'أسطورة',   emoji: '⚡' };
  if (level >= 20)  return { name: 'بطل',      emoji: '👑' };
  if (level >= 15)  return { name: 'نخبة',     emoji: '💎' };
  if (level >= 10)  return { name: 'فارس',     emoji: '🛡️' };
  if (level >= 5)   return { name: 'محارب',    emoji: '⚔️' };
  return                    { name: 'مبتدئ',   emoji: '🔰' };
}

async function getUser(userID) {
  await connect();
  return UserM.findOne({ userID: String(userID) }).lean();
}

async function setUser(userID, data) {
  await connect();
  const id = String(userID);
  return UserM.findOneAndUpdate(
    { userID: id },
    { $set: { ...data, updatedAt: now() }, $setOnInsert: { userID: id, createdAt: now() } },
    { upsert: true, new: true }
  ).lean();
}

async function ensureUser(userID, name = '') {
  await connect();
  const id = String(userID);
  await UserM.findOneAndUpdate(
    { userID: id },
    { $setOnInsert: { userID: id, name, messageCount: 0, createdAt: now() } },
    { upsert: true }
  );
  await ensureWallet(id);
  return getUser(id);
}

async function deleteUser(userID) {
  await connect();
  const r = await UserM.deleteOne({ userID: String(userID) });
  return r.deletedCount > 0;
}

async function getAllUsers() {
  await connect();
  return UserM.find({}).lean();
}

async function incrementMessages(userID, name = '') {
  await connect();
  const id = String(userID);
  await ensureUser(id, name);
  await UserM.findOneAndUpdate(
    { userID: id },
    { $inc: { messageCount: 1 }, $set: { lastSeen: now(), ...(name ? { name } : {}) } }
  );
  try { await addExp(id, 1); } catch(_) {}
  return getUser(id);
}

// ══════════════════════════════════════════════════
//  WALLET
// ══════════════════════════════════════════════════
async function ensureWallet(userID) {
  await connect();
  const id = String(userID);
  return WalletM.findOneAndUpdate(
    { userID: id },
    { $setOnInsert: { userID: id, money: 0, bank: 0, exp: 0, level: 1, rank: 'مبتدئ', rankEmoji: '🔰', totalEarned: 0, createdAt: now() } },
    { upsert: true, new: true }
  ).lean();
}

async function getWallet(userID) {
  await connect();
  const id = String(userID);
  return (await WalletM.findOne({ userID: id }).lean()) || ensureWallet(id);
}

async function addMoney(userID, amount) {
  await connect();
  await ensureWallet(userID);
  return WalletM.findOneAndUpdate(
    { userID: String(userID) },
    { $inc: { money: Number(amount), totalEarned: Math.max(0, Number(amount)) }, $set: { updatedAt: now() } },
    { new: true }
  ).lean();
}

async function removeMoney(userID, amount) {
  await connect();
  const id = String(userID);
  await ensureWallet(id);
  const w = await WalletM.findOne({ userID: id }).lean();
  if ((w?.money || 0) < amount) return { success: false, balance: w?.money || 0 };
  const u = await WalletM.findOneAndUpdate(
    { userID: id },
    { $inc: { money: -Number(amount) }, $set: { updatedAt: now() } },
    { new: true }
  ).lean();
  return { success: true, balance: u.money };
}

async function addBank(userID, amount) {
  await connect();
  await ensureWallet(userID);
  return WalletM.findOneAndUpdate(
    { userID: String(userID) },
    { $inc: { bank: Number(amount) }, $set: { updatedAt: now() } },
    { new: true }
  ).lean();
}

async function removeBank(userID, amount) {
  await connect();
  const id = String(userID);
  await ensureWallet(id);
  const w = await WalletM.findOne({ userID: id }).lean();
  if ((w?.bank || 0) < amount) return { success: false, balance: w?.bank || 0 };
  const u = await WalletM.findOneAndUpdate(
    { userID: id },
    { $inc: { bank: -Number(amount) }, $set: { updatedAt: now() } },
    { new: true }
  ).lean();
  return { success: true, balance: u.bank };
}

async function addExp(userID, amount = 1) {
  await connect();
  await ensureWallet(userID);
  const id     = String(userID);
  const before = await WalletM.findOne({ userID: id }).lean();
  const newExp = (before?.exp || 0) + Number(amount);
  const newLvl = calcLevel(newExp);
  const rank   = rankName(newLvl);
  const levelUp = newLvl > (before?.level || 1);
  await WalletM.findOneAndUpdate(
    { userID: id },
    { $set: { exp: newExp, level: newLvl, rank: rank.name, rankEmoji: rank.emoji, updatedAt: now() } }
  );
  return { exp: newExp, level: newLvl, levelUp, rank };
}

const increaseMoney = (u, a) => addMoney(u, a);
const decreaseMoney = (u, a) => removeMoney(u, a);
const getData       = (u)    => getWallet(u);

// ══════════════════════════════════════════════════
//  BANS
// ══════════════════════════════════════════════════
async function banUser(userID, reason = '', bannedBy = '', duration = 0) {
  await connect();
  const id        = String(userID);
  const expiresAt = duration > 0 ? new Date(Date.now() + duration * 60000).toISOString() : null;
  const entry = await BanM.findOneAndUpdate(
    { userID: id },
    { $set: { banned: true, reason, bannedBy, bannedAt: now(), expiresAt, unbannedAt: null, unbannedBy: '' },
      $push: { history: { action: 'ban', reason, by: bannedBy, at: now() } } },
    { upsert: true, new: true }
  ).lean();
  global.data?.userBanned?.set(id, { reason, dateAdded: now(), expiresAt });
  return entry;
}

async function unbanUser(userID, unbannedBy = '') {
  await connect();
  const id = String(userID);
  const b  = await BanM.findOne({ userID: id }).lean();
  if (!b?.banned) return false;
  await BanM.findOneAndUpdate(
    { userID: id },
    { $set: { banned: false, unbannedAt: now(), unbannedBy },
      $push: { history: { action: 'unban', by: unbannedBy, at: now() } } }
  );
  global.data?.userBanned?.delete(id);
  return true;
}

async function getBan(userID) {
  await connect();
  return BanM.findOne({ userID: String(userID) }).lean();
}

async function getAllBans() {
  await connect();
  return BanM.find({ banned: true }).lean();
}

// ══════════════════════════════════════════════════
//  KICKED
// ══════════════════════════════════════════════════
async function kickUser(userID, reason = '', kickedBy = '') {
  await connect();
  const id = String(userID);
  const entry = await KickM.findOneAndUpdate(
    { userID: id },
    { $set: { reason, kickedBy: String(kickedBy), kickedAt: now() } },
    { upsert: true, new: true }
  ).lean();
  if (!global._kickedUsers) global._kickedUsers = new Map();
  global._kickedUsers.set(id, entry);
  return entry;
}

async function unkickUser(userID) {
  await connect();
  const r = await KickM.deleteOne({ userID: String(userID) });
  global._kickedUsers?.delete(String(userID));
  return r.deletedCount > 0;
}

async function getKick(userID) {
  await connect();
  return KickM.findOne({ userID: String(userID) }).lean();
}

async function getAllKicked() {
  await connect();
  return KickM.find({}).lean();
}

// ══════════════════════════════════════════════════
//  THREADS
// ══════════════════════════════════════════════════
async function getThread(threadID) {
  await connect();
  return ThreadM.findOne({ threadID: String(threadID) }).lean();
}

async function setThread(threadID, data) {
  await connect();
  const id = String(threadID);
  return ThreadM.findOneAndUpdate(
    { threadID: id },
    { $set: { ...data, updatedAt: now() }, $setOnInsert: { threadID: id, createdAt: now() } },
    { upsert: true, new: true }
  ).lean();
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
  await connect();
  return ThreadM.find({}).lean();
}

// ══════════════════════════════════════════════════
//  HISTORY
// ══════════════════════════════════════════════════
async function logEvent(type, data) {
  await connect();
  const key = `${Date.now()}_${type}`;
  await HistoryM.create({ key, type, data, at: now() }).catch(() => {});
  const count = await HistoryM.countDocuments();
  if (count > 500) {
    const oldest = await HistoryM.find({}).sort({ at: 1 }).limit(count - 500).select('_id');
    await HistoryM.deleteMany({ _id: { $in: oldest.map(o => o._id) } });
  }
}

async function getHistory(limit = 20) {
  await connect();
  return HistoryM.find({}).sort({ at: -1 }).limit(limit).lean();
}

// ══════════════════════════════════════════════════
//  ANALYSIS
// ══════════════════════════════════════════════════
async function getAnalysis(userID) {
  await connect();
  return AnalysisM.findOne({ userID: String(userID) }).lean();
}

async function setAnalysis(userID, data) {
  await connect();
  const id = String(userID);
  return AnalysisM.findOneAndUpdate(
    { userID: id },
    { $set: { data, updatedAt: now() }, $setOnInsert: { userID: id, createdAt: now() } },
    { upsert: true, new: true }
  ).lean();
}

async function getAllAnalysis() {
  await connect();
  return AnalysisM.find({}).lean();
}

// ══════════════════════════════════════════════════
//  ملفات مخصصة
// ══════════════════════════════════════════════════
async function createCustomFile(filePath, initialData = {}) {
  await connect();
  await CustomFileM.findOneAndUpdate({ filePath }, { $setOnInsert: { filePath, data: initialData } }, { upsert: true });
  return filePath;
}

async function readCustomFile(filePath) { return loadFile(filePath); }

async function writeCustomFile(filePath, data) {
  await connect();
  await CustomFileM.findOneAndUpdate({ filePath }, { $set: { data } }, { upsert: true });
  return true;
}

// ══════════════════════════════════════════════════
//  إحصائيات
// ══════════════════════════════════════════════════
async function stats() {
  await connect();
  const [users, wallets, bans, threads] = await Promise.all([
    UserM.countDocuments(),
    WalletM.countDocuments(),
    BanM.countDocuments({ banned: true }),
    ThreadM.countDocuments(),
  ]);
  return { users, wallets, activeBans: bans, threads, pendingSave: 0, cachedFiles: 0 };
}

// ══════════════════════════════════════════════════
//  تحميل الذاكرة عند البدء
// ══════════════════════════════════════════════════
;(async () => {
  try {
    await connect();
    if (!global.data)                global.data               = {};
    if (!global.data.userBanned)     global.data.userBanned    = new Map();
    if (!global.data.threadBanned)   global.data.threadBanned  = new Map();
    if (!global._kickedUsers)        global._kickedUsers       = new Map();

    const nowMs = Date.now();
    const [bans, bannedThreads, kicked] = await Promise.all([
      BanM.find({ banned: true }).lean(),
      ThreadM.find({ banned: true }).lean(),
      KickM.find({}).lean(),
    ]);

    for (const b of bans) {
      if (b.expiresAt && new Date(b.expiresAt).getTime() <= nowMs) continue;
      global.data.userBanned.set(b.userID, { reason: b.reason || '', dateAdded: b.bannedAt || '', expiresAt: b.expiresAt || null });
    }
    for (const t of bannedThreads) {
      global.data.threadBanned.set(t.threadID, { reason: t.banReason || '', dateAdded: t.bannedAt || '' });
    }
    for (const k of kicked) {
      global._kickedUsers.set(k.userID, k);
    }
    console.log(`[DATA] ✅ loaded: ${bans.length} bans | ${bannedThreads.length} banned threads | ${kicked.length} kicked`);
  } catch(e) {
    console.error('[DATA] startup error:', e.message);
  }
})();

// ══════════════════════════════════════════════════
//  export — نفس الـ API القديم بالكامل
// ══════════════════════════════════════════════════
module.exports = {
  getUser, setUser, ensureUser, deleteUser, getAllUsers, incrementMessages,
  getWallet, ensureWallet,
  addMoney, removeMoney, addBank, removeBank, addExp,
  increaseMoney, decreaseMoney, getData,
  banUser, unbanUser, getBan, getAllBans,
  kickUser, unkickUser, getKick, getAllKicked,
  getThread, setThread, banThread, unbanThread, getAllThreads,
  logEvent, getHistory,
  getAnalysis, setAnalysis, getAllAnalysis,
  createCustomFile, readCustomFile, writeCustomFile,
  flushAll, reload, stats,
  loadFile, saveFile, scheduleSave,
  _cache, FILES,
};
