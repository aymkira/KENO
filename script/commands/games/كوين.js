const path = require("path");

module.exports.config = {
    name: "كوين",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "ayman",
    description: "لعبة ملك أو كتابة بالهيدر الأصلي",
    commandCategory: "games",
    usages: "[ملك/كتابة] [المبلغ]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const db = require(path.join(process.cwd(), "includes", "data.js"));

    const header = `⌬ ━━━━━━━━━━━━ ⌬\n      لعبة التوقع\n⌬ ━━━━━━━━━━━━ ⌬`;
    const choice = args[0];
    const bet = parseInt(args[1]);
    const options = ["ملك", "كتابة"];

    if (!options.includes(choice) || isNaN(bet) || bet < 50) {
        return api.sendMessage(`${header}\n\n⚠️ استخدم: .كوين [ملك/كتابة] [المبلغ]`, threadID, messageID);
    }

    const wallet = await db.getWallet(senderID);
    if (wallet.money < bet) return api.sendMessage(`${header}\n\n❌ رصيدك لا يكفي للرهان!`, threadID, messageID);

    const result = options[Math.floor(Math.random() * options.length)];

    if (choice === result) {
        await db.addMoney(senderID, bet);
        return api.sendMessage(`${header}\n\n✅ النتيجة: [ ${result} ]\n💰 ربحت: +${bet}$`, threadID, messageID);
    } else {
        await db.removeMoney(senderID, bet);
        return api.sendMessage(`${header}\n\n❌ النتيجة: [ ${result} ]\n🗑️ خسرت: -${bet}$`, threadID, messageID);
    }
};
