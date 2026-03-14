const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "قولي",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Ayman",
    description: "تحويل النص إلى صوت بلهجة سعودية واضحة",
    commandCategory: "media",
    usages: "[النص]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const content = args.join(" ");

    if (!content) return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 𝗩𝗢𝗜𝗖𝗘 ━━ ⌬\n⚠️ اكتب النص اللي تبيني أقوله يا بطل!", threadID, messageID);

    try {
        // تحديد اللغة (العربية السعودية)
        const lang = /[\u0600-\u06FF]/.test(content) ? 'ar' : 'en';
        
        // رابط API جوجل المباشر (أكثر استقراراً ويدعم اللهجات)
        // إضافة المنطقة sa للعربية
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(content)}&tl=${lang}&client=tw-ob`;

        const cachePath = path.join(__dirname, 'cache', `say_${Date.now()}.mp3`);

        // تحميل الصوت باستخدام axios
        const res = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0' // ضروري لتجنب الحظر
            }
        });

        const writer = fs.createWriteStream(cachePath);
        res.data.pipe(writer);

        writer.on('finish', () => {
            api.sendMessage({
                body: "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗩𝗢𝗜𝗖𝗘 ━━ ⌬\n✅ تفضل الاستماع:",
                attachment: fs.createReadStream(cachePath)
            }, threadID, () => {
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            }, messageID);
        });

        writer.on('error', () => {
            api.sendMessage("⌬ ⚠️ فشل في حفظ ملف الصوت.", threadID, messageID);
        });

    } catch (error) {
        console.error(error);
        api.sendMessage("⌬ ⚠️ عذراً، خوادم الصوت لا تستجيب حالياً.", threadID, messageID);
    }
};
