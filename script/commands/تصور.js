const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "فلوكس",
    version: "2.0",
    hasPermssion: 0,
    credits: "(api AYOUB) (cmd Y-ANBU)",
    description: "",
    commandCategory: "صور",
    usages: "[وصف الصورة]",
    cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
    const text = args.join(" ");
    if (!text) return api.sendMessage("امر ونص 🐢", event.threadID, event.messageID);

    api.sendMessage("🌸| جاري تقويد الصور....", event.threadID);

    try {
        const res = await axios.post("https://flux-nobro9735-9yayti5m.leapcell.dev/api/flux/generate", {
            prompt: text,
            count: 4
        }, { headers: { 'Content-Type': 'application/json' } });

        const images = res.data?.data?.images || [];
        if (images.length === 0) throw new Error("حصل خطأ");

        const attachments = [];
        const tempFiles = [];

        for (let i = 0; i < images.length; i++) {
            let base64Data = images[i].includes(',') ? images[i].split(',')[1] : images[i];
            const buffer = Buffer.from(base64Data, 'base64');
            const filePath = path.join(__dirname, `flux_${Date.now()}_${i}.png`);
            fs.writeFileSync(filePath, buffer);
            attachments.push(fs.createReadStream(filePath));
            tempFiles.push(filePath);
        }

        api.sendMessage({ attachment: attachments }, event.threadID, () => {
            tempFiles.forEach(file => fs.unlinkSync(file));
        }, event.messageID);
        
    } catch (err) {
        api.sendMessage(`❌ حدث خطأ: ${err.message}`, event.threadID, event.messageID);
    }
};
