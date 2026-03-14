module.exports.config = {
    name: "هدية",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أيمن",
    description: "احصل على هدية بمبلغ عشوائي",
    commandCategory: "games",
    usages: "هدية",
    cooldowns: 10
};

module.exports.run = async function ({ api, event, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const H = "⌬ ━━━━━━━━━━━━ ⌬";
    const ADMIN = global.config.ADMINBOT || [];

    const amounts = [500, 1000, 1050, 1600, 1400, 1581, 1980, 4231, 5482, 9910, 100000];
    const reward = amounts[Math.floor(Math.random() * amounts.length)];

    await Currencies.increaseMoney(senderID, reward);
    const newBalance = (await Currencies.getData(senderID)).money;

    return api.sendMessage(
        `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n🎁 حصلت على هدية!\n\n⪼ المبلغ: +${reward.toLocaleString()}$\n⪼ رصيدك الجديد: ${newBalance.toLocaleString()}$\n\n${H}`,
        threadID, messageID
    );
};
