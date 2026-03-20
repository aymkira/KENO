const path = require("path");
const fs   = require("fs");

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); }
  catch { return null; }
}

const CHECKTT_FILE = "user/checktt.json";
const CACHE_PATH   = path.resolve(__dirname, "../commands/cache/checktt.json");

module.exports.config = {
  name:        "updateChecktt",
  eventType:   ["log:unsubscribe"],
  version:     "2.0.0",
  credits:     "ayman",
  description: "حذف بيانات التفاعل عند مغادرة العضو — مرتبط بـ data.js",
};

module.exports.run = async ({ event, api }) => {
  const { threadID, logMessageData } = event;
  const leftID = String(logMessageData?.leftParticipantFbId || "");

  if (!leftID || leftID === String(api.getCurrentUserID())) return;

  // ── حذف من data.js (GitHub JSON) ────────────────────────────
  const db = getDB();
  if (db) {
    try {
      const data = await db.loadFile(CHECKTT_FILE);
      const tid  = String(threadID);

      if (data[tid]?.users) {
        data[tid].users = data[tid].users.filter(u => String(u.id) !== leftID);
        await db.writeCustomFile(CHECKTT_FILE, data, `updateChecktt remove ${leftID}`);
      }
    } catch(_) {}
  }

  // ── حذف من الملف المحلي (fallback) ──────────────────────────
  if (!fs.existsSync(CACHE_PATH)) return;
  try {
    const raw  = fs.readFileSync(CACHE_PATH, "utf8");
    const list = JSON.parse(raw);

    const entry = list.find(i => String(i.threadID) === String(threadID));
    if (!entry?.data) return;

    const index = entry.data.findIndex(item => String(item.id) === leftID);
    if (index === -1) return;

    entry.data.splice(index, 1);
    fs.writeFileSync(CACHE_PATH, JSON.stringify(list, null, 2), "utf8");
  } catch(e) {
    console.error("[updateChecktt]", e.message);
  }
};
