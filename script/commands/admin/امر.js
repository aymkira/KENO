const { getThread, setThread } = require("../../includes/data");

module.exports.config = {
    name: "امر",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "أيمن",
    description: "حظر أو رفع حظر أمر من مجموعتك",
    commandCategory: "admin",
    usages: "امر حظر [اسم] | امر الغاء [اسم] | امر قائمة",
    cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const H = "⌬ ━━ 𝗞𝗘𝗡𝗢 ADMIN ━━ ⌬";
    const B = "⌬ ━━━━━━━━━━━━ ⌬";

    const type = args[0];
    const cmd  = args[1];

    if (!type)
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n📌 إدارة أوامر المجموعة\n\n⪼ امر حظر [اسم الأمر]\n⪼ امر الغاء [اسم الأمر]\n⪼ امر قائمة\n\n${B}`,
            threadID, messageID
        );

    // ── جلب بيانات المجموعة ────────────────────────────
    const threadData = await getThread(threadID) || {};
    let banned = threadData.bannedCmds || [];

    // ── قائمة ──────────────────────────────────────────
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

    // ── حظر ────────────────────────────────────────────
    if (type === "حظر" || type === "ban") {
        if (!cmd)
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n⚠️ اكتب اسم الأمر!\n⪼ مثال: امر حظر ترجمه\n\n${B}`,
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
        await setThread(threadID, { bannedCmds: banned });

        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n✅ تم حظر الأمر!\n\n⪼ الأمر: ${cmd}\n⪼ المجموعة: ${threadID}\n\n${B}`,
            threadID, messageID
        );
    }

    // ── إلغاء الحظر ────────────────────────────────────
    if (type === "الغاء" || type === "uban" || type === "unban") {
        if (!cmd)
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n⚠️ اكتب اسم الأمر!\n⪼ مثال: امر الغاء ترجمه\n\n${B}`,
                threadID, messageID
            );

        if (!banned.includes(cmd))
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n⚠️ الأمر "${cmd}" غير محظور!\n\n${B}`,
                threadID, messageID
            );

        banned = banned.filter(c => c !== cmd);
        await setThread(threadID, { bannedCmds: banned });

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