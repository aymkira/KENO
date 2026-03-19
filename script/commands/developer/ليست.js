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
  version: "1.0.0",
  hasPermssion: 2,
  credits: "ayman",
  description: "عرض المحظورين وحذفهم من bans.json",
  commandCategory: "developer",
  usages: ".ليست ← عرض المحظورين\n.ليست [رقم] ← حذف من bans.json",
  cooldowns: 3,
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage("🚫 للمطور فقط.", threadID, messageID);

  const db = getDB();
  if (!db) return api.sendMessage("❌ data.js مو موجود", threadID, messageID);

  const bansDB = await db.loadFile("user/bans.json");
  const banned = Object.values(bansDB).filter(b => b.banned);

  if (banned.length === 0)
    return api.sendMessage("✅ ما في أحد محظور حالياً", threadID, messageID);

  // لو أرسل رقم = حذف من bans.json فقط
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

  // عرض القائمة
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
  msg += "💡 لرفع الحظر: .ليست [الرقم]";

  return api.sendMessage(msg, threadID, messageID);
};
