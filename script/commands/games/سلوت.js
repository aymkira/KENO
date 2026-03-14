module.exports.config = {
    name: "سلوت",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أيمن",
    description: "لعبة سلوت — الحد الأدنى 10,000$",
    commandCategory: "games",
    usages: "سلوت [مبلغ]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const H = "⌬ ━━━━━━━━━━━━ ⌬";
    const minBet = 10000;
    const slots = ["🚀", "⏳", "👓", "🔦", "💡", "🕯️", "🥽", "🎲", "🔥", "🔔", "🏺", "🌙", "🐣"];

    const money = (await Currencies.getData(senderID)).money;
    const bet = parseInt(args[0]);

    if (!args[0] || isNaN(bet) || bet < 0)
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n❌ أدخل مبلغاً صحيحاً!\n\n⪼ الاستخدام: مراهنة2 [مبلغ]\n⪼ الحد الأدنى: ${minBet.toLocaleString()}$\n\n${H}`, threadID, messageID);

    if (bet < minBet)
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n⚠️ الحد الأدنى: ${minBet.toLocaleString()}$\n\n⪼ رهانك: ${bet.toLocaleString()}$\n\n${H}`, threadID, messageID);

    if (bet > money)
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n💸 رصيدك ما يكفي!\n\n⪼ رصيدك: ${money.toLocaleString()}$\n⪼ الرهان: ${bet.toLocaleString()}$\n\n${H}`, threadID, messageID);

    const n = [0, 1, 2].map(() => Math.floor(Math.random() * slots.length));
    const line = `${slots[n[0]]} ⌬ ${slots[n[1]]} ⌬ ${slots[n[2]]}`;
    const allSame = n[0] === n[1] && n[1] === n[2];
    const twoSame = n[0] === n[1] || n[0] === n[2] || n[1] === n[2];

    if (allSame) {
        await Currencies.increaseMoney(senderID, bet * 8);
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n${line}\n\n🎉 جاكبوت! فزت بـ 8 أضعاف!\n\n⪼ الربح: +${(bet * 8).toLocaleString()}$\n⪼ رصيدك: ${(money + bet * 8).toLocaleString()}$\n\n${H}`, threadID, messageID);
    } else if (twoSame) {
        await Currencies.increaseMoney(senderID, bet);
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n${line}\n\n✅ فزت بضعف الرهان!\n\n⪼ الربح: +${bet.toLocaleString()}$\n⪼ رصيدك: ${(money + bet).toLocaleString()}$\n\n${H}`, threadID, messageID);
    } else {
        await Currencies.decreaseMoney(senderID, bet);
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n${line}\n\n❌ خسرت!\n\n⪼ الخسارة: -${bet.toLocaleString()}$\n⪼ رصيدك: ${(money - bet).toLocaleString()}$\n\n${H}`, threadID, messageID);
    }
};
