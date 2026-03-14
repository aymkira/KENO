const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
    const { threadID, messageID, senderID, mentions } = event;
    
    if (Object.keys(mentions).length === 0) {
        return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nعليك عمل منشن لشخص لعناقه", threadID, messageID);
    }
    
    const targetID = Object.keys(mentions)[0];
    const senderName = await Users.getNameUser(senderID);
    const targetName = mentions[targetID].replace("@", "");
    
    try {
        const response = await axios.get('https://nekos.best/api/v2/hug');
        const gifUrl = response.data.results[0].url;
        
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        
        const gifPath = path.join(cacheDir, `hug_${Date.now()}.gif`);
        const gifResponse = await axios.get(gifUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(gifPath, Buffer.from(gifResponse.data));
        
        await api.sendMessage({
            body: `⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\n${senderName} يعانق ${targetName}`,
            attachment: fs.createReadStream(gifPath)
        }, threadID, () => {
            if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
        }, messageID);
        
    } catch (error) {
        return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nفشل جلب صورة العناق", threadID, messageID);
    }
};

module.exports.config = {
    name: "عناق",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "ايمن",
    description: "عانق شخص ما",
    commandCategory: "fun",
    usages: "عناق [@منشن]",
    cooldowns: 5
};
