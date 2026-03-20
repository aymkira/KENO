const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");

module.exports.config = {
    name: "زوجيني",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أيمن",
    description: "صورة مجمّعة بين شخصين",
    commandCategory: "fun",
    usages: "زوجيني — رد على شخص أو منشنه",
    cooldowns: 10
};

const TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

async function getAvatar(userID) {
    const url = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=${TOKEN}`;
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
    return Buffer.from(res.data);
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    const H = "⌬ ━━ 𝗞𝗘𝗡𝗢 FUN ━━ ⌬";
    const B = "⌬ ━━━━━━━━━━━━ ⌬";

    const targetID = messageReply?.senderID || Object.keys(mentions)?.[0];

    if (!targetID)
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n📌 الاستخدام:\n⪼ رد على رسالة شخص\n⪼ أو منشن شخص\n\n${B}`,
            threadID, messageID
        );

    if (targetID === senderID)
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n😅 ما تقدر تتزوج نفسك!\n\n${B}`,
            threadID, messageID
        );

    api.sendMessage(`${B}\n${H}\n${B}\n\n👰‍♀️🤵‍♂️ جاري تزويجكما...\n\n${B}`, threadID, messageID);

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    try {
        const { Jimp } = require("jimp");

        // ── تحميل صورتي المستخدمين ─────────────────────
        const [buf1, buf2] = await Promise.all([getAvatar(targetID), getAvatar(senderID)]);

        const img1 = await Jimp.read(buf1);
        const img2 = await Jimp.read(buf2);

        // ── دمج الصورتين جنباً لجنب ───────────────────
        const size = 400;
        img1.cover({ w: size, h: size });
        img2.cover({ w: size, h: size });

        const canvas = new Jimp({ width: size * 2, height: size, color: 0xffffffff });
        canvas.composite(img1, 0, 0);
        canvas.composite(img2, size, 0);

        const outPath = path.join(cacheDir, `kiss_${Date.now()}.png`);
        await canvas.write(outPath);

        // ── جلب أسماء ─────────────────────────────────
        const senderName = global.data?.userName?.get(senderID) || "أنت";
        const targetName = global.data?.userName?.get(targetID) || "الشخص";

        return api.sendMessage({
            body: `${B}\n${H}\n${B}\n\n🖇 ${senderName} × ${targetName}\n\n${B}`,
            attachment: fs.createReadStream(outPath)
        }, threadID, () => { try { fs.unlink(outPath); } catch (_) {} }, messageID);

    } catch (e) {
        console.error("قبلة:", e);
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n❌ حدث خطأ: ${e.message}\n\n${B}`,
            threadID, messageID
        );
    }
};
