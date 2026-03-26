const path = require("path");

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); }
  catch { return null; }
}

module.exports.config = {
    name: "سلوت",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "أيمن",
    description: "لعبة سلوت — الحد الأدنى 10,000$",
    commandCategory: "games",
    usages: "سلوت [مبلغ]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const H = "⌬ ━━━━━━━━━━━━ ⌬";
    const minBet = 100;
    const slots = ["🚀", "⏳", "👓", "🔦", "💡", "🕯️", "🥽", "🎲", "🔥", "🔔", "🏺", "🌙", "🐣"];

    const db = getDB();
    if (!db) return api.sendMessage(`${H}\n❌ data.js غير موجود`, threadID, messageID);

    await db.ensureUser(senderID);
    const wallet = await db.getWallet(senderID);
    const money = wallet.money ?? 0;

    const bet = parseInt(args[0]);

    if (!args[0] || isNaN(bet) || bet < 0)
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n❌ أدخل مبلغاً صحيحاً!\n\n⪼ الاستخدام: سلوت [مبلغ]\n⪼ الحد الأدنى: ${minBet.toLocaleString()}$\n\n${H}`, threadID, messageID);

    if (bet < minBet)
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n⚠️ الحد الأدنى: ${minBet.toLocaleString()}$\n\n⪼ رهانك: ${bet.toLocaleString()}$\n\n${H}`, threadID, messageID);

    if (bet > money)
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n💸 رصيدك ما يكفي!\n\n⪼ رصيدك: ${money.toLocaleString()}$\n⪼ الرهان: ${bet.toLocaleString()}$\n\n${H}`, threadID, messageID);

    const n = [0, 1, 2].map(() => Math.floor(Math.random() * slots.length));
    const line = `${slots[n[0]]} ⌬ ${slots[n[1]]} ⌬ ${slots[n[2]]}`;
    const allSame = n[0] === n[1] && n[1] === n[2];
    const twoSame = n[0] === n[1] || n[0] === n[2] || n[1] === n[2];

    if (allSame) {
        const prize = bet * 8;
        await db.addMoney(senderID, prize);
        const newBal = await db.getWallet(senderID);
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n${line}\n\n🎉 جاكبوت! فزت بـ 8 أضعاف!\n\n⪼ الربح: +${prize.toLocaleString()}$\n⪼ رصيدك: ${(newBal.money ?? 0).toLocaleString()}$\n\n${H}`, threadID, messageID);
    } else if (twoSame) {
        await db.addMoney(senderID, bet);
        const newBal = await db.getWallet(senderID);
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n${line}\n\n✅ فزت بضعف الرهان!\n\n⪼ الربح: +${bet.toLocaleString()}$\n⪼ رصيدك: ${(newBal.money ?? 0).toLocaleString()}$\n\n${H}`, threadID, messageID);
    } else {
        await db.removeMoney(senderID, bet);
        const newBal = await db.getWallet(senderID);
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n${line}\n\n❌ خسرت!\n\n⪼ الخسارة: -${bet.toLocaleString()}$\n⪼ رصيدك: ${(newBal.balance ?? money - bet).toLocaleString()}$\n\n${H}`, threadID, messageID);
    }
};
