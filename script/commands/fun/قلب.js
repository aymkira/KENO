module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
    const { threadID, messageID } = event;
    
    const result = Math.random() < 0.5 ? "صورة 👤" : "كتابة ✍️";
    
    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nقذف العملة...\n\nالنتيجة: ${result}`, threadID, messageID);
};

module.exports.config = {
    name: "قلب",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "ايمن",
    description: "قذف عملة",
    commandCategory: "fun",
    usages: "قلب",
    cooldowns: 3
};
