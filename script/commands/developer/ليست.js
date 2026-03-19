const path = require("path");

function loadConfig() {
  const fs = require("fs");
  for (const p of [
    path.join(__dirname, "../../..", "config.json"),
    path.join(process.cwd(), "config.json"),
  ]) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch(_){} }
  return {};
}
const CFG       = loadConfig();
const ADMIN_IDS = (CFG.ADMINBOT || ["61580139921634"]).map(String);

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); }
  catch { return null; }
}

module.exports.config = {
  name: "ليست",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "ayman",
  description: "عرض المحظورين (أشخاص + مجموعات) وحذفهم",
  commandCategory: "developer",
  usages: ".ليست ← أشخاص محظورين\n.ليست كروب ← مجموعات محظورة\n.ليست [رقم] ← حذف شخص\n.ليست كروب [رقم] ← حذف مجموعة",
  cooldowns: 3,
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage("🚫 للمطور فقط.", threadID, messageID);

  const db = getDB();
  if (!db) return api.sendMessage("❌ data.js مو موجود", threadID, messageID);

  const isGroup = args[0]?.toLowerCase() === "كروب";

  // ══════════════════════════════════════════
  //  قسم المجموعات
  // ══════════════════════════════════════════
  if (isGroup) {
    const threadsDB = await db.loadFile("group/threads.json");
    const banned    = Object.values(threadsDB).filter(t => t.banned);

    if (banned.length === 0)
      return api.sendMessage("✅ ما في مجموعات محظورة", threadID, messageID);

    // حذف مجموعة
    const num = parseInt(args[1]);
    if (!isNaN(num)) {
      const target = banned[num - 1];
      if (!target)
        return api.sendMessage(`❌ الرقم ${num} مو موجود`, threadID, messageID);

      const id = String(target.threadID);
      const newThreads = { ...threadsDB };
      delete newThreads[id];
      await db.writeCustomFile("group/threads.json", newThreads, `delete thread ban ${id}`);
      global.data?.threadBanned?.delete(id);

      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم رفع حظر المجموعة:\n📛 ${target.threadName || id}\n🆔 ${id}`,
        threadID, messageID
      );
    }

    // عرض قائمة المجموعات
    let msg = `⌬ ━━ 𝗞𝗜𝗥𝗔 GROUPLIST ━━ ⌬\n\n🚫 المجموعات المحظورة (${banned.length}):\n\n`;
    for (let i = 0; i < banned.length; i++) {
      const t = banned[i];
      msg += `${i + 1}. 📛 ${t.threadName || "بدون اسم"}\n`;
      msg += `   🆔 ${t.threadID}\n`;
      msg += `   📋 ${t.banReason || t.reason || "لا يوجد سبب"}\n`;
      msg += `   🕐 ${t.bannedAt || "—"}\n\n`;
    }
    msg += "━━━━━━━━━━━━━━━━━━━━\n";
    msg += "💡 لرفع الحظر: .ليست كروب [الرقم]";
    return api.sendMessage(msg, threadID, messageID);
  }

  // ══════════════════════════════════════════
  //  قسم الأشخاص
  // ══════════════════════════════════════════
  const bansDB = await db.loadFile("user/bans.json");
  const banned = Object.values(bansDB).filter(b => b.banned);

  if (banned.length === 0)
    return api.sendMessage("✅ ما في أحد محظور حالياً", threadID, messageID);

  // حذف شخص
  const num = parseInt(args[0]);
  if (!isNaN(num)) {
    const target = banned[num - 1];
    if (!target)
      return api.sendMessage(`❌ الرقم ${num} مو موجود`, threadID, messageID);

    const id = String(target.userID);
    const newBans = { ...bansDB };
    delete newBans[id];
    await db.writeCustomFile("user/bans.json", newBans, `delete ban ${id}`);
    global.data?.userBanned?.delete(id);

    let name = id;
    try { name = await Users.getNameUser(id) || id; } catch(_) {}

    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n✅ تم رفع الحظر:\n👤 ${name}\n🆔 ${id}`,
      threadID, messageID
    );
  }

  // عرض قائمة الأشخاص
  let msg = `⌬ ━━ 𝗞𝗜𝗥𝗔 BANLIST ━━ ⌬\n\n🚫 المحظورين (${banned.length}):\n\n`;
  for (let i = 0; i < banned.length; i++) {
    const b = banned[i];
    let name = b.userID;
    try { name = await Users.getNameUser(b.userID) || b.userID; } catch(_) {}

    const expires = b.expiresAt
      ? `⏳ ${new Date(b.expiresAt).toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad", hour12: false })}`
      : "♾️ أبدي";

    msg += `${i + 1}. 👤 ${name}\n`;
    msg += `   🆔 ${b.userID}\n`;
    msg += `   📋 ${b.reason || "لا يوجد سبب"}\n`;
    msg += `   ${expires}\n\n`;
  }
  msg += "━━━━━━━━━━━━━━━━━━━━\n";
  msg += "💡 لرفع الحظر: .ليست [الرقم]\n";
  msg += "📋 المجموعات: .ليست كروب";

  return api.sendMessage(msg, threadID, messageID);
};
