const axios = require('axios');
const cheerio = require('cheerio');

module.exports.config = {
    name: "كرة",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "ايمن",
    description: "عرض آخر نتائج ومواعيد مباريات كرة القدم (Scraping)",
    commandCategory: "media",
    usages: "كرة",
    cooldowns: 15
};

module.exports.run = async ({ api, event }) => {
    const { threadID, messageID } = event;

    try {
        const waitMsg = await api.sendMessage(`⚽️ جاري جلب نتائج ومواعيد مباريات كرة القدم...`, threadID);

        // يمكن التغيير إلى موقع آخر مثل "yallakora.com" إذا كان هذا يتعطل
        const url = 'https://www.kooora.com/';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const matches = [];

        // هذا الجزء قد يحتاج لتعديل دقيق جداً إذا غير موقع كورة تصميمه
        $('.match-card').slice(0, 5).each((i, el) => { // جلب 5 مباريات
            const tournament = $(el).find('.tournament-name').text().trim();
            const time = $(el).find('.match-time').text().trim();
            const team1 = $(el).find('.team1-name').text().trim();
            const score = $(el).find('.score').text().trim();
            const team2 = $(el).find('.team2-name').text().trim();
            
            if (tournament && team1 && team2) { // تأكد من وجود البيانات
                matches.push(`🏆 ${tournament}\n🏠 ${team1} ${score} ✈️ ${team2}\n⏰ ${time || 'لم تبدأ/انتهت'}`);
            }
        });

        api.unsendMessage(waitMsg.messageID);

        if (matches.length === 0) {
            return api.sendMessage("❌ لم يتم العثور على مباريات حالياً. قد يكون الموقع غير متاح أو تغير تصميمه.", threadID, messageID);
        }

        const msg = `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗙𝗢𝗢𝗧𝗕𝗔𝗟𝗟 ━━ ⌬\n\n` +
                    `⚽️ آخر 5 مباريات (نتائج ومواعيد):\n\n` +
                    `${matches.join('\n\n')}\n\n` +
                    `🤖 مدعوم بـ كيرا (Scraping)`;
        
        return api.sendMessage(msg, threadID, messageID);

    } catch (error) {
        console.error("كرة - خطأ:", error);
        return api.sendMessage(`❌ حدث خطأ في جلب بيانات المباريات: ${error.message}\n💡 قد يكون الموقع قد غير تصميمه.`, threadID, messageID);
    }
};
