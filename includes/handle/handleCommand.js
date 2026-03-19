module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const fs   = require("fs");
    const path = require("path");
    const stringSimilarity = require("string-similarity");
    const logger = require("../../utils/log.js");
    const moment = require("moment-timezone");

    const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const HEADER = {
        UTILITY:   "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬",
        ADMIN:     "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗗𝗠𝗜𝗡 ━━ ⌬",
        DEVELOPER: "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥 ━━ ⌬",
    };

    return async function ({ event }) {
        const dateNow = Date.now();
        const time    = moment.tz("Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");

        const { allowInbox, PREFIX, ADMINBOT, DeveloperMode, adminOnly, YASSIN } = global.config;
        const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
        const { commands, cooldowns } = global.client;

        var { body, senderID, threadID, messageID } = event;
        if (!body) return;

        senderID = String(senderID);
        threadID = String(threadID);

        // ── لوج مبسط ─────────────────────────────────────────────────
        const _log = (type, detail) => {
            if (!DeveloperMode) return;
            const t = moment.tz("Asia/Baghdad").format("HH:mm:ss");
            logger(`[CMD] ${type} | ${senderID} | ${threadID} | ${detail} | ${t}`, "[ CMD ]");
        };

        // ── DM (inbox) ────────────────────────────────────────────
        const isDM = senderID === threadID;
        if (isDM && allowInbox == false) return;

        // ── البادئة ────────────────────────────────────────────────
        const threadSetting = threadData.get(threadID) || {};
        const prefix  = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : PREFIX;
        const botID   = api.getCurrentUserID();
        const prefixRegex = new RegExp(`^(<@!?${botID}>|${escapeRegex(prefix)})\\s*`);
        const [matchedPrefix] = body.match(prefixRegex) || [null];
        if (!matchedPrefix) return;

        const args        = body.slice(matchedPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        var command       = commands.get(commandName);

        // ── فلاتر الحظر ───────────────────────────────────────────
        if (!ADMINBOT.includes(senderID)) {

            // فحص حظر المجموعة
            let isThreadBanned = threadBanned.has(threadID);
            if (!isThreadBanned && !isDM) {
                try {
                    const dataJS = require(path.join(__dirname, "../../includes/data.js"));
                    const rec    = await dataJS.loadFile("group/threads.json");
                    const tr     = rec[threadID];
                    if (tr?.banned) {
                        isThreadBanned = true;
                        global.data.threadBanned.set(threadID, { reason: tr.reason || "", dateAdded: tr.bannedAt || "" });
                    }
                } catch(_) {}
            }
            if (isThreadBanned) return;

            // فحص حظر المستخدم
            if (userBanned.has(senderID)) {
                try { api.setMessageReaction("🚫", messageID, () => {}, true); } catch(_) {}
                return;
            }

            if (YASSIN   === "true") return;
            if (adminOnly)           return;
        }

        // ── restrictList ──────────────────────────────────────────
        try {
            const restrictPath = path.join(__dirname, "../../script/commands/cache/addGroup.json");
            const restrictList = JSON.parse(fs.readFileSync(restrictPath, "utf8"));
            if (restrictList.includes(threadID)) {
                const tInfo   = threadInfo.get(threadID) || (await Threads.getInfo(threadID));
                const isAdmin = tInfo.adminIDs?.some(ad => ad.id == senderID);
                if (!isAdmin && !ADMINBOT.includes(senderID)) return;
            }
        } catch(_) {}

        // ── البحث عن أقرب أمر ─────────────────────────────────────
        if (!command) {
            const allNames = Array.from(commands.keys());
            if (!allNames.length) return;
            const checker = stringSimilarity.findBestMatch(commandName, allNames);
            if (checker.bestMatch.rating >= 0.8) {
                command = commands.get(checker.bestMatch.target);
            } else if (matchedPrefix) {
                const closest = checker.bestMatch.target;
                const msgs = [
                    `${HEADER.UTILITY}\n\n❌ خطأ: "${commandName}" غير مسجل\n💡 هل تقصد: '${closest}'؟`,
                    `${HEADER.UTILITY}\n\n⚠️ الأمر غير موجود\n🔍 جرب: '${closest}'`,
                    `${HEADER.UTILITY}\n\n😅 "${commandName}" مش موجود\n💬 قصدك '${closest}'؟`,
                ];
                return api.sendMessage(msgs[Math.floor(Math.random() * msgs.length)], threadID, messageID);
            }
        }
        if (!command) return;

        // ── أوامر محظورة ──────────────────────────────────────────
        if (!ADMINBOT.includes(senderID) && (commandBanned.get(threadID) || commandBanned.get(senderID))) {
            const banThreads = commandBanned.get(threadID) || [];
            const banUsers   = commandBanned.get(senderID) || [];
            if (banThreads.includes(command.config.name))
                return api.sendMessage(`${HEADER.ADMIN}\n\n🚫 الأمر محظور في هذه المجموعة`, threadID, messageID);
            if (banUsers.includes(command.config.name))
                return api.sendMessage(`${HEADER.ADMIN}\n\n⛔ أنت محظور من استخدام هذا الأمر`, threadID, messageID);
        }

        // ── NSFW ──────────────────────────────────────────────────
        if (
            command.config.commandCategory?.toLowerCase() === "nsfw" &&
            !global.data.threadAllowNSFW?.includes(threadID) &&
            !ADMINBOT.includes(senderID)
        ) return api.sendMessage(`${HEADER.UTILITY}\n\n🔞 محتوى محظور في هذه المجموعة`, threadID, messageID);

        // ── الصلاحيات ─────────────────────────────────────────────
        let permssion = 0;
        if (ADMINBOT.includes(senderID)) {
            permssion = 2;
        } else if (!isDM) {
            // فحص أدمن المجموعة فقط لو مش DM
            try {
                const tInfo = threadInfo.get(threadID) || (await Threads.getInfo(threadID));
                if (tInfo.adminIDs?.find(el => el.id == senderID)) permssion = 1;
            } catch(_) {}
        }

        if (command.config.hasPermssion > permssion)
            return api.sendMessage(
                `${HEADER.ADMIN}\n\n⚠️ ليس لديك صلاحية\nالأمر: ${command.config.name}`,
                threadID, messageID
            );

        // ── Cooldown ───────────────────────────────────────────────
        if (!cooldowns.has(command.config.name)) cooldowns.set(command.config.name, new Map());
        const timestamps     = cooldowns.get(command.config.name);
        const expirationTime = (command.config.cooldowns || 1) * 1000;
        if (timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime)
            return api.setMessageReaction("⏳", messageID, () => {}, true);

        // ── getText ────────────────────────────────────────────────
        let getText2 = () => {};
        if (command.languages?.[global.config.language]) {
            getText2 = (...values) => {
                let lang = command.languages[global.config.language][values[0]] || "";
                for (let i = values.length - 1; i > 0; i--)
                    lang = lang.replace(new RegExp(`%${i}`, "g"), values[i]);
                return lang;
            };
        }

        // ── تنفيذ الأمر ───────────────────────────────────────────
        try {
            await command.run({ api, event, args, models, Users, Threads, Currencies, permssion, getText: getText2 });
            timestamps.set(senderID, dateNow);

            if (DeveloperMode)
                logger(`✅ ${commandName} | ${senderID} | ${threadID} | ${Date.now() - dateNow}ms | ${time}`, "[ DEV ]");
        } catch(e) {
            console.error(e);
            return api.sendMessage(`${HEADER.DEVELOPER}\n\n❌ خطأ: ${commandName}\n${e.message}`, threadID);
        }
    };
};
