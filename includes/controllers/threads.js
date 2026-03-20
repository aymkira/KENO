// ══════════════════════════════════════════════════════════════
//  threads.js v2.0 — bridge كامل لـ data.js
// ══════════════════════════════════════════════════════════════

const path = require('path');

function getDB() {
  try { return require(path.join(process.cwd(), 'includes', 'data.js')); }
  catch(e) { throw new Error('[Threads] فشل تحميل data.js: ' + e.message); }
}

module.exports = function ({ models, api }) {

  const db = getDB();

  // ── getInfo — من Facebook API ─────────────────────────────
  async function getInfo(threadID) {
    try { return await api.getThreadInfo(threadID); }
    catch(e) { throw new Error('[Threads.getInfo] ' + e.message); }
  }

  // ── getAll ────────────────────────────────────────────────
  async function getAll(...args) {
    const threads = await db.loadFile(db.FILES.THREADS);
    let result = Object.values(threads);
    for (const a of args) {
      if (Array.isArray(a)) {
        result = result.map(t => {
          const obj = {};
          for (const k of a) obj[k] = t[k];
          return obj;
        });
      } else if (typeof a === 'object' && a !== null) {
        result = result.filter(t =>
          Object.entries(a).every(([k, v]) => t[k] == v)
        );
      }
    }
    return result;
  }

  // ── getData ───────────────────────────────────────────────
  // الأوامر القديمة: const threadRaw = await getData(threadID)
  // تتوقع { threadInfo, data } — نرجعها بنفس الشكل
  async function getData(threadID) {
    const thread = await db.getThread(threadID);
    if (!thread) return false;
    // توافق مع الشكل القديم
    return {
      threadID: thread.threadID,
      threadInfo: thread.threadInfo || {},
      data: thread.data || thread,   // بعض الأوامر تقرأ .data مباشرة
      ...thread,
    };
  }

  // ── setData ───────────────────────────────────────────────
  async function setData(threadID, options = {}) {
    await db.setThread(threadID, options);
    return true;
  }

  // ── delData ───────────────────────────────────────────────
  async function delData(threadID) {
    const threads = await db.loadFile(db.FILES.THREADS);
    const id = String(threadID);
    if (!threads[id]) return false;
    delete threads[id];
    db.scheduleSave(db.FILES.THREADS);
    return true;
  }

  // ── createData ────────────────────────────────────────────
  async function createData(threadID, defaults = {}) {
    const existing = await db.getThread(threadID);
    if (!existing) await db.setThread(threadID, { data: {}, threadInfo: {}, ...defaults });
    else if (Object.keys(defaults).length) await db.setThread(threadID, defaults);
    return true;
  }

  return {
    getInfo,
    getAll,
    getData,
    setData,
    delData,
    createData,
  };
};
