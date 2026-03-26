const path  = require("path");
const axios = require("axios");
const fs    = require("fs-extra");

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
    name: "مقص",
    version: "2.2.0",
    hasPermssion: 0,
    credits: "أيمن",
    description: "لعبة حجر ورقة مقص مع رهان",
    commandCategory: "games",
    usages: "مقص [حجر/ورق/مقص] [مبلغ]",
    cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const H = "⌬ ━━━━━━━━━━━━ ⌬";
    const BOT = getBotName();
    const items = ["مقص", "حجر", "ورق"];
    const emoji = ["✌️", "👊", "✋"];

    const userChoice = args[0];
    const bet = parseInt(args[1]);

    if (!userChoice || !items.includes(userChoice))
        return api.sendMessage(`${H}\n⌬ ━━ ${BOT} GAMES ━━ ⌬\n${H}\n\n❓ الاستخدام الصحيح:\n\n⪼ مقص حجر 500\n⪼ مقص ورق 500\n⪼ مقص مقص 500\n\n${H}`, threadID, messageID);

    if (!bet || isNaN(bet) || bet < 50)
        return api.sendMessage(`${H}\n⌬ ━━ ${BOT} GAMES ━━ ⌬\n${H}\n\n⚠️ الحد الأدنى للرهان: 50$\n\n${H}`, threadID, messageID);

    const db = getDB();
    if (!db) return api.sendMessage("❌ data.js غير موجود", threadID, messageID);

    await db.ensureUser(senderID);
    const wallet = await db.getWallet(senderID);
    const money  = wallet.money ?? 0;

    if (bet > money)
        return api.sendMessage(`${H}\n⌬ ━━ ${BOT} GAMES ━━ ⌬\n${H}\n\n💸 رصيدك ما يكفي!\n\n⪼ رصيدك: ${money.toLocaleString()}$\n⪼ الرهان: ${bet.toLocaleString()}$\n\n${H}`, threadID, messageID);

    const botChoice = items[Math.floor(Math.random() * items.length)];
    const ui = items.indexOf(userChoice);
    const bi = items.indexOf(botChoice);

    let result;
    if (ui === bi) result = "draw";
    else if ((ui === 0 && bi === 1) || (ui === 1 && bi === 2) || (ui === 2 && bi === 0)) result = "lose";
    else result = "win";

    const imgLinks = [
        "https://i.imgur.com/1uBAGlO.jpg",
        "https://i.imgur.com/EOZx1tL.jpg",
        "https://i.imgur.com/2WSbVaK.jpg"
    ];

    const dl = async (url, p) => {
        const r = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(p, Buffer.from(r.data));
    };

    const p1 = __dirname + `/cache/rps_u.png`;
    const p2 = __dirname + `/cache/rps_b.png`;
    if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache", { recursive: true });
    await dl(imgLinks[ui], p1);
    await dl(imgLinks[bi], p2);

    let resultText, moneyChange, finalMoney;
    if (result === "win") {
        await db.addMoney(senderID, bet);
        finalMoney  = money + bet;
        moneyChange = `+${bet.toLocaleString()}$`;
        resultText  = "✅ فزت!";
    } else if (result === "lose") {
        await db.removeMoney(senderID, bet);
        finalMoney  = money - bet;
        moneyChange = `-${bet.toLocaleString()}$`;
        resultText  = "❌ خسرت!";
    } else {
        finalMoney  = money;
        resultText  = "🤝 تعادل!";
        moneyChange = "0$";
    }

    return api.sendMessage({
        body: `${H}\n⌬ ━━ ${BOT} GAMES ━━ ⌬\n${H}\n\n${emoji[ui]} أنت: ${userChoice}  ━  البوت: ${botChoice} ${emoji[bi]}\n\n${resultText}\n\n⪼ التغيير: ${moneyChange}\n⪼ رصيدك: ${finalMoney.toLocaleString()}$\n\n${H}`,
        attachment: [fs.createReadStream(p1), fs.createReadStream(p2)]
    }, threadID, messageID);
};
