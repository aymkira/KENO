const path = require("path");

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); }
  catch { return null; }
}

function getBotName() {
  try {
    const cfg = require(path.join(process.cwd(), "config.json"));
    return cfg.BOTNAME || "BOT";
  } catch { return "BOT"; }
}

module.exports.config = {
    name: "هدية",
    version: "2.2.0",
    hasPermssion: 0,
    credits: "أيمن",
    description: "احصل على هدية بمبلغ عشوائي",
    commandCategory: "games",
    usages: "هدية",
    cooldowns: 10
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const H = "⌬ ━━━━━━━━━━━━ ⌬";
    const BOT = getBotName();

    const db = getDB();
    if (!db) return api.sendMessage(`${H}\n❌ data.js غير موجود`, threadID, messageID);

    await db.ensureUser(senderID);

    const amounts = [500, 1000, 1050, 1600, 1400, 1581, 1980, 4231, 5482, 9910, 100000];
    const reward  = amounts[Math.floor(Math.random() * amounts.length)];

    await db.addMoney(senderID, reward);
    const newWallet  = await db.getWallet(senderID);
    const newBalance = newWallet.money ?? 0;

    return api.sendMessage(
        `${H}\n⌬ ━━ ${BOT} GAMES ━━ ⌬\n${H}\n\n🎁 حصلت على هدية!\n\n⪼ المبلغ: +${reward.toLocaleString()}$\n⪼ رصيدك الجديد: ${newBalance.toLocaleString()}$\n\n${H}`,
        threadID, messageID
    );
};
