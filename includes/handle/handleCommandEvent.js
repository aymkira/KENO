
module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥 ━━ ⌬";

    return function ({ event }) {
        const { allowInbox } = global.config;
        const { userBanned, threadBanned } = global.data;
        const { commands, eventRegistered } = global.client;

        var senderID = String(event.senderID);
        var threadID = String(event.threadID);

        if (
            userBanned.has(senderID) ||
            threadBanned.has(threadID) ||
            (allowInbox == false && senderID == threadID)
        ) return;

        for (const eventReg of eventRegistered) {
            const cmd = commands.get(eventReg);
            if (!cmd) continue;
            if (typeof cmd.handleEvent !== "function") continue;

            // ─── getText متعدد اللغات ────────────────────────────
            let getText2 = () => {};
            if (cmd.languages && typeof cmd.languages === "object") {
                getText2 = (...values) => {
                    if (!cmd.languages.hasOwnProperty(global.config.language)) return "";
                    let lang = cmd.languages[global.config.language][values[0]] || "";
                    for (let i = values.length - 1; i > 0; i--) {
                        lang = lang.replace(new RegExp(`%${i}`, "g"), values[i]);
                    }
                    return lang;
                };
            }

            try {
                const Obj = { event, api, models, Users, Threads, Currencies, getText: getText2 };
                cmd.handleEvent(Obj);
            } catch (error) {
                logger(`❌ خطأ في CommandEvent [${cmd.config?.name}]: ${error.message}`, "error");
            }
        }
    };
};
