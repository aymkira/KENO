module.exports.config = {
    name: "سلوت",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "عمر",
    description: "لعبة سلوت — الحد الأدنى للرهان 10,000$",
    commandCategory: "games",
    usages: "سلوت [مبلغ]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const H = "⌬ ━━━━━━━━━━━━ ⌬";

    const slotItems = ["🚀","⏳","👓","🔦","💡","🕯️","🥽","🎲","🔥","🔔","🏺","🌙","🐣"];
    const minBet = 10000;

    const data = await Currencies.getData(senderID);
    const money = data.money;
    const coin = parseInt(args[0]);

    if (!args[0] || isNaN(coin) || coin < 0)
        return api.sendMessage(
            `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n❌ أدخل مبلغاً صحيحاً للرهان!\n\n⪼ الاستخدام: مراهنة2 [مبلغ]\n⪼ الحد الأدنى: ${minBet.toLocaleString()}$\n\n${H}`,
            threadID, messageID
        );

    if (coin < minBet)
        return api.sendMessage(
            `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n⚠️ المبلغ أقل من الحد المسموح!\n\n⪼ رهانك: ${coin.toLocaleString()}$\n⪼ الحد الأدنى: ${minBet.toLocaleString()}$\n\n${H}`,
            threadID, messageID
        );

    if (coin > money)
        return api.sendMessage(
            `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n💸 رصيدك ما يكفي!\n\n⪼ رصيدك الحالي: ${money.toLocaleString()}$\n⪼ الرهان المطلوب: ${coin.toLocaleString()}$\n\n${H}`,
            threadID, messageID
        );

    const n = [0,1,2].map(() => Math.floor(Math.random() * slotItems.length));
    const line = `${slotItems[n[0]]} ⌬ ${slotItems[n[1]]} ⌬ ${slotItems[n[2]]}`;

    const allSame = n[0] === n[1] && n[1] === n[2];
    const twoSame = n[0]===n[1] || n[0]===n[2] || n[1]===n[2];
    const win = allSame || twoSame;
    const reward = allSame ? coin * 8 : coin;

    if (win) {
        await Currencies.increaseMoney(senderID, reward);
        return api.sendMessage(
            `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n${line}\n\n✅ فزت! تهانينا 🎉\n\n⪼ الرهان: ${coin.toLocaleString()}$\n⪼ الربح: +${reward.toLocaleString()}$\n⪼ رصيدك الجديد: ${(money + reward).toLocaleString()}$\n\n${H}`,
            threadID, messageID
        );
    } else {
        await Currencies.decreaseMoney(senderID, coin);
        return api.sendMessage(
            `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n${line}\n\n❌ خسرت! حظاً أوفر 😔\n\n⪼ الرهان: ${coin.toLocaleString()}$\n⪼ الخسارة: -${coin.toLocaleString()}$\n⪼ رصيدك الجديد: ${(money - coin).toLocaleString()}$\n\n${H}`,
            threadID, messageID
        );
    }
};
