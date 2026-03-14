

module.exports.config = {
    name: "antibd",
    eventType: ["log:user-nickname"],
    version: "1.0.0",
    credits: "KIRA",
    description: "يمنع أي شخص من تغيير كنية البوت بدون إذن"
};

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗣𝗥𝗢𝗧𝗘𝗖𝗧 ━━ ⌬";

module.exports.run = async function ({ api, event, Users, Threads }) {
    const { logMessageData, threadID, author } = event;
    const botID = api.getCurrentUserID();
    const { BOTNAME, ADMINBOT } = global.config;

    // فقط إذا تم تغيير كنية البوت
    if (logMessageData.participant_id != botID) return;
    // إذا البوت نفسه أو الأدمن غيّروها — تجاهل
    if (author == botID || ADMINBOT.includes(author)) return;

    // جلب الكنية المحفوظة للبوت
    const threadData = await Threads.getData(threadID);
    const savedNickname = threadData?.nickname || BOTNAME;

    // إذا تغيّرت عن المحفوظة → أعدها
    if (logMessageData.nickname != savedNickname) {
        await api.changeNickname(savedNickname, threadID, botID);
        const userInfo = await Users.getData(author);
        return api.sendMessage(
            `${HEADER}\n\n🚫 لا يُسمح بتغيير كنية البوت\n` +
            `👤 المحاولة من: ${userInfo?.name || author}\n` +
            `🔄 تم استعادة الكنية الأصلية`,
            threadID
        );
    }
};
