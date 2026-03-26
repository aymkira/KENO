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
    name: "نرد",
    version: "3.2.0",
    hasPermssion: 0,
    credits: "ايمن",
    description: "لعبة نرد تضاعف فلوسك",
    commandCategory: "games",
    usages: "نرد (المبلغ)",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const BOT = getBotName();

    const db = getDB();
    if (!db) return api.sendMessage("❌ data.js غير موجود", threadID, messageID);

    await db.ensureUser(senderID);
    const wallet  = await db.getWallet(senderID);
    const balance = wallet.money ?? 0;

    let bet = args[0];

    if (!bet || isNaN(bet) || parseInt(bet) <= 0)
        return api.sendMessage(`⌬ ━━ ${BOT} GAMES ━━ ⌬\n\n⚠️ يرجى كتابة مبلغ صحيح للرهان!\nمثال: .نرد 100`, threadID, messageID);

    bet = parseInt(bet);

    if (bet > balance)
        return api.sendMessage(`⌬ ━━ ${BOT} GAMES ━━ ⌬\n\n❌ رصيدك غير كافٍ! رصيدك الحالي هو: ${balance.toLocaleString()}$`, threadID, messageID);

    const dice = Math.floor(Math.random() * 6) + 1;
    const diceEmoji = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][dice - 1];

    if (dice > 3) {
        await db.addMoney(senderID, bet);
        return api.sendMessage(`⌬ ━━ ${BOT} WIN ━━ ⌬\n\n🎲 النرد: ${diceEmoji}\n📈 النتيجة: ${dice}\n\n✅ مبروك! فزت بـ ${bet.toLocaleString()}$\nرصيدك الحالي: ${(balance + bet).toLocaleString()}$`, threadID, messageID);
    } else {
        await db.removeMoney(senderID, bet);
        return api.sendMessage(`⌬ ━━ ${BOT} LOSE ━━ ⌬\n\n🎲 النرد: ${diceEmoji}\n📉 النتيجة: ${dice}\n\n❌ للأسف خسرت ${bet.toLocaleString()}$\nرصيدك المتبقي: ${(balance - bet).toLocaleString()}$`, threadID, messageID);
    }
};
