

module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    const moment = require("moment-timezone");

    return async function ({ event }) {
        const timeStart = Date.now();
        const time = moment.tz("Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");

        const { userBanned, threadBanned } = global.data;
        const { events } = global.client;
        const { allowInbox, DeveloperMode } = global.config;

        var { senderID, threadID, reaction, messageReply, type } = event;
        senderID = String(senderID);
        threadID = String(threadID);

        // ════════════════════════════════════════════════════════════
        // 🗑️ حذف رسائل البوت عبر التفاعل — من KIRA
        // ════════════════════════════════════════════════════════════
        if (type === "message_reaction" && messageReply?.senderID === api.getCurrentUserID()) {
            const deleteReactions = ["👍", "😡", "🗑️", "❌", "💔", "🚫", "⛔"];
            if (deleteReactions.includes(reaction)) {
                try {
                    await api.unsendMessage(messageReply.messageID);
                    if (DeveloperMode) logger(`🗑️ حذف رسالة: ${messageReply.messageID}`, "EVENT");
                } catch (err) {
                    // إعادة المحاولة بعد ثانية
                    setTimeout(async () => {
                        try { await api.unsendMessage(messageReply.messageID); } catch (_) {}
                    }, 1000);
                }
                return;
            }
        }

        // ════════════════════════════════════════════════════════════
        // 🚫 فلترة المحظورين والـ Inbox
        // ════════════════════════════════════════════════════════════
        if (
            userBanned.has(senderID) ||
            threadBanned.has(threadID) ||
            (allowInbox == false && senderID == threadID)
        ) return;

        // ════════════════════════════════════════════════════════════
        // ⚙️ معالجة الأحداث
        // ════════════════════════════════════════════════════════════
        const currentEventType = event.type || event.logMessageType;
        let processedEvents = 0;

        if (DeveloperMode) {
            logger(`📊 Event: ${currentEventType} | Thread: ${threadID} | Events: ${events.size}`, "EVENT DEBUG");
        }

        for (const [eventName, eventModule] of events.entries()) {
            // التحقق من eventType
            if (!eventModule.config?.eventType) {
                if (DeveloperMode) logger(`⚠️ ${eventName}: مفقود eventType`, "EVENT");
                continue;
            }

            if (!eventModule.config.eventType.includes(currentEventType)) continue;

            try {
                const Obj = { api, event, models, Users, Threads, Currencies };

                // ✅ دعم run و handleEvent معاً
                if (typeof eventModule.run === "function") {
                    await eventModule.run(Obj);
                } else if (typeof eventModule.handleEvent === "function") {
                    await eventModule.handleEvent(Obj);
                } else {
                    logger(`⚠️ Event ${eventName} لا يحتوي على run أو handleEvent`, "EVENT");
                    continue;
                }

                processedEvents++;

                if (DeveloperMode) {
                    logger(
                        `✅ Event: ${eventName} | Type: ${currentEventType} | ${Date.now() - timeStart}ms`,
                        "EVENT"
                    );
                }
            } catch (error) {
                logger(`❌ خطأ في Event [${eventName}]: ${error.message}`, "error");
                if (DeveloperMode) console.error(error.stack);
            }
        }

        if (DeveloperMode) {
            const total = Date.now() - timeStart;
            logger(
                processedEvents > 0
                    ? `✅ معالجة ${processedEvents} events في ${total}ms`
                    : `ℹ️ لم يُعالَج أي event لنوع: ${currentEventType}`,
                "EVENT"
            );
        }

        return;
    };
};
