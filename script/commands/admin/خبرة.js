const path = require("path");

module.exports.config = {
    name: "خبرة",
    version: "1.5.0",
    hasPermssion: 2, // للمطورين فقط
    credits: "ayman",
    description: "تعديل نقاط الخبرة للمستخدمين في المونغو",
    commandCategory: "admin",
    usages: "[@tag / id] [المبلغ]",
    cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, mentions } = event;
    const mongodb = require(path.join(process.cwd(), "includes", "mongodb.js"));

    try {
        let targetID, xpToAdd;

        // 1. تحديد الشخص (منشن أو UID)
        if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
        } else if (args[0] && args[0].length > 10) {
            targetID = args[0];
        }

        // 2. البحث عن أول رقم في الرسالة لاعتباره هو الـ XP
        xpToAdd = args.find(arg => !isNaN(arg) && arg.length < 10 && !arg.includes("@"));
        xpToAdd = parseInt(xpToAdd);

        // 3. التحقق من المدخلات
        if (!targetID) return api.sendMessage("⚠️ منشن شخصاً أو ضع آيدي الحساب.", threadID, messageID);
        if (isNaN(xpToAdd)) return api.sendMessage("⚠️ يرجى كتابة الرقم المطلوب.\nمثال: .خبرة @ايمن 1000", threadID, messageID);

        // 4. تنفيذ الأمر عبر دالة addExp في المونغو
        const result = await mongodb.addExp(targetID, xpToAdd);
        
        if (!result) return api.sendMessage("❌ عطل: لم يتم العثور على العضو في القاعدة.", threadID, messageID);

        // 5. بناء الرسالة النهائية (بسيطة وصافية)
        let msg = `[ نظام الخبرة ]\n` +
                  `✅ الإضافة: +${xpToAdd.toLocaleString()} XP\n` +
                  `📊 المستوى: ${result.level}\n` +
                  `👑 الرتبة: ${result.rank.emoji} ${result.rank.name}`;

        if (result.isLevelUp) {
            msg += `\n🆙 لفل أب! مكافأة: +${result.bonusMoney}$`;
        }

        api.setMessageReaction("⚡", messageID, () => {}, true);
        return api.sendMessage(msg, threadID, messageID);

    } catch (e) {
        api.sendMessage(`❌ فشل: ${e.message}`, threadID, messageID);
    }
};
