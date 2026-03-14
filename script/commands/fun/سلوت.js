module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
    const { threadID, messageID, senderID } = event;
    
    const slots = ["🍒", "🍋", "🍊", "🍇", "🍉", "⭐", "💎"];
    const slot1 = slots[Math.floor(Math.random() * slots.length)];
    const slot2 = slots[Math.floor(Math.random() * slots.length)];
    const slot3 = slots[Math.floor(Math.random() * slots.length)];
    
    let result = "";
    let win = false;
    
    if (slot1 === slot2 && slot2 === slot3) {
        result = "فزت! 🎉";
        win = true;
    } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
        result = "قريب من الفوز!";
    } else {
        result = "حاول مرة أخرى";
    }
    
    const message = `⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\n[ ${slot1} | ${slot2} | ${slot3} ]\n\n${result}`;
    
    return api.sendMessage(message, threadID, messageID);
};

module.exports.config = {
    name: "سلوت",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "ايمن",
    description: "لعبة ماكينة الحظ",
    commandCategory: "fun",
    usages: "سلوت",
    cooldowns: 5
};
