module.exports.config = {
    name: "توافق",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "ايمن",
    description: "حساب نسبة التوافق بينك وبين شخص (بالمنشن أو الرد)",
    commandCategory: "fun",
    usages: "توافق [@منشن] أو بالرد على رسالته",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args, Users }) {
    const { threadID, messageID, senderID, type, messageReply, mentions } = event;

    let targetID;
    let targetName;

    // 1. تحديد الشخص المستهدف (رد أو منشن)
    if (type === "message_reply") {
        targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
    } else {
        return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n❌ يرجى عمل منشن لشخص أو الرد على رسالته لحساب التوافق!", threadID, messageID);
    }

    try {
        // 2. جلب الأسماء بشكل صحيح
        const name1 = (await Users.getData(senderID)).name;
        const name2 = (await Users.getData(targetID)).name;

        // 3. حساب النسبة والرسائل
        const percentage = Math.floor(Math.random() * 101);
        let status = "";
        let emoji = "";

        if (percentage < 20) {
            status = "علاقة منتهية قبل أن تبدأ 💀";
            emoji = "💔";
        } else if (percentage < 40) {
            status = "توافق ضعيف، يحتاج لمعجزة 😬";
            emoji = "📉";
        } else if (percentage < 60) {
            status = "توافق متوسط، يمكنكم المحاولة 👍";
            emoji = "⚖️";
        } else if (percentage < 80) {
            status = "توافق جيد جداً، علاقة واعدة 😍";
            emoji = "💖";
        } else {
            status = "توافق مثالي! أنتم خلقا لبعضكما 💍";
            emoji = "🔥";
        }

        // رسم شريط القلوب
        const heartCount = Math.floor(percentage / 10);
        const hearts = "❤️".repeat(heartCount) + "🖤".repeat(10 - heartCount);

        return api.sendMessage(
            `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗟𝗢𝗩𝗘 ━━ ⌬\n\n` +
            `👤 ${name1} \n` +
            `💕 ${name2}\n\n` +
            `📊 النسبة: [${hearts}] ${percentage}%\n\n` +
            `📝 الحالة: ${status} ${emoji}`,
            threadID,
            messageID
        );

    } catch (error) {
        console.error(error);
        return api.sendMessage("⚠️ حدث خطأ أثناء جلب البيانات.", threadID, messageID);
    }
};
