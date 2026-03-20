const path = require("path");

function getDB() {
    try { return require(path.join(process.cwd(), "includes", "data.js")); }
    catch(e) { throw new Error("data.js مو موجود: " + e.message); }
}

module.exports.config = {
    name:            "امر",
    version:         "2.0.0",
    hasPermssion:    1,
    credits:         "أيمن",
    description:     "حظر أو رفع حظر أمر من مجموعتك",
    commandCategory: "admin",
    usages:          "امر حظر [اسم] | امر الغاء [اسم] | امر قائمة",
    cooldowns:       3
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const H = "⌬ ━━ 𝗞𝗘𝗡𝗢 ADMIN ━━ ⌬";
    const B = "⌬ ━━━━━━━━━━━━ ⌬";
    const db = getDB();

    const type = args[0];
    const cmd  = args[1];

    if (!type)
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n📌 إدارة أوامر المجموعة\n\n⪼ امر حظر [اسم الأمر]\n⪼ امر الغاء [اسم الأمر]\n⪼ امر قائمة\n\n${B}`,
            threadID, messageID
        );

    const threadData = await db.getThread(threadID) || {};
    let banned = threadData.bannedCmds || [];

    // ── قائمة ───────────────────────────────────────────────────
    if (type === "قائمة" || type === "list") {
        if (banned.length === 0)
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n📋 لا توجد أوامر محظورة في هذه المجموعة\n\n${B}`,
                threadID, messageID
            );
        const list = banned.map((c, i) => `⪼ ${i + 1}. ${c}`).join("\n");
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n🚫 الأوامر المحظورة:\n\n${list}\n\n${B}`,
            threadID, messageID
        );
    }

    // ── حظر ─────────────────────────────────────────────────────
    if (type === "حظر" || type === "ban") {
        if (!cmd)
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n⚠️ اكتب اسم الأمر!\n⪼ مثال: امر حظر ترجمة\n\n${B}`,
                threadID, messageID
            );
        if (!global.client?.commands?.has(cmd))
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n❌ الأمر "${cmd}" غير موجود!\n\n${B}`,
                threadID, messageID
            );
        if (banned.includes(cmd))
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n⚠️ الأمر "${cmd}" محظور مسبقاً!\n\n${B}`,
                threadID, messageID
            );

        banned.push(cmd);
        await db.setThread(threadID, { bannedCmds: banned });

        // حدّث الذاكرة
        const existing = global.data.commandBanned.get(threadID) || [];
        if (!existing.includes(cmd)) {
            existing.push(cmd);
            global.data.commandBanned.set(threadID, existing);
        }

        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n✅ تم حظر الأمر!\n\n⪼ الأمر: ${cmd}\n⪼ المجموعة: ${threadID}\n\n${B}`,
            threadID, messageID
        );
    }

    // ── إلغاء الحظر ─────────────────────────────────────────────
    if (type === "الغاء" || type === "uban" || type === "unban") {
        if (!cmd)
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n⚠️ اكتب اسم الأمر!\n⪼ مثال: امر الغاء ترجمة\n\n${B}`,
                threadID, messageID
            );
        if (!banned.includes(cmd))
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n⚠️ الأمر "${cmd}" غير محظور!\n\n${B}`,
                threadID, messageID
            );

        banned = banned.filter(c => c !== cmd);
        await db.setThread(threadID, { bannedCmds: banned });

        // حدّث الذاكرة
        const existing = (global.data.commandBanned.get(threadID) || []).filter(c => c !== cmd);
        global.data.commandBanned.set(threadID, existing);

        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n✅ تم رفع الحظر!\n\n⪼ الأمر: ${cmd}\n\n${B}`,
            threadID, messageID
        );
    }

    return api.sendMessage(
        `${B}\n${H}\n${B}\n\n❌ أمر غير معروف!\n\n⪼ حظر / الغاء / قائمة\n\n${B}`,
        threadID, messageID
    );
};
