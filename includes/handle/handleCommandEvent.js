'use strict';

module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require('../../utils/log.js');

    return function ({ event }) {
        const { allowInbox }                 = global.config;
        const { userBanned, threadBanned }   = global.data;
        const { commands, eventRegistered }  = global.client;

        const senderID = String(event.senderID);
        const threadID = String(event.threadID);

        if (
            userBanned.has(senderID) ||
            threadBanned.has(threadID) ||
            (allowInbox == false && senderID === threadID)
        ) return;

        for (const eventReg of eventRegistered) {
            const cmd = commands.get(eventReg);
            if (!cmd || typeof cmd.handleEvent !== 'function') continue;

            // getText للغة
            let getText2 = () => '';
            if (cmd.languages && typeof cmd.languages === 'object') {
                getText2 = (...values) => {
                    const lang = global.config.language;
                    if (!cmd.languages[lang]) return '';
                    let text = cmd.languages[lang][values[0]] || '';
                    for (let i = values.length - 1; i > 0; i--)
                        text = text.replace(new RegExp(`%${i}`, 'g'), values[i]);
                    return text;
                };
            }

            try {
                cmd.handleEvent({ event, api, models, Users, Threads, Currencies, getText: getText2 });
            } catch (error) {
                logger(`❌ CommandEvent [${cmd.config?.name}]: ${error.message}`, 'error');
            }
        }
    };
};
