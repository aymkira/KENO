'use strict';

module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const HEADER = '⌬ ━━ 𝗞𝗜𝗥𝗔 𝗥𝗘𝗔𝗖𝗧𝗜𝗢𝗡 ━━ ⌬';
    const logger = require('../../utils/log.js');
    const moment = require('moment-timezone');

    const log = (name, sid, tid, reaction, ms, ok) => {
        if (!global.config?.DeveloperMode) return;
        logger(
            `${ok ? '✅' : '❌'} handleReaction | ${name} | ${reaction} | ${sid} | ${tid} | ${ms}ms | ${moment.tz('Asia/Baghdad').format('HH:mm:ss')}`,
            '[ REACTION ]'
        );
    };

    const MAX_AGE  = 60 * 60 * 1000;
    const MAX_SIZE = 200;

    function cleanup() {
        const list = global.client.handleReaction;
        const now  = Date.now();
        for (let i = list.length - 1; i >= 0; i--)
            if (now - (list[i].createdAt || 0) > MAX_AGE) list.splice(i, 1);
        if (list.length > MAX_SIZE)
            list.splice(0, list.length - MAX_SIZE);
    }

    return async function ({ event }) {
        const { handleReaction, commands } = global.client;
        const { messageID, threadID, senderID } = event;
        if (!handleReaction.length) return;

        if (handleReaction.length > 50) cleanup();

        const idx = handleReaction.findIndex(e => e.messageID == messageID);
        if (idx < 0) return;

        const entry = handleReaction[idx];
        const sid   = String(senderID);
        const tid   = String(threadID);

        // فحص الحظر
        const { userBanned, threadBanned } = global.data;
        if (userBanned.has(sid)   && !global.config.ADMINBOT?.includes(sid)) return;
        if (threadBanned.has(tid) && !global.config.ADMINBOT?.includes(sid)) return;

        const cmd = commands.get(entry.name);
        if (!cmd?.handleReaction) { handleReaction.splice(idx, 1); return; }

        // getText
        let getText2 = () => '';
        if (cmd.languages?.[global.config.language]) {
            getText2 = (...values) => {
                let text = cmd.languages[global.config.language][values[0]] || '';
                for (let i = values.length - 1; i > 0; i--)
                    text = text.replace(new RegExp(`%${i}`, 'g'), values[i]);
                return text;
            };
        }

        try {
            const _t = Date.now();
            await cmd.handleReaction({ api, event, models, Users, Threads, Currencies, handleReaction: entry, getText: getText2 });
            log(entry.name, sid, tid, event.reaction, Date.now() - _t, true);
        } catch (error) {
            log(entry.name, sid, tid, event.reaction, 0, false);
            console.error(`[handleReaction] ❌ ${entry.name}: ${error.message}`);
            api.sendMessage(`${HEADER}\n\n❌ خطأ: ${error.message}`, threadID, messageID);
        }
    };
};
