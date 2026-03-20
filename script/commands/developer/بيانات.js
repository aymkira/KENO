module.exports.config = {
    name: "بيانات",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "أيمن",
    description: "تفعيل البيانات — يحذف الرسالة تلقائياً",
    commandCategory: "developer",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    // احذف رسالة المستخدم فوراً
    try { await api.unsendMessage(messageID); } catch (_) {}

    // أرسل تأكيد خاص للأدمن فقط
    const H = "⌬ ━━━━━━━━━━━━ ⌬";
    const msg = `${H}\n⌬ ━━ 🔐 البيانات ━━ ⌬\n${H}\n\n✅ تم استلام البيانات وحذف رسالتك\n⪼ البوت جاهز للعمل`;

    const info = await api.sendMessage(msg, threadID);

    // احذف رد البوت بعد 5 ثواني
    setTimeout(() => {
        try { api.unsendMessage(info.messageID); } catch (_) {}
    }, 5000);
};
