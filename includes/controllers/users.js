// ══════════════════════════════════════════════════════════════
//  users.js v2.0 — bridge كامل لـ data.js
// ══════════════════════════════════════════════════════════════

const path = require('path');

function getDB() {
  try { return require(path.join(process.cwd(), 'includes', 'data.js')); }
  catch(e) { throw new Error('[Users] فشل تحميل data.js: ' + e.message); }
}

module.exports = function ({ models, api }) {

  const db = getDB();

  // ── getInfo — من Facebook API مباشرة ─────────────────────
  async function getInfo(id) {
    return (await api.getUserInfo(id))[id];
  }

  // ── getNameUser ───────────────────────────────────────────
  async function getNameUser(id) {
    try {
      if (global.data.userName.has(id)) return global.data.userName.get(id);
      const user = await db.getUser(id);
      if (user?.name) return user.name;
      return 'Facebook User';
    } catch { return 'Facebook User'; }
  }

  // ── getAll ────────────────────────────────────────────────
  async function getAll(...args) {
    const users = await db.loadFile(db.FILES.USERS);
    let result = Object.values(users);
    for (const a of args) {
      if (Array.isArray(a)) {
        result = result.map(u => {
          const obj = {};
          for (const k of a) obj[k] = u[k];
          return obj;
        });
      } else if (typeof a === 'object' && a !== null) {
        result = result.filter(u =>
          Object.entries(a).every(([k, v]) => u[k] == v)
        );
      }
    }
    return result;
  }

  // ── getData ───────────────────────────────────────────────
  async function getData(userID) {
    return db.getUser(userID);
  }

  // ── setData ───────────────────────────────────────────────
  async function setData(userID, options = {}) {
    await db.setUser(userID, options);
    return true;
  }

  // ── delData ───────────────────────────────────────────────
  async function delData(userID) {
    return db.deleteUser(userID);
  }

  // ── createData ────────────────────────────────────────────
  async function createData(userID, defaults = {}) {
    await db.ensureUser(userID, defaults.name || '');
    if (Object.keys(defaults).length) await db.setUser(userID, defaults);
    return true;
  }

  return {
    getInfo,
    getNameUser,
    getAll,
    getData,
    setData,
    delData,
    createData,
  };
};
