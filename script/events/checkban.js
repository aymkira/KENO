

const fs   = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "checkban",
    eventType: ["log:subscribe"],
    version: "2.0.0",
    credits: "KIRA",
    description: "يطرد المحظورين والمحذّرين تلقائياً عند محاولة الانضمام"
};

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗕𝗔𝗡 ━━ ⌬";

const banPath  = path.join(__dirname, "../commands/cache/bans.json");
const warnPath = path.join(__dirname, "../commands/cache/datawarn.json");

module.exports.run = async function ({ api, event }) {
    const { threadID } = event;
    const members = (await api.getThreadInfo(threadID)).participantIDs;

    // ─── جلب قوائم الحظر والتحذير ───────────────────────
    let bannedList = [], warnedList = [];

    try {
        const banData = JSON.parse(fs.readFileSync(banPath, "utf-8"));
        bannedList = banData.banned?.[threadID] || [];
    } catch (_) {}

    try {
        const warnData = JSON.parse(fs.readFileSync(warnPath, "utf-8"));
        warnedList = warnData.banned?.[threadID] || [];
    } catch (_) {}

    // ─── دمج القائمتين بدون تكرار ────────────────────────
    const blockedIDs = [...new Set([
        ...bannedList.map(String),
        ...warnedList.map(String)
    ])];

    if (blockedIDs.length === 0) return;

    for (const memberID of members) {
        if (!blockedIDs.includes(String(memberID))) continue;

        const isBanned  = bannedList.map(String).includes(String(memberID));
        const isWarned  = warnedList.map(String).includes(String(memberID));
        const reason    = isBanned ? "محظور" : "تجاوز حد التحذيرات";

        api.removeUserFromGroup(memberID, threadID, (err) => {
            if (err) return;
            api.sendMessage(
                `${HEADER}\n\n🚫 تم طرد عضو محظور\n` +
                `🆔 ID: ${memberID}\n` +
                `📋 السبب: ${reason}\n` +
                `💬 لرفع الحظر تواصل مع الأدمن`,
                threadID
            );
        });
    }
};
