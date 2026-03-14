const axios = require('axios');

async function getBaseUrl() {
    try {
        const res = await axios.get('https://raw.githubusercontent.com/Ayan-alt-deep/xyc/main/baseApiurl.json');
        return res.data.apiUrl || 'https://eren-td.onrender.com';
    } catch (err) {
        return 'https://eren-td.onrender.com';
    }
}

module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
    const { threadID, messageID } = event;
    const type = args[0]?.toLowerCase();

    const baseUrl = await getBaseUrl();

    try {
        if (type === "truth" || type === "صراحة") {
            const response = await axios.get(`${baseUrl}/truth`);
            return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nسؤال صراحة:\n\n${response.data.result}`, threadID, messageID);
        } 
        else if (type === "dare" || type === "جرأة") {
            const response = await axios.get(`${baseUrl}/dare`);
            return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nسؤال جرأة:\n\n${response.data.result}`, threadID, messageID);
        } 
        else {
            return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nاستخدم: صراحة [صراحة/جرأة]", threadID, messageID);
        }
    } catch (error) {
        return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nفشل جلب السؤال`, threadID, messageID);
    }
};

module.exports.config = {
    name: "صراحة",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "ايمن",
    description: "لعبة صراحة أو جرأة",
    commandCategory: "fun",
    usages: "صراحة [صراحة/جرأة]",
    cooldowns: 5
};
