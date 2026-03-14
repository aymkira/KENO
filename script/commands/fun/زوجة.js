const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

// ══════════════════════════════════════════════════════════════════
// 🚀 KIRA Bot - Pair System (Matchmaking)
// ══════════════════════════════════════════════════════════════════
// المطور: ايمن
// النظام: KIRA Hybrid
// ══════════════════════════════════════════════════════════════════

module.exports.config = {
    name: "زوجني",
    version: "2.1.0",
    role: 0,
    author: "ايمن",
    description: "البحث عن شريك عشوائي داخل المجموعة بنظام KIRA",
    category: "ترفيه",
    usages: "{pn}",
    cooldowns: 10
};

module.exports.run = async function({ api, event, Users }) {
    const { threadID, messageID, senderID } = event;
    
    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const { userInfo } = threadInfo;

        // جلب بيانات المرسل
        const senderData = await Users.getData(senderID);
        const senderName = senderData.name;

        const myData = userInfo.find(u => u.id === senderID);
        if (!myData || !myData.gender) {
            return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nعذراً، لم أتمكن من تحديد جنسك في قاعدة بيانات فيسبوك.", threadID, messageID);
        }

        const myGender = myData.gender.toUpperCase();
        let candidates = [];

        // منطق اختيار المرشحين بناءً على الجنس
        if (myGender === "MALE") {
            candidates = userInfo.filter(u => u.gender === "FEMALE" && u.id !== senderID);
        } else if (myGender === "FEMALE") {
            candidates = userInfo.filter(u => u.gender === "MALE" && u.id !== senderID);
        }

        if (candidates.length === 0) {
            return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nللأسف، لم أجد شريكاً مناسباً لك حالياً في هذه المجموعة.", threadID, messageID);
        }

        const match = candidates[Math.floor(Math.random() * candidates.length)];
        const matchName = match.name;

        // إعداد Canvas
        const width = 800;
        const height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        // تحميل الخلفية
        const background = await loadImage("https://files.catbox.moe/29jl5s.jpg");
        ctx.drawImage(background, 0, 0, width, height);

        // روابط الصور
        const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
        const getAvatar = (id) => `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=${token}`;

        const [img1, img2] = await Promise.all([
            loadImage(getAvatar(senderID)),
            loadImage(getAvatar(match.id))
        ]);

        // دالة رسم الصور الدائرية مع توهج أبيض ساطع (KIRA Style)
        function drawGlowingCircle(ctx, img, x, y, size) {
            ctx.save();
            // إضافة التوهج النيون
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2 + 5, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.shadowBlur = 0;

            // قص الصورة دائرية
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, x, y, size, size);
            ctx.restore();
        }

        drawGlowingCircle(ctx, img1, 385, 40, 170);
        drawGlowingCircle(ctx, img2, width - 213, 190, 170);

        // حفظ الصورة
        const cachePath = path.join(__dirname, "cache", `pair_${senderID}.png`);
        if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
        
        fs.writeFileSync(cachePath, canvas.toBuffer());

        const lovePercent = Math.floor(Math.random() * 31) + 70;
        const msg = `⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nتم العثور على شريكك المثالي:\n\n👤 ${senderName} ❤️ ${matchName}\n\n💘 نسبة التوافق: ${lovePercent}%\n\nمبروك! نظام KIRA يتمنى لكما حياة سعيدة.`;

        return api.sendMessage({
            body: msg,
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

    } catch (error) {
        console.error('KIRA Pair Error:', error);
        api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nحدث خطأ في النظام أثناء البحث عن الشريك.", threadID, messageID);
    }
};
