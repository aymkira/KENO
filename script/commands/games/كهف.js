const fs = require("fs-extra");
const axios = require("axios");

module.exports.config = {
    name: "كهف",
    version: "1.0.5",
    hasPermssion: 0,
    credits: "Ayman",
    description: "العمل في الكهوف للحصول على الأموال",
    commandCategory: "games",
    cooldowns: 30
};

module.exports.onLoad = async () => {
    const dir = __dirname + `/cache/`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(dir + "cave.jpg")) {
        try {
            const res = await axios.get("https://i.postimg.cc/N0D5CTrg/Picsart-22-07-11-15-11-59-573.png", { responseType: "arraybuffer" });
            fs.writeFileSync(dir + "cave.jpg", Buffer.from(res.data));
        } catch (e) { console.log("خطأ في تحميل صورة الكهف"); }
    }
};

module.exports.handleReply = async ({ event, api, handleReply, Currencies }) => {
    const { threadID, messageID, senderID, body } = event;
    if (handleReply.author != senderID) return;

    const countries = {
        "1": "فيتنام",
        "2": "الصين",
        "3": "اليابان",
        "4": "تايلاند",
        "5": "أمريكا",
        "6": "كمبوديا"
    };

    if (!(body in countries)) return api.sendMessage("⚠️ اخـتـر رقـم مـن 1 إلـى 6 فـقـط.", threadID, messageID);

    const header = `⌬ ━━━━━━━━━━━━ ⌬`;
    const reward = Math.floor(Math.random() * 4501) + 500;
    const country = countries[body];

    try {
        await Currencies.increaseMoney(senderID, parseInt(reward));
        api.unsendMessage(handleReply.messageID);
        
        return api.sendMessage(
            `${header}\n` +
            `✅ تـم الـعـمـل بـنـجـاح!\n` +
            `⪼ الـمـكـان: كـهـوف [ ${country} ]\n` +
            `⪼ الـمـبـلـغ: ${reward}$\n` +
            `${header}`, 
            threadID, messageID
        );
    } catch (e) {
        return api.sendMessage("⚠️ حـدث خـطأ فـي تـوزيع الأمـوال.", threadID, messageID);
    }
};

module.exports.run = async ({ event, api }) => {
    const { threadID, messageID, senderID } = event;
    const header = `⌬ ━━━━━━━━━━━━ ⌬\n      🕳️ أنـظـمـة الـكـهـوف\n⌬ ━━━━━━━━━━━━ ⌬`;
    const cachePath = __dirname + `/cache/cave.jpg`;

    const msg = {
        body: `${header}\n\n` +
            `1 ≻ فـيـتـنـام\n` +
            `2 ≻ الـصـيـن\n` +
            `3 ≻ الـيـابـان\n` +
            `4 ≻ تـايـلانـد\n` +
            `5 ≻ أمـريـكـا\n` +
            `6 ≻ كـمـبـوديـا\n\n` +
            `⪼ رد عـلـى الـرسـالـة بـرقـم الـدولـة.\n` +
            `⌬ ━━━━━━━━━━━━ ⌬`,
        attachment: fs.existsSync(cachePath) ? fs.createReadStream(cachePath) : null
    };

    return api.sendMessage(msg, threadID, (err, info) => {
        if (err) return;
        global.client.handleReply.push({
            name: "كهف",
            author: senderID,
            messageID: info.messageID
        });
    }, messageID);
};
