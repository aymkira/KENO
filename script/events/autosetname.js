

const fs   = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "autosetname",
    eventType: ["log:subscribe"],
    version: "1.0.0",
    credits: "KIRA",
    description: "يعيّن كنية مخصصة للأعضاء الجدد حسب إعدادات كل مجموعة"
};

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗨𝗧𝗢𝗡𝗔𝗠𝗘 ━━ ⌬";
const dataPath = path.join(__dirname, "../commands/cache/autosetname.json");

module.exports.run = async function ({ api, event }) {
    const { threadID } = event;
    const newMembers = event.logMessageData.addedParticipants.map(i => i.userFbId);

    // تحميل إعدادات الكنيات
    let dataJson = [];
    try {
        dataJson = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    } catch (_) { return; }

    const thisThread = dataJson.find(item => item.threadID == threadID);
    if (!thisThread || thisThread.nameUser.length === 0) return;

    const prefix = thisThread.nameUser[0];

    for (const userID of newMembers) {
        await new Promise(r => setTimeout(r, 1000));
        try {
            const userInfoMap = await api.getUserInfo(userID);
            const realName    = userInfoMap[userID]?.name || userID;
            const newNick     = `${prefix} ${realName}`;
            await api.changeNickname(newNick, threadID, userID);
        } catch (e) {
            console.error(`❌ autosetname خطأ للمستخدم ${userID}:`, e.message);
        }
    }

    return api.sendMessage(
        `${HEADER}\n\n✅ تم تعيين الكنية للأعضاء الجدد تلقائياً`,
        threadID
    );
};
