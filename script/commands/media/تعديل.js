 const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
    name: "تعديل",
    version: "7.0.0",
    credits: "Ayman",
    description: "فلاتر ألوان احترافية لنظام كيرا",
    commandCategory: "pic",
    usages: "[اسم الفلتر] (رد على صورة)",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, type, messageReply, senderID } = event;

    const filters = {
        "سينمائي": "ألوان سينمائية عميقة",
        "دافئ": "إضاءة شمسية دافئة",
        "بارد": "لمسة زرقاء باردة",
        "باهت": "نمط الصور الهادئة (Vintage)",
        "اشراق": "زيادة الإضاءة والألوان",
        "ليلي": "تحويل الصورة لجو ليلي",
        "رمادي": "أبيض وأسود احترافي"
    };

    const filter = args[0];
    if (!filter || !filters[filter]) {
        let msg = `⌬ ━━━ 𝗞𝗜𝗥𝗔 𝗙𝗜𝗟𝗧𝗘𝗥𝗦 ━━━ ⌬\n\n✨ الفلاتر المتاحة حالياً:\n`;
        for (let f in filters) msg += `🔹 ${f} : ${filters[f]}\n`;
        msg += `\n💡 رد على صورة واكتب: /تعديل سينمائي`;
        return api.sendMessage(msg, threadID, messageID);
    }

    let imageUrl = (type == "message_reply") ? messageReply.attachments[0]?.url : event.attachments[0]?.url;
    if (!imageUrl) imageUrl = `https://graph.facebook.com/${senderID}/picture?width=1000&height=1000&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    try {
        api.sendMessage("⌬ جاري ضبط الألوان والعدسات... ✨", threadID, messageID);

        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const img = await loadImage(Buffer.from(response.data));
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // --- محرك الفلاتر اللونية ---
        switch (filter) {
            case "سينمائي":
                ctx.filter = 'contrast(1.2) saturate(1.4) brightness(0.9)';
                ctx.drawImage(canvas, 0, 0);
                break;
            case "دافئ":
                ctx.fillStyle = "rgba(255, 165, 0, 0.1)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.filter = 'sepia(0.3) brightness(1.1)';
                ctx.drawImage(canvas, 0, 0);
                break;
            case "بارد":
                ctx.fillStyle = "rgba(0, 100, 255, 0.1)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.filter = 'hue-rotate(10deg) saturate(1.2)';
                ctx.drawImage(canvas, 0, 0);
                break;
            case "باهت":
                ctx.filter = 'grayscale(0.2) contrast(0.8) brightness(1.1)';
                ctx.drawImage(canvas, 0, 0);
                break;
            case "اشراق":
                ctx.filter = 'brightness(1.3) saturate(1.5)';
                ctx.drawImage(canvas, 0, 0);
                break;
            case "ليلي":
                ctx.filter = 'invert(0.05) brightness(0.7) hue-rotate(180deg)';
                ctx.drawImage(canvas, 0, 0);
                break;
            case "رمادي":
                ctx.filter = 'grayscale(1) contrast(1.2)';
                ctx.drawImage(canvas, 0, 0);
                break;
        }

        const cachePath = path.join(__dirname, "cache", `filter_${Date.now()}.png`);
        fs.outputFileSync(cachePath, canvas.toBuffer("image/png"));

        return api.sendMessage({
            body: `⌬ ━━━ 𝗞𝗜𝗥𝗔 𝗙𝗜𝗟𝗧𝗘𝗥𝗦 ━━━ ⌬\n✅ تم تطبيق فلتر [ ${filter} ]`,
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (e) {
        api.sendMessage("⌬ ❌ فشل النظام في معالجة ألوان الصورة.", threadID, messageID);
    }
};
