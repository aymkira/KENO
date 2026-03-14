

module.exports.config = {
    name: "guard",
    eventType: ["log:thread-admins"],
    version: "2.0.0",
    credits: "KIRA",
    description: "يمنع أي شخص من تغيير صلاحيات الأدمن بدون إذن عند تفعيل الحماية"
};

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬";

module.exports.run = async function ({ event, api, Threads }) {
    const { logMessageType, logMessageData, author, threadID, messageID } = event;
    const data = (await Threads.getData(threadID)).data;

    // إذا الحماية مطفية → تجاهل
    if (!data?.guard) return;

    const botID = api.getCurrentUserID();

    if (logMessageType === "log:thread-admins") {

        // تجاهل أفعال البوت نفسه
        if (author == botID) return;
        // تجاهل إذا المستهدف هو البوت
        if (logMessageData.TARGET_ID == botID) return;

        if (logMessageData.ADMIN_EVENT === "add_admin") {
            // إلغاء ترقية المستهدف + إلغاء صلاحية من فعلها
            api.changeAdminStatus(threadID, logMessageData.TARGET_ID, false);
            api.changeAdminStatus(threadID, author, false, (err) => {
                api.sendMessage(
                    err
                        ? `${HEADER}\n\n⚠️ حاول شخص ما ترقية عضو — تم التصدي له`
                        : `${HEADER}\n\n🛡️ تم تفعيل حماية المجموعة\n` +
                          `🚫 لا يُسمح بتغيير صلاحيات الأدمن\n` +
                          `🆔 المخالف: ${author}`,
                    threadID, messageID
                );
            });
        }

        else if (logMessageData.ADMIN_EVENT === "remove_admin") {
            // إعادة صلاحية المستهدف + إلغاء صلاحية من فعلها
            api.changeAdminStatus(threadID, logMessageData.TARGET_ID, true);
            api.changeAdminStatus(threadID, author, false, (err) => {
                api.sendMessage(
                    err
                        ? `${HEADER}\n\n⚠️ حاول شخص ما سحب صلاحية أدمن — تم التصدي له`
                        : `${HEADER}\n\n🛡️ تم تفعيل حماية المجموعة\n` +
                          `🚫 لا يُسمح بسحب صلاحيات الأدمن\n` +
                          `🆔 المخالف: ${author}`,
                    threadID, messageID
                );
            });
        }
    }
};

