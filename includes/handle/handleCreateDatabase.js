

module.exports = function ({ Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    const chalk  = require("chalk");

    // ─── ألوان عشوائية للـ logging ──────────────────────────
    const COLORS = [
        "FF9900","FFFF33","33FFFF","FF99FF","FF3366","FFFF66","FF00FF",
        "66FF99","00CCFF","FF0099","FF0066","008E97","F58220","38B6FF",
        "7ED957","97FFFF","00BFFF","76EEC6","4EEE94","98F5FF","AFD788",
        "00B2BF","9F79EE","00FA9A"
    ];
    const randColor = () => "#" + COLORS[Math.floor(Math.random() * COLORS.length)];

    return async function ({ event }) {
        const { allUserID, allCurrenciesID, allThreadID, userName, threadInfo } = global.data;
        const { autoCreateDB } = global.config;

        // autoCreateDB == false → لا تنشئ قاعدة بيانات
        if (!autoCreateDB) return;

        var senderID = String(event.senderID);
        var threadID = String(event.threadID);

        try {
            // ════════════════════════════════════════════════════
            // 🏘️ إنشاء بيانات المجموعة
            // ════════════════════════════════════════════════════
            if (!allThreadID.includes(threadID) && (event.isGroup || senderID === threadID)) {
                const threadIn4 = await Threads.getInfo(threadID);
                const c1 = randColor(), c2 = randColor(), c3 = randColor();

                const dataThread = {
                    threadName: threadIn4.threadName,
                    adminIDs:   threadIn4.adminIDs,
                    nicknames:  threadIn4.nicknames,
                };

                allThreadID.push(threadID);
                threadInfo.set(threadID, dataThread);

                await Threads.setData(threadID, { threadInfo: dataThread, data: {} });

                logger(
                    chalk.hex(c1)("مجموعة جديدة: ") +
                    chalk.hex(c2)(threadID) + "  ||  " +
                    chalk.hex(c3)(threadIn4.threadName),
                    "[ THREAD ]"
                );

                // ─── إنشاء بيانات أعضاء المجموعة ───────────────
                for (const singleData of threadIn4.userInfo) {
                    const uid = String(singleData.id);
                    userName.set(uid, singleData.name);

                    try {
                        if (allUserID.includes(uid)) {
                            await Users.setData(uid, { name: singleData.name });
                        } else {
                            await Users.createData(uid, { name: singleData.name, data: {} });
                            allUserID.push(uid);
                            logger(
                                chalk.hex(c1)("مستخدم جديد: ") +
                                chalk.hex(c2)(singleData.name) + "  ||  " +
                                chalk.hex(c3)(uid),
                                "[ USER ]"
                            );
                        }
                    } catch (e) { console.error(e); }
                }
            }

            // ════════════════════════════════════════════════════
            // 👤 إنشاء بيانات المستخدم
            // ════════════════════════════════════════════════════
            if (!allUserID.includes(senderID) || !userName.has(senderID)) {
                const infoUsers = await Users.getInfo(senderID);
                await Users.createData(senderID, { name: infoUsers.name, data: {} });
                allUserID.push(senderID);
                userName.set(senderID, infoUsers.name);

                const c1 = randColor(), c2 = randColor(), c3 = randColor();
                logger(
                    chalk.hex(c1)("مستخدم جديد: ") +
                    chalk.hex(c2)(infoUsers.name) + "  ||  " +
                    chalk.hex(c3)(senderID),
                    "[ USER ]"
                );
            }

            // ════════════════════════════════════════════════════
            // 💰 إنشاء بيانات العملات
            // ════════════════════════════════════════════════════
            if (!allCurrenciesID.includes(senderID)) {
                await Currencies.createData(senderID, { data: {} });
                allCurrenciesID.push(senderID);
            }

            return;
        } catch (err) {
            console.error("❌ خطأ في handleCreateDatabase:", err);
        }
    };
};
