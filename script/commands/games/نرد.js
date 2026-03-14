module.exports.config = {
    name: "نرد",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "ايمن",
    description: "لعبة نرد تضاعف فلوسك",
    commandCategory: "games",
    usages: "نرد (المبلغ)",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args, Currencies }) {
    const { threadID, messageID, senderID } = event;
    
    // جلب الرصيد الحالي للمستخدم
    let balance = (await Currencies.getData(senderID)).money;
    let bet = args[0];

    // التحقق من المدخلات
    if (!bet || isNaN(bet) || parseInt(bet) <= 0) {
        return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗔𝗠𝗘𝗦 ━━ ⌬\n\n⚠️ يرجى كتابة مبلغ صحيح للرهان!\nمثال: .نرد 100", threadID, messageID);
    }

    bet = parseInt(bet);

    if (bet > balance) {
        return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗔𝗠𝗘𝗦 ━━ ⌬\n\n❌ رصيدك غير كافٍ! رصيدك الحالي هو: ${balance}$`, threadID, messageID);
    }

    // رمي النرد
    const dice = Math.floor(Math.random() * 6) + 1;
    const diceEmoji = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][dice - 1];
    
    // نظام الربح والخسارة
    // إذا ظهر 4 أو 5 أو 6 (ربح) | إذا ظهر 1 أو 2 أو 3 (خسارة)
    if (dice > 3) {
        let winAmount = bet; // يربح ضعف ما راهن به (المجموع = الرهان + الربح)
        await Currencies.increaseMoney(senderID, winAmount);
        
        // استدعاء نظام الرفع السحابي فوراً (تلقائياً من الـ Event)
        // إذا كنت تود استدعاؤه يدوياً هنا: await global.utils.uploadData(api);

        return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗪𝗜𝗡 ━━ ⌬\n\n🎲 النرد: ${diceEmoji}\n📈 النتيجة: ${dice}\n\n✅ مبروك! فزت بـ ${winAmount}$\nرصيدك الحالي: ${balance + winAmount}$`, threadID, messageID);
    } else {
        await Currencies.decreaseMoney(senderID, bet);
        
        return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗟𝗢𝗦𝗘 ━━ ⌬\n\n🎲 النرد: ${diceEmoji}\n📉 النتيجة: ${dice}\n\n❌ للأسف خسرت ${bet}$\nرصيدك المتبقي: ${balance - bet}$`, threadID, messageID);
    }
};
