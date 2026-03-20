module.exports = function ({ Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    const chalk  = require("chalk");
    const moment = require("moment-timezone");
    const path   = require("path");

    const _log = (type, detail) => {
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

    // كاش المجموعات — يمنع getInfo المتكرر
    const recentThreads = new Map();
    const THREAD_CACHE  = 5 * 60 * 1000;

    // جلب data.js مرة واحدة
    let _db = null;
    function getDB() {
        if (!_db) _db = require(path.join(process.cwd(), "includes", "data.js"));
        return _db;
    }

    return async function ({ event }) {
        const { allUserID, allThreadID, userName, threadInfo } = global.data;
        const { autoCreateDB } = global.config;
        if (!autoCreateDB) return;

        const db       = getDB();
        const senderID = String(event.senderID);
        const threadID = String(event.threadID);

        try {
            // ── مجموعة جديدة أو منتهية الكاش ─────────────────────
            const isGroup = event.isGroup || senderID !== threadID;
            const isNew   = !allThreadID.includes(threadID);
            const isStale = (Date.now() - (recentThreads.get(threadID) || 0)) > THREAD_CACHE;

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

                    // حدّث threadInfo في الذاكرة دائماً
                    threadInfo.set(threadID, dataThread);

                    if (isNew) {
                        allThreadID.push(threadID);
                        // حفظ في data.js — يُجدول تلقائياً بدون GitHub call فوري
                        await db.setThread(threadID, { threadInfo: dataThread });

                        const c1 = randColor(), c2 = randColor(), c3 = randColor();
                        logger(
                            chalk.hex(c1)("مجموعة جديدة: ") +
                            chalk.hex(c2)(threadID) + "  ||  " +
                            chalk.hex(c3)(info.threadName),
                            "[ THREAD ]"
                        );

                        // أعضاء المجموعة الجدد
                        for (const u of (info.userInfo || [])) {
                            const uid = String(u.id);
                            userName.set(uid, u.name);
                            if (!allUserID.includes(uid)) {
                                allUserID.push(uid);
                                try { await db.ensureUser(uid, u.name); } catch(_) {}
                            }
                        }
                    }
                } catch(e) { console.error("[DB] thread error:", e.message); }
            }

            // ── مستخدم جديد ───────────────────────────────────────
            if (!allUserID.includes(senderID) || !userName.has(senderID)) {
                try {
                    const info = await Users.getInfo(senderID);
                    const name = info?.name || senderID;

                    if (!allUserID.includes(senderID)) allUserID.push(senderID);
                    userName.set(senderID, name);

                    // ensureUser يعمل ensureWallet تلقائياً — نقطة واحدة للإنشاء
                    await db.ensureUser(senderID, name);

                    const c1 = randColor(), c2 = randColor(), c3 = randColor();
                    _log("USER NEW", `${name} | ${senderID}`);
                    logger(
                        chalk.hex(c1)("مستخدم جديد: ") +
                        chalk.hex(c2)(name) + "  ||  " +
                        chalk.hex(c3)(senderID),
                        "[ USER ]"
                    );
                } catch(e) {
                    // fallback — سجّل بالـ ID
                    if (!allUserID.includes(senderID)) {
                        allUserID.push(senderID);
                        userName.set(senderID, senderID);
                        try { await db.ensureUser(senderID); } catch(_) {}
                    }
                }
            }

        } catch(err) {
            console.error("❌ handleCreateDatabase:", err.message);
        }
    };
};
