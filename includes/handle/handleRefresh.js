module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    const path   = require("path");

    let _db = null;
    const getDB = () => {
        if (!_db) _db = require(path.join(process.cwd(), "includes", "data.js"));
        return _db;
    };

    return async function ({ event }) {
        const { threadID, logMessageType, logMessageData } = event;

        try {
            // جلب threadInfo من الذاكرة أولاً — أسرع
            let dataThread = global.data.threadInfo.get(String(threadID)) || {};

            switch (logMessageType) {

                // ── تغيير المشرفين ────────────────────────────────
                case "log:thread-admins": {
                    if (!dataThread.adminIDs) dataThread.adminIDs = [];
                    if (logMessageData.ADMIN_EVENT === "add_admin") {
                        if (!dataThread.adminIDs.find(a => a.id == logMessageData.TARGET_ID))
                            dataThread.adminIDs.push({ id: logMessageData.TARGET_ID });
                    } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                        dataThread.adminIDs = dataThread.adminIDs.filter(
                            item => item.id != logMessageData.TARGET_ID
                        );
                    }
                    global.data.threadInfo.set(String(threadID), dataThread);
                    logger(`✅ تحديث المشرفين | ${threadID}`, "UPDATE DATA");
                    await getDB().setThread(threadID, { threadInfo: dataThread });
                    break;
                }

                // ── تغيير اسم المجموعة ────────────────────────────
                case "log:thread-name": {
                    dataThread.threadName = logMessageData.name;
                    global.data.threadInfo.set(String(threadID), dataThread);
                    logger(`✅ تحديث اسم المجموعة: ${logMessageData.name}`, "UPDATE DATA");
                    await getDB().setThread(threadID, { threadInfo: dataThread });
                    break;
                }

                // ── انضمام عضو / البوت ───────────────────────────
                case "log:subscribe": {
                    const botAdded = logMessageData.addedParticipants?.some(
                        i => i.userFbId == api.getCurrentUserID()
                    );
                    if (botAdded) {
                        logger(`✅ البوت أُضيف لمجموعة: ${threadID}`, "UPDATE DATA");
                    }
                    // أضف الأعضاء الجدد للقوائم
                    for (const p of (logMessageData.addedParticipants || [])) {
                        const uid = String(p.userFbId);
                        if (dataThread.participantIDs && !dataThread.participantIDs.includes(uid))
                            dataThread.participantIDs.push(uid);
                    }
                    global.data.threadInfo.set(String(threadID), dataThread);
                    await getDB().setThread(threadID, { threadInfo: dataThread });
                    break;
                }

                // ── مغادرة عضو / البوت ───────────────────────────
                case "log:unsubscribe": {
                    const leftID = String(logMessageData.leftParticipantFbId);

                    if (leftID == api.getCurrentUserID()) {
                        // البوت غادر → احذف بيانات المجموعة من الذاكرة
                        logger(`🗑️ البوت غادر: ${threadID}`, "DELETE DATA");
                        const idx = global.data.allThreadID.findIndex(i => i == threadID);
                        if (idx !== -1) global.data.allThreadID.splice(idx, 1);
                        global.data.threadInfo.delete(String(threadID));
                        global.data.threadData.delete(String(threadID));
                        global.data.threadBanned.delete(String(threadID));
                        // لا نحذف من GitHub — نحتفظ بالسجل
                    } else {
                        // عضو عادي غادر
                        const pIdx = dataThread.participantIDs?.indexOf(leftID);
                        if (pIdx !== undefined && pIdx !== -1)
                            dataThread.participantIDs?.splice(pIdx, 1);
                        dataThread.adminIDs = dataThread.adminIDs?.filter(i => i.id != leftID);
                        global.data.threadInfo.set(String(threadID), dataThread);
                        logger(`🗑️ مغادرة: ${leftID}`, "DELETE DATA");
                        await getDB().setThread(threadID, { threadInfo: dataThread });
                    }
                    break;
                }

                // ── تغيير اسم المستخدم ───────────────────────────
                case "log:user-nickname": {
                    const targetID = String(logMessageData.participant_id);
                    const newName  = logMessageData.nickname || '';
                    if (dataThread.nicknames) dataThread.nicknames[targetID] = newName;
                    global.data.threadInfo.set(String(threadID), dataThread);
                    await getDB().setThread(threadID, { threadInfo: dataThread });
                    break;
                }
            }
        } catch (e) {
            logger(`❌ خطأ في handleRefresh: ${e.message}`, "error");
        }
    };
};
