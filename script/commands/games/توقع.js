const path = require("path");

module.exports.config = {
    name: "توقع",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "ayman",
    description: "لعبة الصناديق العملاقة - نظام كيرا المطور",
    commandCategory: "games",
    usages: "[المبلغ]",
    cooldowns: 5
};

// دالة الخط الخشن - تم إصلاحها بالكامل
const heavy = (text) => {
    const keys = {
        "A":"𝗔","B":"𝗕","C":"𝗖","D":"𝗗","E":"𝗘","F":"𝗙","G":"𝗚","H":"𝗛","I":"𝗜","J":"𝗝","K":"𝗞","L":"𝗟","M":"𝗠","N":"𝗡","O":"𝗢","P":"𝗣","Q":"𝗤","R":"𝗥","S":"𝗦","T":"𝗧","U":"𝗨","V":"𝗩","W":"𝗪","X":"𝗫","Y":"𝗬","Z":"𝗭",
        "a":"𝗮","b":"𝗯","c":"𝗰","d":"𝗱","e":"𝗲","f":"𝗳","g":"𝗴","h":"𝗵","i":"𝗶","j":"𝗷","k":"𝗸","l":"𝗹","m":"𝗺","n":"𝗻","o":"𝗼","p":"𝗽","q":"𝗾","r":"𝗿","s":"𝘀","t":"𝘁","u":"𝘂","v":"𝘃","w":"𝘄","x":"𝘅","y":"𝘆","z":"𝘇",
        "0":"𝟬","1":"𝟭","2":"𝟮","3":"𝟯","4":"𝟰","5":"𝟱","6":"𝟲","7":"𝟳","8":"𝟴","9":"𝟵"
    };
    return text.toString().split("").map(char => keys[char] || char).join("");
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const mongodb = require(path.join(process.cwd(), "includes", "mongodb.js"));
    
    const header = `⌬ ━━━━━━━━━━━━ ⌬\n   ${heavy("KIRA MEGA BOXES")}\n⌬ ━━━━━━━━━━━━ ⌬`;

    try {
        const userData = await mongodb.getUserData(senderID);
        if (!userData) return api.sendMessage("❌ خطأ: لم يتم العثور على حسابك في KiraDB", threadID, messageID);

        let bet = args[0];
        if (bet == "all") bet = userData.currency.money;
        bet = parseInt(bet);

        if (isNaN(bet) || bet < 100) {
            return api.sendMessage(`${header}\n\n⚠️ ${heavy("ERROR")}\nيرجى تحديد مبلغ رهان صحيح (100 فأكثر).`, threadID, messageID);
        }

        if (bet > userData.currency.money) {
            return api.sendMessage(`${header}\n\n❌ ${heavy("POOR")}\nرصيدك الحالي (${userData.currency.money}$) لا يكفي للرهان!`, threadID, messageID);
        }

        const msg = `${header}\n\n` +
            `👤 ${heavy("PLAYER")}: ${userData.user.name}\n` +
            `💰 ${heavy("BET")}: ${bet}$\n\n` +
            `🎁 اختر صندوقك الحظ:\n\n` +
            `1️⃣ 📦 ${heavy("BOX 01")}\n` +
            `2️⃣ 📦 ${heavy("BOX 02")}\n` +
            `3️⃣ 📦 ${heavy("BOX 03")}\n\n` +
            `📥 ${heavy("REPLY")} برقم الصندوق!`;

        return api.sendMessage(msg, threadID, (error, info) => {
            if (error) return console.error(error);
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID,
                bet: bet
            });
        }, messageID);

    } catch (e) {
        api.sendMessage("❌ عطل في البنك السحابي.", threadID, messageID);
    }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (senderID != handleReply.author) return;

    const mongodb = require(path.join(process.cwd(), "includes", "mongodb.js"));
    const choice = parseInt(body);

    if (isNaN(choice) || choice < 1 || choice > 3) return;

    api.unsendMessage(handleReply.messageID);
    api.setMessageReaction("🎲", messageID, () => {}, true);

    const winningBox = Math.floor(Math.random() * 3) + 1;
    const isWin = (choice === winningBox);

    try {
        if (isWin) {
            const prize = handleReply.bet * 2; // الربح ضعف المبلغ
            await mongodb.addMoney(senderID, prize);
            
            const winMsg = `⌬ ━━━━━━━━━━━━ ⌬\n   ${heavy("KIRA TREASURE")}\n⌬ ━━━━━━━━━━━━ ⌬\n\n` +
                `✨ ${heavy("WINNER")}\n` +
                `📦 فتحت الصندوق (${choice}) ووجدت الكنز!\n\n` +
                `💰 ${heavy("PRIZE")}: +${prize}$\n` +
                `🥳 مبروك يا ملك!`;
            
            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(winMsg, threadID, messageID);
            
        } else {
            await mongodb.removeMoney(senderID, handleReply.bet);
            
            const loseMsg = `⌬ ━━━━━━━━━━━━ ⌬\n     ${heavy("KIRA BOOM")}\n⌬ ━━━━━━━━━━━━ ⌬\n\n` +
                `💥 ${heavy("LOST")}\n` +
                `📦 الصندوق (${choice}) كان فارغاً!\n\n` +
                `🗑️ ${heavy("LOSS")}: -${handleReply.bet}$\n` +
                `💡 الكنز كان في: [ ${winningBox} ]`;
                
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage(loseMsg, threadID, messageID);
        }
    } catch (e) {
        api.sendMessage("❌ فشل تحديث رصيدك.", threadID, messageID);
    }
};
