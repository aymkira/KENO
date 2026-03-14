const path = require("path");
const mongoPath = path.join(process.cwd(), "includes", "mongodb.js");
const mongoDB = require(mongoPath);

module.exports = {
    config: {
        name: "تصفير",
        version: "2.1.0",
        author: "Kira AI",
        hasPermssion: 2, // للمطور (أيمن) فقط
        category: " developer",
        guide: { ar: ".تصفير [منشن/أيدي/رد]" }
    },

    onStart: async function ({ api, event, args, Users }) {
        const { threadID, messageID } = event;
        const bold = (text) => global.utils.toBoldSans(text);
        
        // استخراج المعرف (منشن، أيدي، أو رد)
        const targetID = global.utils.extractMention(event, args);

        if (!targetID) {
            return api.sendMessage(`💡 صيغة الأمر: .تصفير [منشن أو أيدي أو رد]`, threadID, messageID);
        }

        try {
            await mongoDB.setBalance(targetID, 0);
            const name = await Users.getNameUser(targetID) || "العضو";
            
            return api.sendMessage(`⌬ ━━━ ${bold("KIRA ADMIN")} ━━━ ⌬\n\n🧹 تـم تـصـفـيـر خـزنـة: ${name}\n💰 الـرصـيـد الـآن: [ 0$ ]\n\n⌬ ━━━━━━━━━━━━━━━━ ⌬`, threadID, messageID);
        } catch (e) {
            return api.sendMessage("❌ حدث خطأ أثناء التصفير.", threadID);
        }
    }
};
