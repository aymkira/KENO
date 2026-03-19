const path = require("path");

module.exports.config = {
    name: "اسرق",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "ayman",
    description: "سرقة الرصيد بالهيدر الأصلي",
    commandCategory: "games",
    usages: "[@tag]",
    cooldowns: 20
};

module.exports.run = async function({ api, event }) {
    const { threadID, messageID, senderID, mentions } = event;
    const db = require(path.join(process.cwd(), "includes", "data.js"));
    const header = `⌬ ━━━━━━━━━━━━ ⌬\n      عملية سرقة\n⌬ ━━━━━━━━━━━━ ⌬`;

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
        return api.sendMessage(`${header}\n\n🥷 نجحت العملية!\n💰 سرقت مبلغ: ${amount}$`, threadID, messageID);
    } else {
        const fine = 150;
        await db.removeMoney(senderID, fine);
        return api.sendMessage(`${header}\n\n🚓 كبسة! فشلت العملية.\n💸 تم تغريمك: ${fine}$`, threadID, messageID);
    }
};
