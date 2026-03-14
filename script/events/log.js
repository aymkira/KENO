
module.exports.config = {
    name: "log",
    eventType: ["log:unsubscribe", "log:subscribe", "log:thread-name"],
    version: "2.0.0",
    credits: "KIRA",
    description: "يراقب نشاط البوت ويرسل إشعارات مهمة للأدمن"
};

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗟𝗢𝗚 ━━ ⌬";

module.exports.run = async function ({ api, event, Users, Threads }) {
    const moment = require("moment-timezone");
    const time   = moment.tz("Asia/Baghdad").format("DD/MM/YYYY HH:mm:ss");
    const botID  = api.getCurrentUserID();

    const nameThread = (await api.getThreadInfo(event.threadID))?.threadName || "بدون اسم";
    const nameUser   = global.data.userName.get(event.author) || (await Users.getNameUser(event.author));

    let task = "";

    switch (event.logMessageType) {

        case "log:thread-name": {
            const newName = event.logMessageData.name || "بدون اسم";
            await Threads.setData(event.threadID, { name: newName });
            // لا إشعار لتغيير الاسم — فقط تحديث صامت
            return;
        }

        case "log:subscribe": {
            if (event.logMessageData.addedParticipants.some(i => i.userFbId == botID)) {
                task = `✅ تمت إضافة البوت إلى مجموعة جديدة`;
            } else return;
            break;
        }

        case "log:unsubscribe": {
            if (event.logMessageData.leftParticipantFbId == botID) {
                if (event.senderID == botID) return;

                // تسجيل المجموعة كمحظورة
                const data = (await Threads.getData(event.threadID)).data || {};
                data.banned    = true;
                data.reason    = "طرد البوت بدون إذن";
                data.dateAdded = time;
                await Threads.setData(event.threadID, { data });
                global.data.threadBanned.set(event.threadID, {
                    reason: data.reason,
                    dateAdded: data.dateAdded
                });

                task = `🚫 قام مستخدم بطرد البوت من المجموعة`;
            } else return;
            break;
        }

        default: return;
    }

    const report =
        `${HEADER}\n\n` +
        `📌 المجموعة: ${nameThread}\n` +
        `🆔 ID: ${event.threadID}\n` +
        `⚡ الحدث: ${task}\n` +
        `👤 المستخدم: ${nameUser}\n` +
        `🆔 ID: ${event.author}\n` +
        `⏰ الوقت: ${time}`;

    return api.sendMessage(report, global.config.ADMINBOT[0]);
};
