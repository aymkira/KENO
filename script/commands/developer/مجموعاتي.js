module.exports.config = {
    name: "مجموعاتي",
    version: "2.0.0",
    hasPermssion: 2,
    credits: "أيمن",
    description: "إدارة مجموعات البوت",
    commandCategory: "developer",
    usages: "مجموعاتي [عرض / مغادرة رقم / قبول]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const H = "⌬ ━━ 𝗞𝗘𝗡𝗢 DEV ━━ ⌬";
    const B = "⌬ ━━━━━━━━━━━━ ⌬";
    const ADMIN = global.config.ADMINBOT || [];

    if (!ADMIN.includes(senderID))
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n🚫 هذا الأمر للمطور فقط!\n\n${B}`,
            threadID, messageID
        );

    const action = args[0];

    // ── قائمة مساعدة ───────────────────────────────────
    if (!action)
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n📋 إدارة مجموعات البوت\n\n⪼ مجموعاتي عرض\n⪼ مجموعاتي مغادرة [رقم]\n⪼ مجموعاتي قبول\n\n${B}`,
            threadID, messageID
        );

    // ── عرض المجموعات ──────────────────────────────────
    if (action === "عرض" || action === "list") {
        const wait = await api.sendMessage(`${B}\n${H}\n${B}\n\n⏳ جاري جلب المجموعات...\n\n${B}`, threadID);

        try {
            let allThreads = [];
            try { allThreads = await api.getThreadList(100, null, ["INBOX"]); } catch (_) {}

            const groups = (allThreads || []).filter(t => t?.isGroup === true || t?.threadType === 2);
            groups.sort((a, b) => (b.participantIDs?.length || 0) - (a.participantIDs?.length || 0));

            api.unsendMessage(wait.messageID);

            if (groups.length === 0)
                return api.sendMessage(
                    `${B}\n${H}\n${B}\n\n📭 البوت مو في أي مجموعة!\n\n${B}`,
                    threadID, messageID
                );

            // حفظ للاستخدام في مغادرة
            if (!global._groupsData) global._groupsData = {};
            global._groupsData[senderID] = groups;

            const limit = Math.min(10, groups.length);
            let list = "";
            for (let i = 0; i < limit; i++) {
                const g = groups[i];
                const name    = g.name || g.threadName || "بدون اسم";
                const members = g.participantIDs?.length || 0;
                list += `⪼ ${i + 1}. ${name}\n   👥 ${members} عضو\n   🆔 ${g.threadID}\n\n`;
            }
            if (groups.length > 10) list += `⪼ ... و ${groups.length - 10} مجموعة أخرى\n`;

            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n📋 المجموعات (${groups.length})\n\n${list}⌬ مجموعاتي مغادرة [رقم] ⌬\n\n${B}`,
                threadID, messageID
            );
        } catch (e) {
            api.unsendMessage(wait.messageID);
            return api.sendMessage(`${B}\n${H}\n${B}\n\n❌ خطأ: ${e.message}\n\n${B}`, threadID, messageID);
        }
    }

    // ── مغادرة مجموعة ──────────────────────────────────
    if (action === "مغادرة" || action === "leave") {
        const num = parseInt(args[1]);
        if (!num || num < 1)
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n⚠️ اكتب رقم المجموعة!\n⪼ مثال: مجموعاتي مغادرة 2\n\n${B}`,
                threadID, messageID
            );

        const groups = global._groupsData?.[senderID] || [];
        if (num > groups.length)
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n❌ الرقم خاطئ! اختر بين 1 و ${groups.length}\n\n${B}`,
                threadID, messageID
            );

        const g      = groups[num - 1];
        const gName  = g.name || g.threadName || "بدون اسم";
        const gCount = g.participantIDs?.length || 0;

        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n⚠️ تأكيد المغادرة؟\n\n⪼ ${gName}\n⪼ 👥 ${gCount} عضو\n⪼ 🆔 ${g.threadID}\n\n⌬ رد بـ "نعم" أو "لا" ⌬\n\n${B}`,
            threadID,
            (err, info) => {
                if (err || !info) return;
                global.client.handleReply.push({
                    name: "مجموعاتي",
                    messageID: info.messageID,
                    author: senderID,
                    type: "confirm_leave",
                    groupData: g
                });
            },
            messageID
        );
    }

    // ── قبول الطلبات المعلقة ────────────────────────────
    if (action === "قبول") {
        const wait = await api.sendMessage(`${B}\n${H}\n${B}\n\n⏳ جاري البحث عن الطلبات...\n\n${B}`, threadID);
        try {
            let pending = [];
            try {
                const all = await api.getThreadList(50, null, ["PENDING"]);
                pending = (all || []).filter(t => t?.isGroup === true || t?.threadType === 2);
            } catch (_) {}

            api.unsendMessage(wait.messageID);

            if (pending.length === 0)
                return api.sendMessage(`${B}\n${H}\n${B}\n\n📭 لا توجد طلبات معلقة!\n\n${B}`, threadID, messageID);

            const list = pending.slice(0, 5).map((t, i) => `⪼ ${i + 1}. ${t.name || "بدون اسم"}\n   🆔 ${t.threadID}`).join("\n\n");
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n📨 طلبات معلقة (${pending.length})\n\n${list}\n\n${B}`,
                threadID, messageID
            );
        } catch (e) {
            api.unsendMessage(wait.messageID);
            return api.sendMessage(`${B}\n${H}\n${B}\n\n❌ خطأ: ${e.message}\n\n${B}`, threadID, messageID);
        }
    }

    return api.sendMessage(
        `${B}\n${H}\n${B}\n\n❌ أمر غير معروف!\n⪼ عرض / مغادرة [رقم] / قبول\n\n${B}`,
        threadID, messageID
    );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    const H = "⌬ ━━ 𝗞𝗘𝗡𝗢 DEV ━━ ⌬";
    const B = "⌬ ━━━━━━━━━━━━ ⌬";

    if (handleReply.author !== senderID) return;
    if (handleReply.type !== "confirm_leave") return;

    const choice = body.trim().toLowerCase();

    if (choice === "لا" || choice === "no")
        return api.sendMessage(`${B}\n${H}\n${B}\n\n❌ تم الإلغاء\n\n${B}`, threadID, messageID);

    if (choice !== "نعم" && choice !== "yes")
        return api.sendMessage(`${B}\n${H}\n${B}\n\n⚠️ رد بـ "نعم" أو "لا"\n\n${B}`, threadID, messageID);

    const g    = handleReply.groupData;
    const wait = await api.sendMessage(`${B}\n${H}\n${B}\n\n⏳ جاري المغادرة...\n\n${B}`, threadID);
    try {
        await api.removeUserFromGroup(api.getCurrentUserID(), g.threadID);
        api.unsendMessage(wait.messageID);
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n✅ تم المغادرة بنجاح!\n\n⪼ ${g.name || g.threadName || "المجموعة"}\n\n${B}`,
            threadID, messageID
        );
    } catch (e) {
        api.unsendMessage(wait.messageID);
        return api.sendMessage(`${B}\n${H}\n${B}\n\n❌ فشلت المغادرة: ${e.message}\n\n${B}`, threadID, messageID);
    }
};