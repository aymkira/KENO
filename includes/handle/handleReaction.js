module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const HEADER    = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗥𝗘𝗔𝗖𝗧𝗜𝗢𝗡 ━━ ⌬";
    const logger    = require("../../utils/log.js");
    const moment    = require("moment-timezone");
    const logReact  = (name, sid, tid, reaction, ms, ok) => {
        if (!global.config?.DeveloperMode) return;
        const time = moment.tz("Asia/Baghdad").format("HH:mm:ss");
        logger(
            `${ok ? "✅" : "❌"} handleReaction | ${name} | ${reaction} | ${sid} | ${tid} | ${ms}ms | ${time}`,
            "[ REACTION ]"
        );
    };

    const MAX_AGE_MS     = 60 * 60 * 1000;
    const MAX_REACTIONS  = 200;

    function cleanup() {
        const { handleReaction } = global.client;
        const now = Date.now();
        for (let i = handleReaction.length - 1; i >= 0; i--) {
            if (now - (handleReaction[i].createdAt || 0) > MAX_AGE_MS)
                handleReaction.splice(i, 1);
        }
        if (handleReaction.length > MAX_REACTIONS)
            handleReaction.splice(0, handleReaction.length - MAX_REACTIONS);
    }

    return async function ({ event }) {
        const { handleReaction, commands } = global.client;
        const { messageID, threadID, senderID } = event;

        if (handleReaction.length === 0) return;

        if (handleReaction.length > 50) cleanup();

        const indexOfHandle = handleReaction.findIndex(e => e.messageID == messageID);
        if (indexOfHandle < 0) return;

        const indexOfMessage = handleReaction[indexOfHandle];

        // فحص الحظر
        const { userBanned, threadBanned } = global.data;
        const sid = String(senderID), tid = String(threadID);
        if (userBanned.has(sid)   && !global.config.ADMINBOT?.includes(sid)) return;
        if (threadBanned.has(tid) && !global.config.ADMINBOT?.includes(sid)) return;

        const handleNeedExec = commands.get(indexOfMessage.name);

        if (!handleNeedExec?.handleReaction) {
            handleReaction.splice(indexOfHandle, 1);
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
                handleReaction: indexOfMessage,
                getText: getText2,
            };
            const _t = Date.now();
            await handleNeedExec.handleReaction(Obj);
            logReact(indexOfMessage.name, sid, tid, event.reaction, Date.now()-_t, true);
        } catch (error) {
            logReact(indexOfMessage.name, sid, tid, event.reaction, 0, false);
            console.error(`[handleReaction] ❌ ${indexOfMessage.name}: ${error.message}`);
            return api.sendMessage(
                `${HEADER}\n\n❌ خطأ أثناء تنفيذ التفاعل\n${error.message}`,
                threadID, messageID
            );
        }
    };
};
