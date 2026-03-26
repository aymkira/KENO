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
    name: "اسرق",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "ayman",
    description: "سرقة الرصيد",
    commandCategory: "games",
    usages: "[@tag]",
    cooldowns: 20
};

module.exports.run = async function({ api, event }) {
    const { threadID, messageID, senderID, mentions } = event;
    const BOT = getBotName();
    const db = getDB();
    if (!db) return api.sendMessage("❌ data.js غير موجود", threadID, messageID);

    const header = `⌬ ━━━━━━━━━━━━ ⌬\n    ⌬ ━━ ${BOT} ━━ ⌬\n      عملية سرقة\n⌬ ━━━━━━━━━━━━ ⌬`;

    if (Object.keys(mentions).length == 0)
        return api.sendMessage(`${header}\n\n⚠️ يجب منشن الضحية للسرقة!`, threadID, messageID);

    const victimID = Object.keys(mentions)[0];
    const victimWallet = await db.getWallet(victimID);
    if (!victimWallet || victimWallet.money < 200)
        return api.sendMessage(`${header}\n\n❌ الضحية طفرانة، ابحث عن غيرها!`, threadID, messageID);

    const success = Math.random() > 0.7;

    if (success) {
        const amount = Math.floor(Math.random() * 200) + 100;
        await db.removeMoney(victimID, amount);
        await db.addMoney(senderID, amount);
        return api.sendMessage(`${header}\n\n🥷 نجحت العملية!\n💰 سرقت مبلغ: ${amount.toLocaleString()}$`, threadID, messageID);
    } else {
        const fine = 150;
        await db.removeMoney(senderID, fine);
        return api.sendMessage(`${header}\n\n🚓 كبسة! فشلت العملية.\n💸 تم تغريمك: ${fine.toLocaleString()}$`, threadID, messageID);
    }
};
