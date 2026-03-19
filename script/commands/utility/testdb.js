const path = require("path");

module.exports.config = {
  name: "testdb",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "Ayman",
  description: "فحص شامل لكل الأوامر المرتبطة بـ data.js",
  commandCategory: "developer",
  usages: "testdb",
  cooldowns: 10
};

// ══════════════════════════════════════════
//  كل الأوامر المرتبطة بـ data.js
// ══════════════════════════════════════════
const LINKED_COMMANDS = [
  // games
  { name: "بلاك",    file: "script/commands/games/بلاك.js",    ops: ["getWallet","addMoney","removeMoney","ensureWallet"] },
  { name: "روليت",   file: "script/commands/games/روليت.js",   ops: ["getWallet","addMoney","removeMoney"] },
  { name: "سلوتس",   file: "script/commands/games/سلوتس.js",   ops: ["getWallet","addMoney","removeMoney"] },
  { name: "حظ",      file: "script/commands/games/حظ.js",      ops: ["getWallet","addMoney","removeMoney"] },
  { name: "توقع",    file: "script/commands/games/توقع.js",    ops: ["getWallet","addMoney","removeMoney"] },
  { name: "تجميع",   file: "script/commands/games/تجميع.js",   ops: ["addMoney"] },
  { name: "كوين",    file: "script/commands/games/كوين.js",    ops: ["getWallet","addMoney","removeMoney"] },
  { name: "اسرق",    file: "script/commands/games/سرقة.js",    ops: ["getWallet","addMoney","removeMoney"] },
  { name: "كابوي",   file: "script/commands/games/كابوي.js",   ops: ["addMoney"] },
  { name: "اعلام",   file: "script/commands/games/اعلام.js",   ops: ["addMoney"] },
  { name: "وحش",     file: "script/commands/games/وحش.js",     ops: ["addExp"] },
  { name: "مملكة",   file: "script/commands/games/مملكة.js",   ops: ["addMoney","addExp"] },
  { name: "بنك",     file: "script/commands/games/بنك.js",     ops: ["getWallet","addBank"] },
  // developer
  { name: "بان",     file: "script/commands/developer/بان.js",   ops: ["banUser","logEvent"] },
  { name: "نوبان",   file: "script/commands/developer/نوبان.js", ops: ["saveFile","loadFile"] },
  { name: "زيادة",   file: "script/commands/developer/زيادة.js", ops: ["addMoney","addExp"] },
  { name: "تصفير",   file: "script/commands/developer/تصفير.js", ops: ["getWallet"] },
  { name: "داتا",    file: "script/commands/developer/داتا.js",  ops: ["getWallet","getUser"] },
  { name: "داتاست",  file: "script/commands/developer/داتاست.js",ops: ["setUser"] },
  { name: "اولبان",  file: "script/commands/developer/اولبان.js",ops: ["getAllBans"] },
  // utility
  { name: "تحليل",   file: "script/commands/utility/تحليل.js",  ops: ["getUser","getWallet"] },
  { name: "حلت",     file: "script/commands/utility/حلت.js",    ops: ["getWallet"] },
  // admin
  { name: "خبرة",    file: "script/commands/admin/خبرة.js",     ops: ["addExp"] },
];

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs");

  const db = (() => {
    try { return require(path.join(process.cwd(), "includes", "data.js")); }
    catch(e) { return null; }
  })();

  let msg = "⌬ ━━ 𝗧𝗘𝗦𝗧𝗗𝗕 ━━ ⌬\n\n";

  // ── 1. فحص data.js نفسه ──────────────────────
  if (!db) {
    return api.sendMessage("❌ data.js مو موجود أو فيه خطأ!", threadID, messageID);
  }
  msg += "✅ data.js — موجود ويعمل\n\n";

  // ── 2. فحص الاتصال بـ GitHub ─────────────────
  msg += "⏳ جاري الفحص...\n";
  const waitMsg = await api.sendMessage(msg, threadID);

  let githubOk = false;
  try {
    const stats = await db.stats();
    githubOk = true;
    msg = "⌬ ━━ 𝗧𝗘𝗦𝗧𝗗𝗕 ━━ ⌬\n\n";
    msg += "✅ data.js — موجود\n";
    msg += "✅ GitHub JSON — متصل\n\n";
    msg += `📊 الإحصائيات:\n`;
    msg += `👥 المستخدمين: ${stats.users}\n`;
    msg += `💰 المحافظ: ${stats.wallets}\n`;
    msg += `🚫 المحظورين: ${stats.activeBans}\n`;
    msg += `🏷️ المجموعات: ${stats.threads}\n\n`;
  } catch(e) {
    msg = "⌬ ━━ 𝗧𝗘𝗦𝗧𝗗𝗕 ━━ ⌬\n\n";
    msg += "✅ data.js — موجود\n";
    msg += `❌ GitHub JSON — فشل الاتصال\n   ${e.message}\n\n`;
  }

  // ── 3. فحص محفظة المستخدم الحالي ─────────────
  try {
    const wallet = await db.getWallet(senderID);
    msg += `💳 محفظتك:\n`;
    msg += `💵 الرصيد: ${wallet.money ?? 0} $\n`;
    msg += `⭐ XP: ${wallet.exp ?? 0}\n`;
    msg += `📊 الليفل: ${wallet.level ?? 1}\n`;
    msg += `🏅 الرانك: ${wallet.rank ?? 'مبتدئ'}\n\n`;
  } catch(e) {
    msg += `❌ فشل قراءة المحفظة: ${e.message}\n\n`;
  }

  // ── 4. فحص كل ملفات الأوامر ──────────────────
  msg += "━━━━━━━━━━━━━━━━━━━━\n";
  msg += "📁 فحص ملفات الأوامر:\n\n";

  let okCount = 0, missingCount = 0, mongoCount = 0;

  for (const cmd of LINKED_COMMANDS) {
    const filePath = path.join(process.cwd(), cmd.file);
    if (!fs.existsSync(filePath)) {
      msg += `❌ ${cmd.name} — الملف غير موجود\n`;
      missingCount++;
      continue;
    }
    const content = fs.readFileSync(filePath, "utf8");
    const hasMongo = content.includes("mongodb.js") || (content.includes("mongoose") && !content.includes("// wrappers"));
    if (hasMongo) {
      msg += `⚠️ ${cmd.name} — لا زال يستخدم mongodb!\n`;
      mongoCount++;
    } else {
      msg += `✅ ${cmd.name}\n`;
      okCount++;
    }
  }

  msg += "\n━━━━━━━━━━━━━━━━━━━━\n";
  msg += `✅ سليم: ${okCount}\n`;
  if (mongoCount > 0) msg += `⚠️ لا زال على mongodb: ${mongoCount}\n`;
  if (missingCount > 0) msg += `❌ ملفات ناقصة: ${missingCount}\n`;
  msg += "\n";

  // ── 5. فحص listen.js ─────────────────────────
  const listenPath = path.join(process.cwd(), "includes", "listen.js");
  if (fs.existsSync(listenPath)) {
    const listenContent = fs.readFileSync(listenPath, "utf8");
    if (listenContent.includes("dataJS.loadFile") || listenContent.includes("data.js")) {
      msg += "✅ listen.js — يحمل البانات من data.js\n";
    } else {
      msg += "⚠️ listen.js — ما يحمل البانات من data.js\n";
    }
  }

  // ── 6. فحص handleCommand.js ──────────────────
  const handlePath = path.join(process.cwd(), "includes", "handle", "handleCommand.js");
  if (fs.existsSync(handlePath)) {
    const handleContent = fs.readFileSync(handlePath, "utf8");
    if (handleContent.includes("getBan") || handleContent.includes("data.js")) {
      msg += "✅ handleCommand.js — يتحقق من البانات بـ data.js\n";
    } else {
      msg += "⚠️ handleCommand.js — ما يتحقق من data.js\n";
    }
  }

  api.unsendMessage(waitMsg.messageID);
  return api.sendMessage(msg, threadID, messageID);
};
