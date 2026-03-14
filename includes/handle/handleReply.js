

module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗥𝗘𝗣𝗟𝗬 ━━ ⌬";

    return function ({ event }) {
        if (!event.messageReply) return;

        const { handleReply, commands } = global.client;
        const { messageID, threadID, messageReply } = event;

        if (handleReply.length === 0) return;

        const indexOfHandle = handleReply.findIndex(e => e.messageID == messageReply.messageID);
        if (indexOfHandle < 0) return;

        const indexOfMessage = handleReply[indexOfHandle];
        const handleNeedExec = commands.get(indexOfMessage.name);

        if (!handleNeedExec) {
            return api.sendMessage(
                `${HEADER}\n\n⚠️ الأمر المرتبط بهذا الرد غير موجود`,
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
                handleReply: indexOfMessage,
                getText: getText2
            };
            handleNeedExec.handleReply(Obj);
        } catch (error) {
            return api.sendMessage(
                `${HEADER}\n\n❌ خطأ أثناء تنفيذ الرد\n${error.message}`,
                threadID, messageID
            );
        }
    };
};
