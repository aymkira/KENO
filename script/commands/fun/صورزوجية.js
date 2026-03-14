const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
    const { threadID, messageID, senderID, mentions } = event;
    
    if (Object.keys(mentions).length === 0) {
        return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nعليك عمل منشن لشخص", threadID, messageID);
    }
    
    const targetID = Object.keys(mentions)[0];
    
    try {
        const response = await axios.get('https://nekos.best/api/v2/neko?amount=2');
        const images = response.data.results;
        
        if (!images || images.length < 2) {
            return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nفشل جلب الصور", threadID, messageID);
        }
        
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        
        const timestamp = Date.now();
        const img1Path = path.join(cacheDir, `pair1_${timestamp}.jpg`);
        const img2Path = path.join(cacheDir, `pair2_${timestamp}.jpg`);
        
        const img1Response = await axios.get(images[0].url, { responseType: 'arraybuffer' });
        const img2Response = await axios.get(images[1].url, { responseType: 'arraybuffer' });
        
        fs.writeFileSync(img1Path, Buffer.from(img1Response.data));
        fs.writeFileSync(img2Path, Buffer.from(img2Response.data));
        
        await api.sendMessage({
            body: "⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nصور زوجية لكما",
            attachment: [
                fs.createReadStream(img1Path),
                fs.createReadStream(img2Path)
            ]
        }, threadID, () => {
            if (fs.existsSync(img1Path)) fs.unlinkSync(img1Path);
            if (fs.existsSync(img2Path)) fs.unlinkSync(img2Path);
        }, messageID);
        
    } catch (error) {
        return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nفشل جلب الصور الزوجية", threadID, messageID);
    }
};

module.exports.config = {
    name: "صورزوجية",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "ايمن",
    description: "الحصول على صور زوجية",
    commandCategory: "fun",
    usages: "صورزوجية [@منشن]",
    cooldowns: 5
};
