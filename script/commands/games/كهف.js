const fs_cave = require("fs-extra");

module.exports.config = {
    name: "كهف",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أيمن",
    description: "اشتغل في كهوف الدول واجمع الأموال",
    commandCategory: "games",
    usages: "كهف",
    cooldowns: 5,
    envConfig: { cooldownTime: 1800000 }
};

module.exports.onLoad = async () => {
    const dir = __dirname + "/cache/";
    if (!fs_cave.existsSync(dir)) fs_cave.mkdirSync(dir, { recursive: true });
    if (!fs_cave.existsSync(dir + "cave.jpg")) {
        const axios = require("axios");
        const r = await axios.get("https://i.ibb.co/C3mtV99Q/rXuUysAHiR.jpg", { responseType: "arraybuffer" }).catch(() => null);
        if (r) fs_cave.writeFileSync(dir + "cave.jpg", Buffer.from(r.data));
    }
};

module.exports.handleReply = async ({ event, api, handleReply, Currencies }) => {
    const { threadID, messageID, senderID } = event;
    const H = "⌬ ━━━━━━━━━━━━ ⌬";
    if (handleReply.author !== senderID)
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n🚫 هذا الأمر مو لك!\n\n${H}`, threadID, messageID);

    const countries = { "1": "فيتنام", "2": "الصين", "3": "اليابان", "4": "تايلاند", "5": "أمريكا", "6": "كمبوديا" };
    const choice = event.body.trim();

    if (!countries[choice])
        return api.sendMessage(`${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n⚠️ اختر رقم من 1 إلى 6 فقط!\n\n${H}`, threadID, messageID);

    const reward = Math.floor(Math.random() * 4500) + 500;
    await Currencies.increaseMoney(senderID, reward);
    api.unsendMessage(handleReply.messageID);

    const data = (await Currencies.getData(senderID)).data || {};
    data.caveTime = Date.now();
    await Currencies.setData(senderID, { data });

    return api.sendMessage(
        `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n⛏️ انتهيت من الشغل!\n\n⪼ الدولة: ${countries[choice]}\n⪼ الربح: +${reward.toLocaleString()}$\n\n${H}`,
        threadID, messageID
    );
};

module.exports.run = async ({ event, api, Currencies }) => {
    const { threadID, messageID, senderID } = event;
    const H = "⌬ ━━━━━━━━━━━━ ⌬";
    const cooldown = global.configModule?.["كهف"]?.cooldownTime || 1800000;

    const data = (await Currencies.getData(senderID)).data || {};
    const remaining = cooldown - (Date.now() - (data.caveTime || 0));

    if (remaining > 0) {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        return api.sendMessage(
            `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n⏳ تعبت! ارتاح شوية\n\n⪼ الوقت المتبقي: ${m}د ${s}ث\n\n${H}`,
            threadID, messageID
        );
    }

    const cachePath = __dirname + "/cache/cave.jpg";
    return api.sendMessage({
        body: `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n⛏️ اختار دولة تشتغل فيها:\n\n⪼ 1 ≻ فيتنام\n⪼ 2 ≻ الصين\n⪼ 3 ≻ اليابان\n⪼ 4 ≻ تايلاند\n⪼ 5 ≻ أمريكا\n⪼ 6 ≻ كمبوديا\n\n⌬ رد برقم الدولة ⌬\n\n${H}`,
        attachment: fs_cave.existsSync(cachePath) ? fs_cave.createReadStream(cachePath) : null
    }, threadID, (err, info) => {
        if (err) return;
        global.client.handleReply.push({ name: "كهف", messageID: info.messageID, author: senderID });
    }, messageID);
};
