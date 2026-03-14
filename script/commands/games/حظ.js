const path = require("path");

module.exports.config = {
    name: "حظ",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "ayman",
    description: "لعبة حظ سريعة مرتبطة ببنك كيرا السحابي",
    commandCategory: "games",
    usages: "[المبلغ]",
    cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    
    // استدعاء الدوال من مسارها الصحيح في سورس كيرا
    const mongodb = require(path.join(process.cwd(), "includes", "mongodb.js"));
    
    // دوال التنسيق الفخم
    const boldText = (text) => global.utils.toBoldSans(text);
    const heavyTitle = (text) => global.utils.toBoldMath(text); 

    const header = `⌬ ━━━━━━━━━━━━ ⌬\n   ${heavyTitle("𝗞𝗜𝗥𝗔 𝗥𝗢𝗬𝗔𝗟 𝗟𝗨𝗖𝗞")}\n⌬ ━━━━━━━━━━━━ ⌬`;

    try {
        const bet = parseInt(args[0]);

        // 1. التحقق من المدخلات
        if (isNaN(bet) || bet <= 0) {
            return api.sendMessage(`${header}\n\n⚠️ ${boldText("تنبيه:")} يرجى كتابة مبلغ الرهان بشكل صحيح!\nمثال: .حظ 500`, threadID, messageID);
        }

        // 2. جلب البيانات والتأكد من الرصيد
        const userData = await mongodb.getUserData(senderID);
        if (!userData) return api.sendMessage("❌ خطأ في الاتصال بقاعدة بيانات KiraDB", threadID, messageID);

        const balance = userData.currency.money;

        if (balance < bet) {
            return api.sendMessage(`${header}\n\n❌ ${boldText("رصيدك غير كافٍ!")}\n💰 رصيدك الحالي: ${balance}$`, threadID, messageID);
        }

        // 3. منطق الربح والخسارة
        api.setMessageReaction("🎰", messageID, () => {}, true);
        const isWin = Math.random() > 0.5;

        if (isWin) {
            const prize = bet; // يربح ضعف ما راهن به (إضافة قيمة الرهان للرصيد)
            await mongodb.addMoney(senderID, prize);
            
            const winMsg = `${header}\n\n` +
                `✨ ${heavyTitle("𝗪𝗜𝗡𝗡𝗘𝗥")}\n` +
                `✅ ${boldText("مبروك! لقد ابتسم لك الحظ.")}\n\n` +
                `💰 ${boldText("الربح الصافي:")} +${prize}$\n` +
                `🏦 ${boldText("الرصيد الجديد:")} ${balance + prize}$`;
            
            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(winMsg, threadID, messageID);
            
        } else {
            await mongodb.removeMoney(senderID, bet);
            
            const loseMsg = `${header}\n\n` +
                `💥 ${heavyTitle("𝗟𝗢𝗦𝗘𝗥")}\n` +
                `❌ ${boldText("للأسف، الحظ لم يكن بجانبك.")}\n\n` +
                `🗑️ ${boldText("الخسارة:")} -${bet}$\n` +
                `🏦 ${boldText("الرصيد المتبقي:")} ${balance - bet}$`;
                
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage(loseMsg, threadID, messageID);
        }

    } catch (error) {
        console.error(error);
        api.sendMessage("❌ حدث خطأ فني أثناء معالجة العملية المالية.", threadID, messageID);
    }
};
