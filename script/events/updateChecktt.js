const fs   = require("fs");
const path = require("path");

module.exports.config = {
    name: "updateChecktt",
    eventType: ["log:unsubscribe"],
    version: "2.0.0",
    credits: "KIRA",
    description: "يحذف بيانات تفاعل العضو تلقائياً عند مغادرته المجموعة"
};

const dataPath = path.resolve(__dirname, "../commands/cache/checktt.json");

module.exports.run = async function ({ event, api }) {
    // تجاهل إذا البوت هو اللي غادر
    if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

    try {
        if (!fs.existsSync(dataPath)) return;

        const allData  = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        const thread   = allData.find(i => i.threadID == event.threadID);
        if (!thread) return;

        const idx = thread.data.findIndex(
            item => item.id == event.logMessageData.leftParticipantFbId
        );
        if (idx === -1) return;

        thread.data.splice(idx, 1);
        fs.writeFileSync(dataPath, JSON.stringify(allData, null, 2), "utf-8");
    } catch (e) {
        console.error("❌ خطأ في updateChecktt:", e.message);
    }
};
