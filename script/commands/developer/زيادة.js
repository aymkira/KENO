const path = require("path");
const { addMoney } = require(path.join(process.cwd(), "includes", "mongodb.js"));

module.exports.config = {
    name: "زيادة",
    version: "2.6.0",
    hasPermssion: 2,
    credits: "أيمن",
    description: "شحن رصيد مع إظهار منشن المستلم",
    commandCategory: "Developer",
    usages: ".زيادة [المبلغ] [@منشن/آيدي/رد]",
    cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID, type, messageReply, mentions } = event;

    let targetID, amount;

    // 1. استخراج المبلغ
    amount = parseInt(args[0]);

    // 2. تحديد المستهدف
    if (type == "message_reply") { 
        targetID = messageReply.senderID;
    } 
    else if (Object.keys(mentions).length > 0) { 
        targetID = Object.keys(mentions)[0];
    } 
    else if (args[1]) { 
        targetID = args[1];
    } 
    else { 
        targetID = senderID;
    }

    if (isNaN(amount)) return api.sendMessage("⚠️ يرجى كتابة المبلغ أولاً! مثال: .زيادة 5000 @فلان", threadID, messageID);

    try {
        // التنفيذ في السحابة
        const newBalance = await addMoney(targetID, amount);
        
        // جلب معلومات المستهدف لإظهار المنشن
        const info = await api.getUserInfo(targetID);
        const nameTarget = info[targetID].name;

        return api.sendMessage({
            body: `✨ 𝗞𝗜𝗥𝗔 𝗖𝗟𝗢𝗨𝗗 ✨\n\n` +
                  `✅ تم الشحن بنجاح\n` +
                  `👤 المستلم: ${nameTarget}\n` +
                  `💰 المبلغ: +${amount.toLocaleString()}$\n` +
                  `🏦 الرصيد الحالي: ${newBalance.toLocaleString()}$`,
            mentions: [{
                tag: nameTarget,
                id: targetID
            }]
        }, threadID, messageID);

    } catch (err) {
        return api.sendMessage(`❌ فشل الاتصال بالسحابة: ${err.message}`, threadID, messageID);
    }
};
