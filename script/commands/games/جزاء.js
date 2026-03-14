const axios = require("axios");

module.exports.config = {
    name: "جزاء",
    version: "1.3.1",
    hasPermssion: 0,
    credits: "Ayman",
    description: "تحدي ركلات الجزاء بنظام الرد",
    commandCategory: "games",
    usages: "جزاء",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const header = `⌬ ━━━━━━━━━━━━ ⌬\n      ⚽ ركـلات الـجـزاء\n⌬ ━━━━━━━━━━━━ ⌬`;

    const players = [
        { name: "ليونيل ميسي", chance: 85 },
        { name: "كيليان مبابي", chance: 75 },
        { name: "إيرلينغ هالاند", chance: 70 },
        { name: "كريستيانو رونالدو", chance: 65 },
        { name: "فينيسيوس جونيور", chance: 55 },
        { name: "محمد صلاح", chance: 50 },
        { name: "جود بيلينجهام", chance: 40 },
        { name: "روبرت ليفاندوفسكي", chance: 30 },
        { name: "نيمار جونيور", chance: 20 },
        { name: "أشرف حكيمي", chance: 15 }
    ];

    let msgBody = `${header}\n\nاخـتـر أسـطـورتـك لـلـتـسـديـد:\n`;
    players.forEach((p, i) => { msgBody += `${i + 1} ≻ ${p.name}\n`; });
    msgBody += `\n⪼ رد بـرقـم الـلاعـب (1-10)\n⌬ ━━━━━━━━━━━━ ⌬`;

    try {
        const gif = (await axios.get("https://i.postimg.cc/bJ60WRwL/20220728-113119.gif", { responseType: "stream" })).data;
        return api.sendMessage({ body: msgBody, attachment: gif }, threadID, (err, info) => {
            global.client.handleReply.push({
                name: "جزاء",
                messageID: info.messageID,
                author: senderID,
                players
            });
        }, messageID);
    } catch (e) {
        return api.sendMessage(msgBody, threadID, (err, info) => {
            global.client.handleReply.push({
                name: "جزاء",
                messageID: info.messageID,
                author: senderID,
                players
            });
        }, messageID);
    }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
    const { threadID, senderID, messageID, body } = event;
    if (String(handleReply.author) !== String(senderID)) return;

    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > 10) {
        return api.sendMessage("⚠️ اخـتـر رقـم مـن 1 إلـى 10 فـقـط.", threadID, messageID);
    }

    const selectedPlayer = handleReply.players[choice - 1];
    api.unsendMessage(handleReply.messageID);
    
    api.sendMessage(`⏳ [ ${selectedPlayer.name} ] يـتـقـدم لـلـكـرة...`, threadID, async (err, info) => {
        setTimeout(() => {
            const rand = Math.floor(Math.random() * 100);
            const header = `⌬ ━━━━━━━━━━━━ ⌬`;
            
            if (rand < selectedPlayer.chance) {
                api.setMessageReaction("⚽", messageID, () => {}, true);
                return api.sendMessage(`${header}\nGOAL! ⚽🔥\n\nتـم تـسـجـيـل الـهـدف بـواسـطـة [ ${selectedPlayer.name} ] بـنـجـاح!\n${header}`, threadID, messageID);
            } else {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage(`${header}\nخـسـارة! ❌🥅\n\nلـلأسـف أضـاع [ ${selectedPlayer.name} ] الـركلة بـرعـونـة!\n${header}`, threadID, messageID);
            }
        }, 2000);
    }, messageID);
};
