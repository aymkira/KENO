const axios = require("axios");
const fs    = require("fs-extra");

module.exports.config = {
    name: "قطة",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أيمن",
    description: "صورة قطة عشوائية",
    commandCategory: "fun",
    usages: "قطة",
    cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID } = event;
    const H = "ْ";

    try {
        const res      = await axios.get("https://api.thecatapi.com/v1/images/search");
        const imageUrl = res.data[0].url;
        const imgPath  = __dirname + "/cache/cat_tmp.jpg";

        if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache", { recursive: true });

        const img = await axios.get(imageUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imgPath, Buffer.from(img.data));

        return api.sendMessage({
            body: `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n🐱 قطة عشوائية!\n\n${H}`,
            attachment: fs.createReadStream(imgPath)
        }, threadID, () => { try { fs.unlinkSync(imgPath); } catch(_){} }, messageID);

    } catch (e) {
        return api.sendMessage(
            `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n❌ فشل جلب الصورة، حاول مرة ثانية!\n\n${H}`,
            threadID, messageID
        );
    }
};