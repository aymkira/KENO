
const axios = require("axios");
const fs    = require("fs-extra");

module.exports.config = {
    name: "كلب",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أيمن",
    description: "صورة كلب عشوائية",
    commandCategory: "fun",
    usages: "كلب",
    cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID } = event;
    const H = "⌬ ━━━━━━━━━━━━ ⌬";

    try {
        const res      = await axios.get("https://dog.ceo/api/breeds/image/random");
        const imageUrl = res.data.message;
        const imgPath  = __dirname + "/cache/dog_tmp.jpg";

        if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache", { recursive: true });

        const img = await axios.get(imageUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imgPath, Buffer.from(img.data));

        return api.sendMessage({
            body: `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n🐶 كلب عشوائي!\n\n${H}`,
            attachment: fs.createReadStream(imgPath)
        }, threadID, () => { try { fs.unlinkSync(imgPath); } catch(_){} }, messageID);

    } catch (e) {
        return api.sendMessage(
            `${H}\n⌬ ━━ 𝗞𝗘𝗡𝗢 GAMES ━━ ⌬\n${H}\n\n❌ فشل جلب الصورة، حاول مرة ثانية!\n\n${H}`,
            threadID, messageID
        );
    }
};
