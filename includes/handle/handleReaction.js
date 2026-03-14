

module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗥𝗘𝗔𝗖𝗧𝗜𝗢𝗡 ━━ ⌬";

    return function ({ event }) {
        const { handleReaction, commands } = global.client;
        const { messageID, threadID } = event;

        if (handleReaction.length === 0) return;

        const indexOfHandle = handleReaction.findIndex(e => e.messageID == messageID);
        if (indexOfHandle < 0) return;

        const indexOfMessage = handleReaction[indexOfHandle];
        const handleNeedExec = commands.get(indexOfMessage.name);

        if (!handleNeedExec) {
            return api.sendMessage(
                `${HEADER}\n\n⚠️ الأمر المرتبط بهذا التفاعل غير موجود`,
                threadID, messageID
            );
        }

        // ─── getText متعدد اللغات ────────────────────────────────
        let getText2 = () => {};
        if (handleNeedExec.languages && typeof handleNeedExec.languages === "object") {
            getText2 = (...values) => {
                if (!handleNeedExec.languages.hasOwnProperty(global.config.language)) return "";
                let lang = handleNeedExec.languages[global.config.language][values[0]] || "";
                for (let i = values.length - 1; i > 0; i--) {
                    lang = lang.replace(new RegExp(`%${i}`, "g"), values[i]);
                }
                return lang;
            };
        }

        try {
            const Obj = {
                api, event, models, Users, Threads, Currencies,
                handleReaction: indexOfMessage,
                getText: getText2
            };
            handleNeedExec.handleReaction(Obj);
        } catch (error) {
            return api.sendMessage(
                `${HEADER}\n\n❌ خطأ أثناء تنفيذ التفاعل\n${error.message}`,
                threadID, messageID
            );
        }
    };
};
