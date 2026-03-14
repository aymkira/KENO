 const { ImgurClient } = require('imgur');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports.config = {
    name: "رابط",
    version: "1.5.0",
    hasPermssion: 0,
    credits: "Ayman",
    description: "رفع الصور إلى سحابة KIRA",
    commandCategory: "pic",
    usages: "[رد على صورة]",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    const { threadID, messageID, type, messageReply } = event;
    let imageUrl = (type == "message_reply") ? messageReply.attachments[0]?.url : event.attachments[0]?.url;

    if (!imageUrl) return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 𝗖𝗟𝗢𝗨𝗗 ━━ ⌬\n⚠️ أرفق صورة أو رد عليها لرفعها!", threadID, messageID);

    try {
        const client = new ImgurClient({ clientId: '546c25a59c58ad7' });
        const cachePath = path.join(__dirname, 'cache', `up_${Date.now()}.png`);
        const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        fs.outputFileSync(cachePath, Buffer.from(res.data));

        const upload = await client.upload({ image: fs.createReadStream(cachePath), type: 'stream' });
        fs.unlinkSync(cachePath);

        if (upload.success) {
            return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗖𝗟𝗢𝗨𝗗 ━━ ⌬\n✅ تم الرفع بنجاح!\n\n🔗 الرابط:\n${upload.data.link}`, threadID, messageID);
        }
    } catch (e) { api.sendMessage("⌬ ⚠️ فشل الرفع للسحابة.", threadID, messageID); }
};
