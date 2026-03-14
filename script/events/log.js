module.exports.config = {
    name: "log",
    eventType: ["log:unsubscribe", "log:subscribe", "log:thread-name"],
    version: "1.0.0",
    credits: "𝐊𝐈𝐓𝐄 凧",
    description: "Record bot activity notifications!",
    envConfig: {
      enable: true
    }
};

module.exports.run = async function ({ api, event, Users, Threads }) {
    const logger = require("../../utils/log");
    if (!global.configModule[this.config.name].enable) return;
    let botID = api.getCurrentUserID();
    var allThreadID = global.data.allThreadID;
    for (const singleThread of allThreadID) {
        const thread = global.data.threadData.get(singleThread) || {};
        if (typeof thread["log"] != "undefined" && thread["log"] == false) return;
    }
    
    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Baghdad").format("D/MM/YYYY HH:mm:ss");
    let nameThread = global.data.threadInfo.get(event.threadID)?.threadName || "بدون اسم"; 
    let threadInfo = await api.getThreadInfo(event.threadID);
    nameThread = threadInfo.threadName;
    const nameUser = global.data.userName.get(event.author) || await Users.getNameUser(event.author);

    var formReport = 
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗟𝗢𝗚 ━━ ⌬\n\n` +
        `📌 المجموعة: ${nameThread}\n` +
        `🆔 ID: ${event.threadID}\n` +
        `⚡ الحدث: {task}\n` +
        `👤 المستخدم: ${nameUser}\n` +
        `🆔 ID: ${event.author}\n` +
        `⏰ الوقت: ${time}`;

    let task = "";

    switch (event.logMessageType) {
        case "log:thread-name": {
            newName = event.logMessageData.name || "بدون اسم";
            await Threads.setData(event.threadID, { name: newName });
            break;
        }
        case "log:subscribe": {
            if (event.logMessageData.addedParticipants.some(i => i.userFbId == botID)) 
                task = "✅ مستخدم أضاف البوت لمجموعة جديدة";
            break;
        }
        case "log:unsubscribe": {
            if (event.logMessageData.leftParticipantFbId == botID) {
                if (event.senderID == botID) return;
                const data = (await Threads.getData(event.threadID)).data || {};
                data.banned = true;
                data.reason = "طرد البوت بدون إذن 🚫";
                data.dateAdded = time;
                await Threads.setData(event.threadID, { data });
                global.data.threadBanned.set(event.threadID, { reason: data.reason, dateAdded: data.dateAdded });
                task = "🚫 مستخدم طرد البوت من المجموعة";
            }
            break;
        }
        default:
            break;
    }

    if (task.length == 0) return;

    formReport = formReport.replace(/\{task}/g, task);

    return api.sendMessage(formReport, global.config.ADMINBOT[0], (error, info) => {
        if (error) return logger(formReport, "Logging Event");
    });
};
