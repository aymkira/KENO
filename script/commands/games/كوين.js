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
    name: "كوين",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "ayman",
    description: "لعبة ملك أو كتابة",
    commandCategory: "games",
    usages: "[ملك/كتابة] [المبلغ]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const BOT = getBotName();
    const db = getDB();
    if (!db) return api.sendMessage("❌ data.js غير موجود", threadID, messageID);

    const header = `⌬ ━━━━━━━━━━━━ ⌬\n⌬ ━━ ${BOT} GAMES ━━ ⌬\n      لعبة التوقع\n⌬ ━━━━━━━━━━━━ ⌬`;
    const choice  = args[0];
    const bet     = parseInt(args[1]);
    const options = ["ملك", "كتابة"];

    if (!options.includes(choice) || isNaN(bet) || bet < 50)
        return api.sendMessage(`${header}\n\n⚠️ استخدم: .كوين [ملك/كتابة] [المبلغ]`, threadID, messageID);

    await db.ensureUser(senderID);
    const wallet = await db.getWallet(senderID);
    if (wallet.money < bet) return api.sendMessage(`${header}\n\n❌ رصيدك لا يكفي للرهان!`, threadID, messageID);

    const result = options[Math.floor(Math.random() * options.length)];

    if (choice === result) {
        await db.addMoney(senderID, bet);
        return api.sendMessage(`${header}\n\n✅ النتيجة: [ ${result} ]\n💰 ربحت: +${bet.toLocaleString()}$`, threadID, messageID);
    } else {
        await db.removeMoney(senderID, bet);
        return api.sendMessage(`${header}\n\n❌ النتيجة: [ ${result} ]\n🗑️ خسرت: -${bet.toLocaleString()}$`, threadID, messageID);
    }
};
