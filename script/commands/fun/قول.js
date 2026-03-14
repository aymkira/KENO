module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
    const { threadID, messageID } = event;
    
    const text = args.join(" ");
    if (!text) {
        return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nاكتب شيئاً لأقوله", threadID, messageID);
    }
    
    api.unsendMessage(messageID);
    return api.sendMessage(text, threadID);
};

module.exports.config = {
    name: "قول",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "ايمن",
    description: "البوت يقول ما تكتبه",
    commandCategory: "fun",
    usages: "قول [النص]",
    cooldowns: 3
};
