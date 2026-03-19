module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const HEADER  = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗥𝗘𝗣𝗟𝗬 ━━ ⌬";
    const logger  = require("../../utils/log.js");
    const moment  = require("moment-timezone");
    const logReply = (name, sid, tid, ms, ok) => {
        if (!global.config?.DeveloperMode) return;
        const time = moment.tz("Asia/Baghdad").format("HH:mm:ss");
        logger(
            `${ok ? "✅" : "❌"} handleReply | ${name} | ${sid} | ${tid} | ${ms}ms | ${time}`,
            "[ REPLY ]"
        );
    };

    // cleanup — احذف الردود القديمة (أكثر من ساعة)
    const MAX_AGE_MS  = 60 * 60 * 1000;   // ساعة
    const MAX_REPLIES = 200;               // حد أقصى

    function cleanup() {
        const { handleReply } = global.client;
        const now = Date.now();

        // احذف القديمة
        for (let i = handleReply.length - 1; i >= 0; i--) {
            const age = now - (handleReply[i].createdAt || 0);
            if (age > MAX_AGE_MS) handleReply.splice(i, 1);
        }

        // لو لازال كثير — احذف الأقدم
        if (handleReply.length > MAX_REPLIES) {
            handleReply.splice(0, handleReply.length - MAX_REPLIES);
        }
    }

    return async function ({ event }) {
        if (!event.messageReply) return;

        const { handleReply, commands } = global.client;
        const { messageID, threadID, messageReply, senderID } = event;

        if (handleReply.length === 0) return;

        // cleanup دوري
        if (handleReply.length > 50) cleanup();

        const indexOfHandle = handleReply.findIndex(e => e.messageID == messageReply.messageID);
        if (indexOfHandle < 0) return;

        const indexOfMessage = handleReply[indexOfHandle];

        // فحص DM
        const { allowInbox } = global.config;
        if (allowInbox == false && String(senderID) === String(threadID)) return;

        // فحص الحظر
        const { userBanned, threadBanned } = global.data;
        const sid = String(senderID), tid = String(threadID);
        if (userBanned.has(sid) && !global.config.ADMINBOT?.includes(sid)) return;
        if (threadBanned.has(tid) && !global.config.ADMINBOT?.includes(sid)) return;

        const handleNeedExec = commands.get(indexOfMessage.name);

        if (!handleNeedExec?.handleReply) {
            handleReply.splice(indexOfHandle, 1);
            return;
        }

        // getText
        let getText2 = () => {};
        if (handleNeedExec.languages?.[global.config.language]) {
            getText2 = (...values) => {
                let lang = handleNeedExec.languages[global.config.language][values[0]] || "";
                for (let i = values.length - 1; i > 0; i--)
                    lang = lang.replace(new RegExp(`%${i}`, "g"), values[i]);
                return lang;
            };
        }

        try {
            const Obj = {
                api, event, models, Users, Threads, Currencies,
                handleReply: indexOfMessage,
                getText: getText2,
            };
            const _t = Date.now();
            await handleNeedExec.handleReply(Obj);
            logReply(indexOfMessage.name, senderID, threadID, Date.now()-_t, true);
        } catch (error) {
            logReply(indexOfMessage.name, senderID, threadID, 0, false);
            console.error(`[handleReply] ❌ ${indexOfMessage.name}: ${error.message}`);
            return api.sendMessage(
                `${HEADER}\n\n❌ خطأ أثناء تنفيذ الرد\n${error.message}`,
                threadID, messageID
            );
        }
    };
};
