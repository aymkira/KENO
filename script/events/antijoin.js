

module.exports.config = {
    name: "antijoin",
    eventType: ["log:subscribe"],
    version: "1.0.0",
    credits: "KIRA",
    description: "يطرد أي عضو جديد عند تفعيل وضع حظر الإضافة"
};

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗡𝗧𝗜𝗝𝗢𝗜𝗡 ━━ ⌬";

module.exports.run = async function ({ event, api, Threads }) {
    const data = (await Threads.getData(event.threadID)).data;

    // إذا وضع الحماية مطفي → تجاهل
    if (!data?.newMember) return;

    // إذا البوت نفسه هو اللي انضاف → تجاهل
    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) return;

    const newMembers = event.logMessageData.addedParticipants.map(i => i.userFbId);

    for (const userID of newMembers) {
        await new Promise(r => setTimeout(r, 1000));
        api.removeUserFromGroup(userID, event.threadID, async (err) => {
            if (err) {
                data.newMember = false;
                await Threads.setData(event.threadID, { data });
                global.data.threadData.set(event.threadID, data);
            }
        });
    }

    return api.sendMessage(
        `${HEADER}\n\n🚫 وضع حظر الإضافة مُفعّل\n` +
        `👥 تم طرد ${newMembers.length} عضو جديد\n` +
        `💡 لإيقاف الحماية استخدم الأمر المناسب`,
        event.threadID
    );
};
