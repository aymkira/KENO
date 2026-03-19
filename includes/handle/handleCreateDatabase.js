module.exports = function ({ Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    const chalk  = require("chalk");

    const logger  = require("../../utils/log.js");
    const moment   = require("moment-timezone");
    const _dbLog   = (type, detail) => {
        if (!global.config?.DeveloperMode) return;
        const t = moment.tz("Asia/Baghdad").format("HH:mm:ss");
        logger(`[DB] ${type} | ${detail} | ${t}`, "[ DATABASE ]");
    };

    const COLORS = [
        "FF9900","FFFF33","33FFFF","FF99FF","FF3366","FFFF66","FF00FF",
        "66FF99","00CCFF","FF0099","FF0066","008E97","F58220","38B6FF",
        "7ED957","97FFFF","00BFFF","76EEC6","4EEE94","98F5FF","AFD788",
        "00B2BF","9F79EE","00FA9A"
    ];
    const randColor = () => "#" + COLORS[Math.floor(Math.random() * COLORS.length)];

    // كاش يمنع طلبات getInfo المتكررة لنفس الكروب
    const recentThreads = new Map();
    const THREAD_CACHE  = 5 * 60 * 1000; // 5 دقائق

    return async function ({ event }) {
        const { allUserID, allCurrenciesID, allThreadID, userName, threadInfo } = global.data;
        const { autoCreateDB } = global.config;

        if (!autoCreateDB) return;

        const senderID = String(event.senderID);
        const threadID = String(event.threadID);

        try {
            // ── إنشاء بيانات المجموعة ─────────────────────────────
            const isGroup  = event.isGroup || senderID === threadID;
            const isNew    = !allThreadID.includes(threadID);
            const isStale  = (Date.now() - (recentThreads.get(threadID) || 0)) > THREAD_CACHE;

            if (isGroup && (isNew || isStale)) {
                recentThreads.set(threadID, Date.now());
                try {
                    const info = await Threads.getInfo(threadID);
                    const dataThread = {
                        threadName:     info.threadName,
                        adminIDs:       info.adminIDs,
                        nicknames:      info.nicknames,
                        participantIDs: info.participantIDs,
                    };

                    if (isNew) {
                        allThreadID.push(threadID);
                        threadInfo.set(threadID, dataThread);
                        await Threads.setData(threadID, { threadInfo: dataThread, data: {} });
                        const c1 = randColor(), c2 = randColor(), c3 = randColor();
                        logger(
                            chalk.hex(c1)("مجموعة جديدة: ") +
                            chalk.hex(c2)(threadID) + "  ||  " +
                            chalk.hex(c3)(info.threadName),
                            "[ THREAD ]"
                        );

                        // أعضاء المجموعة
                        for (const u of (info.userInfo || [])) {
                            const uid = String(u.id);
                            userName.set(uid, u.name);
                            try {
                                if (allUserID.includes(uid))
                                    await Users.setData(uid, { name: u.name });
                                else {
                                    await Users.createData(uid, { name: u.name, data: {} });
                                    allUserID.push(uid);
                                }
                            } catch(_) {}
                        }
                    }
                } catch(e) { console.error("[DB] thread:", e.message); }
            }

            // ── إنشاء بيانات المستخدم ─────────────────────────────
            if (!allUserID.includes(senderID) || !userName.has(senderID)) {
                try {
                    const info = await Users.getInfo(senderID);
                    const name = info?.name || senderID;
                    if (allUserID.includes(senderID))
                        await Users.setData(senderID, { name });
                    else {
                        await Users.createData(senderID, { name, data: {} });
                        allUserID.push(senderID);
                    }
                    userName.set(senderID, name);
                    const c1 = randColor(), c2 = randColor(), c3 = randColor();
                    _dbLog("USER NEW", `${name} | ${senderID}`);
                    logger(
                        chalk.hex(c1)("مستخدم جديد: ") +
                        chalk.hex(c2)(name) + "  ||  " +
                        chalk.hex(c3)(senderID),
                        "[ USER ]"
                    );
                } catch(e) {
                    if (!allUserID.includes(senderID)) {
                        try {
                            await Users.createData(senderID, { name: senderID, data: {} });
                            allUserID.push(senderID);
                            userName.set(senderID, senderID);
                        } catch(_) {}
                    }
                }
            }

            // ── إنشاء بيانات العملات ──────────────────────────────
            if (!allCurrenciesID.includes(senderID)) {
                try {
                    await Currencies.createData(senderID, { data: {} });
                    allCurrenciesID.push(senderID);
                } catch(_) {}
            }

        } catch(err) {
            console.error("❌ handleCreateDatabase:", err.message);
        }
    };
};
