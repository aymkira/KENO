module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const fs = require("fs");
    const path = require("path");
    const stringSimilarity = require("string-similarity");
    const logger = require("../../utils/log.js");
    const moment = require("moment-timezone");

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // ─── زخرفة الرسائل الموحّدة ──────────────────────────────
    const HEADER = {
        UTILITY:   "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬",
        ADMIN:     "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗗𝗠𝗜𝗡 ━━ ⌬",
        DEVELOPER: "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥 ━━ ⌬",
    };

    return async function ({ event }) {
        const dateNow = Date.now();
        const time = moment.tz("Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");

        const { allowInbox, PREFIX, ADMINBOT, DeveloperMode, adminOnly, YASSIN } = global.config;
        const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
        const { commands, cooldowns } = global.client;

        var { body, senderID, threadID, messageID } = event;
        if (!body) return;

        senderID = String(senderID);
        threadID = String(threadID);

        // ─── البادئة ────────────────────────────────────────────
        const threadSetting = threadData.get(threadID) || {};
        const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : PREFIX;
        const botID = api.getCurrentUserID();

        // ✅ إصلاح KENO: prefixRegex يعتمد botID لا senderID
        const prefixRegex = new RegExp(`^(<@!?${botID}>|${escapeRegex(prefix)})\\s*`);
        const [matchedPrefix] = body.match(prefixRegex) || [null];
        if (!matchedPrefix) return;

        const args = body.slice(matchedPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        var command = commands.get(commandName);

        // ─── فلاتر الحظر والأوضاع ───────────────────────────────
        if (threadBanned.has(threadID) && !ADMINBOT.includes(senderID)) return;

        // ─── فحص الحظر — ذاكرة + GitHub JSON كـ fallback ───────
        if (!ADMINBOT.includes(senderID)) {
            let isBanned = userBanned.has(senderID);

            // لو ما لقاه في الذاكرة، نتحقق من data.js مباشرة
            if (!isBanned) {
                try {
                    const dataJS = require(path.join(__dirname, '../../includes/data.js'));
                    const banRecord = await dataJS.getBan(senderID);
                    if (banRecord && banRecord.banned) {
                        // تحقق إن الحظر ما انتهى وقته
                        if (!banRecord.expiresAt || new Date(banRecord.expiresAt) > new Date()) {
                            isBanned = true;
                            // نضيفه للذاكرة عشان المرة الجاية تكون أسرع
                            global.data.userBanned.set(senderID, {
                                reason: banRecord.reason || '',
                                dateAdded: banRecord.bannedAt || '',
                                expiresAt: banRecord.expiresAt || null
                            });
                        }
                    }
                } catch(_) {}
            }

            if (isBanned) {
                try { api.setMessageReaction('🚫', messageID, () => {}, true); } catch(_) {}
                return;
            }
        }
        if (YASSIN === "true" && !ADMINBOT.includes(senderID)) return;
        if (adminOnly && !ADMINBOT.includes(senderID)) return;

        // ─── restrictList (مجموعات مقيّدة للأدمن فقط) — من KENO ─
        try {
            const restrictPath = path.join(__dirname, "../../script/commands/cache/addGroup.json");
            const restrictList = JSON.parse(fs.readFileSync(restrictPath, "utf8"));
            if (restrictList.includes(threadID)) {
                const threadInfoo = threadInfo.get(threadID) || (await Threads.getInfo(threadID));
                const isAdmin = threadInfoo.adminIDs.some(ad => ad.id == senderID);
                if (!isAdmin && !ADMINBOT.includes(senderID)) return;
            }
        } catch (_) { /* الملف غير موجود = لا قيود */ }

        // ─── البحث عن أقرب أمر ──────────────────────────────────
        if (!command) {
            const allCommandNames = Array.from(commands.keys());
            const checker = stringSimilarity.findBestMatch(commandName, allCommandNames);

            if (checker.bestMatch.rating >= 0.8) {
                command = commands.get(checker.bestMatch.target);
            } else if (matchedPrefix) {
                const closest = checker.bestMatch.target;
                const suggestions = [
                    `${HEADER.UTILITY}\n\n❌ خطأ: "${commandName}" غير مسجل\n💡 هل تقصد: '${closest}'؟`,
                    `${HEADER.UTILITY}\n\n⚠️ الأمر غير موجود\n🔍 جرب: '${closest}'`,
                    `${HEADER.UTILITY}\n\n🚫 أمر خاطئ\n✨ ربما تقصد: '${closest}'`,
                    `${HEADER.UTILITY}\n\n😅 \"${commandName}\" مش موجود\n💬 قصدك '${closest}'؟`,
                ];
                return api.sendMessage(
                    suggestions[Math.floor(Math.random() * suggestions.length)],
                    threadID,
                    messageID
                );
            }
        }

        if (!command) return;

        // ─── أوامر محظورة على مجموعة أو مستخدم ─────────────────
        if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
            if (!ADMINBOT.includes(senderID)) {
                const banThreads = commandBanned.get(threadID) || [];
                const banUsers   = commandBanned.get(senderID) || [];
                if (banThreads.includes(command.config.name)) {
                    return api.sendMessage(
                        `${HEADER.ADMIN}\n\n🚫 الأمر محظور في هذه المجموعة\nالأمر: ${command.config.name}`,
                        threadID, messageID
                    );
                }
                if (banUsers.includes(command.config.name)) {
                    return api.sendMessage(
                        `${HEADER.ADMIN}\n\n⛔ أنت محظور من استخدام هذا الأمر`,
                        threadID, messageID
                    );
                }
            }
        }

        // ─── NSFW ────────────────────────────────────────────────
        if (
            command.config.commandCategory?.toLowerCase() === "nsfw" &&
            !global.data.threadAllowNSFW.includes(threadID) &&
            !ADMINBOT.includes(senderID)
        ) {
            return api.sendMessage(
                `${HEADER.UTILITY}\n\n🔞 محتوى محظور في هذه المجموعة`,
                threadID, messageID
            );
        }

        // ─── الصلاحيات ──────────────────────────────────────────
        let permssion = 0;
        const threadInfoo2 = threadInfo.get(threadID) || (await Threads.getInfo(threadID));
        const isGroupAdmin = threadInfoo2.adminIDs?.find(el => el.id == senderID);
        if (ADMINBOT.includes(senderID.toString())) permssion = 2;
        else if (isGroupAdmin) permssion = 1;

        if (command.config.hasPermssion > permssion) {
            return api.sendMessage(
                `${HEADER.ADMIN}\n\n⚠️ ليس لديك صلاحية لتنفيذ هذا الأمر\nالأمر: ${command.config.name}`,
                event.threadID, event.messageID
            );
        }

        // ─── Cooldown ────────────────────────────────────────────
        if (!global.client.cooldowns.has(command.config.name)) {
            global.client.cooldowns.set(command.config.name, new Map());
        }
        const timestamps = global.client.cooldowns.get(command.config.name);
        const expirationTime = (command.config.cooldowns || 1) * 1000;
        if (timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime) {
            return api.setMessageReaction("⏳", event.messageID, () => {}, true);
        }

        // ─── إعداد getText ───────────────────────────────────────
        let getText2 = () => {};
        if (command.languages && typeof command.languages === "object" &&
            command.languages.hasOwnProperty(global.config.language)) {
            getText2 = (...values) => {
                let lang = command.languages[global.config.language][values[0]] || "";
                for (let i = values.length - 1; i > 0; i--) {
                    lang = lang.replace(new RegExp(`%${i}`, "g"), values[i]);
                }
                return lang;
            };
        }

        // ─── تنفيذ الأمر ─────────────────────────────────────────
        try {
            const Obj = { api, event, args, models, Users, Threads, Currencies, permssion, getText: getText2 };
            // ✅ await لمعالجة أخطاء async بشكل صحيح
            await command.run(Obj);
            timestamps.set(senderID, dateNow);

            if (DeveloperMode) {
                logger(
                    `✅ أمر: ${commandName} | المستخدم: ${senderID} | المجموعة: ${threadID} | الوقت: ${Date.now() - dateNow}ms | ${time}`,
                    "[ DEV MODE ]"
                );
            }
            return;
        } catch (e) {
            console.error(e);
            return api.sendMessage(
                `${HEADER.DEVELOPER}\n\n❌ خطأ في الأمر: ${commandName}\n\n${e.message}`,
                threadID
            );
        }
    };
};
