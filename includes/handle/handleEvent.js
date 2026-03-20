'use strict';

module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require('../../utils/log.js');
    const moment = require('moment-timezone');

    return async function ({ event }) {
        const timeStart = Date.now();

        const { userBanned, threadBanned } = global.data;
        const { events } = global.client;
        const { allowInbox, DeveloperMode } = global.config;

        var { senderID, threadID, reaction, messageReply, type } = event;
        senderID = String(senderID);
        threadID = String(threadID);

        // ── حذف رسائل البوت بالتفاعل ─────────────────────────────
        if (type === 'message_reaction' && messageReply?.senderID === api.getCurrentUserID()) {
            const deleteReactions = ['👍', '😡', '🗑️', '❌', '💔', '🚫', '⛔'];
            if (deleteReactions.includes(reaction)) {
                try { await api.unsendMessage(messageReply.messageID); } catch (_) {
                    setTimeout(async () => {
                        try { await api.unsendMessage(messageReply.messageID); } catch (_) {}
                    }, 1000);
                }
                return;
            }
        }

        // ── فلترة المحظورين ───────────────────────────────────────
        if (
            userBanned.has(senderID) ||
            threadBanned.has(threadID) ||
            (allowInbox == false && senderID === threadID)
        ) return;

        // ── تحديد نوع الحدث الفعلي ───────────────────────────────
        // event.type = "event" → الحدث الحقيقي في logMessageType
        const currentEventType = (type === 'event')
            ? event.logMessageType
            : type;

        if (!currentEventType) return;

        let processed = 0;

        for (const [eventName, eventModule] of events.entries()) {
            const eventTypes = eventModule.config?.eventType;
            if (!Array.isArray(eventTypes)) continue;
            if (!eventTypes.includes(currentEventType)) continue;

            try {
                const Obj = { api, event, models, Users, Threads, Currencies };

                if (typeof eventModule.run === 'function') {
                    await eventModule.run(Obj);
                } else if (typeof eventModule.handleEvent === 'function') {
                    await eventModule.handleEvent(Obj);
                }

                processed++;

                if (DeveloperMode) {
                    logger(
                        `✅ ${eventName} | ${currentEventType} | ${Date.now() - timeStart}ms`,
                        '[ EVENT ]'
                    );
                }
            } catch (error) {
                logger(`❌ Event [${eventName}]: ${error.message}`, 'error');
                if (DeveloperMode) console.error(error.stack);
            }
        }

        if (DeveloperMode && processed === 0) {
            logger(`ℹ️ لا يوجد handler لـ: ${currentEventType}`, '[ EVENT ]');
        }
    };
};
