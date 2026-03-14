const path = require("path");
module.exports.config = {
    name: "وحش",
    version: "1.1.0",
    hasPermssion: 1,
    credits: "ayman",
    description: "إطلاق وحش للصيد بالهيدر الأصلي",
    commandCategory: "games",
    cooldowns: 10
};

module.exports.run = async function({ api, event }) {
    const header = `⌬ ━━━━━━━━━━━━ ⌬\n      ظهور وحش\n⌬ ━━━━━━━━━━━━ ⌬`;
    api.sendMessage(`${header}\n\n👾 ظهر وحش بري الآن!\nاكتب [ صيد ] بسرعة للحصول على XP!`, event.threadID, (err, info) => {
        global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID
        });
    });
};

module.exports.handleReply = async function({ api, event, handleReply }) {
    if (event.body.toLowerCase() !== "صيد") return;
    const mongodb = require(path.join(process.cwd(), "includes", "mongodb.js"));
    const header = `⌬ ━━━━━━━━━━━━ ⌬\n      صيد ناجح\n⌬ ━━━━━━━━━━━━ ⌬`;
    
    api.unsendMessage(handleReply.messageID);
    const xpReward = Math.floor(Math.random() * 200) + 50;
    await mongodb.addExp(event.senderID, xpReward);
    
    return api.sendMessage(`${header}\n\n🎯 كفو! تم الصيد بنجاح.\n⚡ المكافأة: +${xpReward} XP`, event.threadID, event.messageID);
};
