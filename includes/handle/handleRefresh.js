

module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");

    return async function ({ event }) {
        const { threadID, logMessageType, logMessageData } = event;
        const { setData, getData, delData } = Threads;

        try {
            let dataThread = (await getData(threadID)).threadInfo;

            switch (logMessageType) {

                // ─── تغيير المشرفين ──────────────────────────────
                case "log:thread-admins": {
                    if (logMessageData.ADMIN_EVENT === "add_admin") {
                        dataThread.adminIDs.push({ id: logMessageData.TARGET_ID });
                    } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                        dataThread.adminIDs = dataThread.adminIDs.filter(
                            item => item.id != logMessageData.TARGET_ID
                        );
                    }
                    logger(`✅ تحديث المشرفين | المجموعة: ${threadID}`, "UPDATE DATA");
                    await setData(threadID, { threadInfo: dataThread });
                    break;
                }

                // ─── تغيير اسم المجموعة ──────────────────────────
                case "log:thread-name": {
                    dataThread.threadName = logMessageData.name;
                    logger(`✅ تحديث اسم المجموعة: ${logMessageData.name}`, "UPDATE DATA");
                    await setData(threadID, { threadInfo: dataThread });
                    break;
                }

                // ─── انضمام أعضاء / البوت ────────────────────────
                case "log:subscribe": {
                    const botAdded = logMessageData.addedParticipants?.some(
                        i => i.userFbId == api.getCurrentUserID()
                    );
                    if (botAdded) {
                        logger(`✅ تم إضافة البوت لمجموعة جديدة: ${threadID}`, "UPDATE DATA");
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    break;
                }

                // ─── مغادرة عضو / البوت ──────────────────────────
                case "log:unsubscribe": {
                    if (logMessageData.leftParticipantFbId == api.getCurrentUserID()) {
                        // البوت غادر المجموعة → احذف بياناتها
                        logger(`🗑️ البوت غادر — حذف بيانات المجموعة: ${threadID}`, "DELETE DATA");
                        const idx = global.data.allThreadID.findIndex(i => i == threadID);
                        if (idx !== -1) global.data.allThreadID.splice(idx, 1);
                        await delData(threadID);
                    } else {
                        // عضو عادي غادر → حدّث القوائم
                        const leftID = logMessageData.leftParticipantFbId;
                        const pIdx = dataThread.participantIDs?.findIndex(i => i == leftID);
                        if (pIdx !== -1) dataThread.participantIDs?.splice(pIdx, 1);
                        dataThread.adminIDs = dataThread.adminIDs?.filter(i => i.id != leftID);
                        logger(`🗑️ مغادرة: ${leftID}`, "DELETE DATA");
                        await setData(threadID, { threadInfo: dataThread });
                    }
                    break;
                }
            }
        } catch (e) {
            logger(`❌ خطأ في handleRefresh: ${e.message}`, "error");
        }

        return;
    };
};
