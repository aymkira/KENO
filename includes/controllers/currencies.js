// ══════════════════════════════════════════════════════════════
//  currencies.js v2.0 — bridge كامل لـ data.js
//  كل الأوامر اللي تستخدم Currencies تشتغل بدون تعديل
// ══════════════════════════════════════════════════════════════

const path = require('path');

function getDB() {
  try { return require(path.join(process.cwd(), 'includes', 'data.js')); }
  catch(e) { throw new Error('[Currencies] فشل تحميل data.js: ' + e.message); }
}

module.exports = function ({ models }) {

  const db = getDB();

  // ── getData — أكثر دالة مستخدمة ──────────────────────────
  // الأوامر القديمة: (await Currencies.getData(senderID)).money
  async function getData(userID) {
    return db.getWallet(userID);
  }

  // ── getAll ────────────────────────────────────────────────
  async function getAll(...args) {
    const wallets = await db.loadFile(db.FILES.WALLET);
    let result = Object.values(wallets);
    // دعم where/attributes بشكل بسيط
    for (const a of args) {
      if (Array.isArray(a)) {
        // attributes — رجع حقول معينة فقط
        result = result.map(w => {
          const obj = {};
          for (const k of a) obj[k] = w[k];
          return obj;
        });
      } else if (typeof a === 'object' && a !== null) {
        // where — فلتر
        result = result.filter(w =>
          Object.entries(a).every(([k, v]) => w[k] == v)
        );
      }
    }
    return result;
  }

  // ── setData ───────────────────────────────────────────────
  async function setData(userID, options = {}) {
    await db.ensureWallet(userID);
    const wallets = await db.loadFile(db.FILES.WALLET);
    const id = String(userID);
    Object.assign(wallets[id], options);
    db._cache && db._cache[db.FILES.WALLET] && (db._cache[db.FILES.WALLET].data = wallets);
    db.scheduleSave(db.FILES.WALLET);
    return true;
  }

  // ── delData ───────────────────────────────────────────────
  async function delData(userID) {
    const wallets = await db.loadFile(db.FILES.WALLET);
    const id = String(userID);
    if (!wallets[id]) return false;
    delete wallets[id];
    db.scheduleSave(db.FILES.WALLET);
    return true;
  }

  // ── createData ────────────────────────────────────────────
  async function createData(userID, defaults = {}) {
    await db.ensureWallet(userID);
    if (Object.keys(defaults).length) await setData(userID, defaults);
    return true;
  }

  // ── increaseMoney ─────────────────────────────────────────
  async function increaseMoney(userID, money) {
    await db.addMoney(userID, money);
    return true;
  }

  // ── decreaseMoney ─────────────────────────────────────────
  async function decreaseMoney(userID, money) {
    const result = await db.removeMoney(userID, money);
    return result.success;
  }

  return {
    getData,
    getAll,
    setData,
    delData,
    createData,
    increaseMoney,
    decreaseMoney,
  };
};
