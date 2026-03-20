module.exports.config = {
    name: "قبول",
    version: "2.0.0",
    hasPermssion: 2,
    credits: "أيمن",
    description: "إدارة طلبات الصداقة — قبول أو رفض",
    commandCategory: "developer",
    usages: "قبول — ثم رد بـ: add [رقم/all] أو del [رقم/all]",
    cooldowns: 0
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const H = "⌬ ━━ 𝗞𝗘𝗡𝗢 DEV ━━ ⌬";
    const B = "⌬ ━━━━━━━━━━━━ ⌬";
    const ADMIN = global.config.ADMINBOT || [];

    if (!ADMIN.includes(senderID))
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n🚫 هذا الأمر للمطور فقط!\n\n${B}`,
            threadID, messageID
        );

    // ── جلب طلبات الصداقة ──────────────────────────────
    const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
    };

    try {
        const raw  = await api.httpPost("https://www.facebook.com/api/graphql/", form);
        const data = JSON.parse(raw);
        const list = data?.data?.viewer?.friending_possibilities?.edges || [];

        if (list.length === 0)
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n📭 لا توجد طلبات صداقة معلقة!\n\n${B}`,
                threadID, messageID
            );

        let msg = `${B}\n${H}\n${B}\n\n👥 طلبات الصداقة (${list.length})\n\n`;
        list.forEach((u, i) => {
            const node = u.node;
            msg += `⪼ ${i + 1}. ${node.name}\n   🆔 ${node.id}\n\n`;
        });
        msg += `${B}\n\n`;
        msg += `📌 للرد:\n⪼ add all — قبول الكل\n⪼ add [رقم] — قبول محدد\n⪼ del all — رفض الكل\n⪼ del [رقم] — رفض محدد\n\n${B}`;

        return api.sendMessage(msg, threadID, (err, info) => {
            if (err || !info) return;
            global.client.handleReply.push({
                name: "قبول",
                messageID: info.messageID,
                author: senderID,
                listRequest: list
            });
        }, messageID);

    } catch (e) {
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n❌ فشل جلب الطلبات: ${e.message}\n\n${B}`,
            threadID, messageID
        );
    }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID } = event;
    const H = "⌬ ━━ 𝗞𝗘𝗡𝗢 DEV ━━ ⌬";
    const B = "⌬ ━━━━━━━━━━━━ ⌬";

    if (handleReply.author !== senderID) return;

    const args   = event.body.trim().toLowerCase().split(/\s+/);
    const action = args[0]; // add أو del
    const { listRequest } = handleReply;

    if (action !== "add" && action !== "del")
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n⚠️ اكتب add أو del\n\n${B}`,
            threadID, messageID
        );

    const docID = action === "add" ? "3147613905362928" : "4108254489275063";
    const friendly = action === "add"
        ? "FriendingCometFriendRequestConfirmMutation"
        : "FriendingCometFriendRequestDeleteMutation";

    // تحديد الأهداف
    let targets = [];
    if (args[1] === "all") {
        targets = listRequest;
    } else {
        const nums = args.slice(1).map(n => parseInt(n)).filter(n => !isNaN(n));
        targets = nums.map(n => listRequest[n - 1]).filter(Boolean);
    }

    if (targets.length === 0)
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n⚠️ ما اخترت أحد!\n\n${B}`,
            threadID, messageID
        );

    const success = [];
    const failed  = [];

    for (const u of targets) {
        try {
            const form = {
                av: api.getCurrentUserID(),
                fb_api_req_friendly_name: friendly,
                fb_api_caller_class: "RelayModern",
                doc_id: docID,
                variables: JSON.stringify({
                    input: {
                        source: "friends_tab",
                        actor_id: api.getCurrentUserID(),
                        friend_requester_id: u.node.id,
                        client_mutation_id: Math.round(Math.random() * 19).toString()
                    },
                    scale: 3,
                    refresh_num: 0
                })
            };
            const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
            if (JSON.parse(res).errors) failed.push(u.node.name);
            else success.push(u.node.name);
        } catch { failed.push(u.node.name); }
    }

    const actionText = action === "add" ? "✅ قبول" : "❌ رفض";
    let msg = `${B}\n${H}\n${B}\n\n${actionText} طلبات الصداقة\n\n`;
    if (success.length) msg += `⪼ تم (${success.length}):\n${success.map(n => `   • ${n}`).join("\n")}\n\n`;
    if (failed.length)  msg += `⪼ فشل (${failed.length}):\n${failed.map(n => `   • ${n}`).join("\n")}\n\n`;
    msg += B;

    return api.sendMessage(msg, threadID, messageID);
};