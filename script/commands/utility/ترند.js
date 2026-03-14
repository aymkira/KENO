const axios = require('axios');
const cheerio = require('cheerio');

module.exports.config = {
    name: "ترند",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "ايمن",
    description: "أكثر المواضيع بحثاً في جوجل حسب الدولة (Scraping)",
    commandCategory: "utility",
    usages: "[رمز_الدولة]",
    cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const countryCode = args[0] ? args[0].toUpperCase() : 'US'; // الافتراضي US

    try {
        const waitMsg = await api.sendMessage(`⏳ جاري جلب ترند جوجل في ${countryCode}...`, threadID);

        const url = `https://trends.google.com/trends/trendingsearches/daily?geo=${countryCode}`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const trends = [];

        $('feed item').slice(0, 10).each((i, el) => {
            const title = $(el).find('title').text();
            const link = $(el).find('link').attr('href');
            trends.push(`${i + 1}. ${title}\n🔗: ${link}`);
        });

        api.unsendMessage(waitMsg.messageID);

        if (trends.length === 0) {
            return api.sendMessage(`❌ لم يتم العثور على ترندات لـ ${countryCode} أو رمز الدولة غير صحيح.`, threadID, messageID);
        }

        const msg = `⌬ ━━ 𝗚𝗢𝗢𝗚𝗟𝗘 𝗧𝗥𝗘𝗡𝗗𝗦 ━━ ⌬\n\n` +
                    `🔥 أكثر 10 ترندات بحثاً في ${countryCode}:\n\n` +
                    `${trends.join('\n\n')}\n\n` +
                    `🤖 مدعوم بـ كيرا (Scraping)`;
        
        return api.sendMessage(msg, threadID, messageID);

    } catch (error) {
        console.error("ترند - خطأ:", error);
        return api.sendMessage(`❌ حدث خطأ في جلب الترندات: ${error.message}\n💡 تأكد من رمز الدولة (مثال: US, IQ, SA).`, threadID, messageID);
    }
};
