if (!global.guessGames) global.guessGames = {};

module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
    const { threadID, messageID, senderID } = event;
    
    if (!global.guessGames[threadID]) {
        const randomNum = Math.floor(Math.random() * 100) + 1;
        global.guessGames[threadID] = {
            number: randomNum,
            attempts: 0,
            maxAttempts: 10
        };
        
        return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nبدأت لعبة التخمين!\nخمن رقم من 1 إلى 100\nلديك 10 محاولات\n\nاكتب: خمن [الرقم]`, threadID, messageID);
    }
    
    const guess = parseInt(args[0]);
    if (isNaN(guess) || guess < 1 || guess > 100) {
        return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nاكتب رقم صحيح من 1 إلى 100", threadID, messageID);
    }
    
    const game = global.guessGames[threadID];
    game.attempts++;
    
    if (guess === game.number) {
        delete global.guessGames[threadID];
        return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nمبروك! 🎉\nالرقم الصحيح: ${game.number}\nعدد المحاولات: ${game.attempts}`, threadID, messageID);
    }
    
    if (game.attempts >= game.maxAttempts) {
        delete global.guessGames[threadID];
        return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nانتهت المحاولات!\nالرقم الصحيح كان: ${game.number}`, threadID, messageID);
    }
    
    const hint = guess > game.number ? "الرقم أصغر" : "الرقم أكبر";
    const remaining = game.maxAttempts - game.attempts;
    
    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\n${hint}\nالمحاولات المتبقية: ${remaining}`, threadID, messageID);
};

module.exports.config = {
    name: "خمن",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "ايمن",
    description: "لعبة تخمين الرقم",
    commandCategory: "games",
    usages: "خمن [الرقم]",
    cooldowns: 3
};
