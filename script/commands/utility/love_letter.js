const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "رسالة_حب",
    aliases: ["love_letter", "رسالة_رومانسية", "كلام_حلو"],
    description: "كتابة رسائل رومانسية وكلمات جميلة",
    usage: "رسالة_حب [المناسبة أو الموضوع]",
    cooldown: 5,
    permissions: [],
    category: "fun"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        const occasion = args.join(" ") || "رسالة حب عامة";

        const waitMsg = await api.sendMessage(
            `💌 جاري كتابة رسالة رومانسية...\n❤️ بكل مشاعر صادقة...`,
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "أنت كاتب رومانسي محترف. تكتب رسائل حب صادقة وجميلة بلغة عربية راقية. استخدم كلمات جميلة ومعبرة دون مبالغة."
                },
                {
                    role: "user",
                    content: `اكتب رسالة حب جميلة ومعبرة عن: ${occasion}\n\nاجعل الرسالة:\n- صادقة ومؤثرة\n- بلغة عربية راقية\n- بطول مناسب (200-300 كلمة)\n- تحتوي على مشاعر حقيقية\n- مناسبة للمناسبة المذكورة\n\nلا تذكر أي أسماء، اجعلها عامة.`
                }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature: 0.9,
            max_completion_tokens: 1024,
            top_p: 0.95,
            stream: false
        });

        const letter = chatCompletion.choices[0]?.message?.content || "عذراً، لم أتمكن من كتابة الرسالة.";

        api.unsendMessage(waitMsg.messageID);

        return api.sendMessage(
            `💌 رسالة رومانسية\n\n` +
            `${letter}\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `❤️ كُتبت بكل مشاعر صادقة\n` +
            `💝 المناسبة: ${occasion}\n\n` +
            `✨ يمكنك تعديلها وإضافة لمستك الخاصة!`,
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error("❌ خطأ في رسالة_حب:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
