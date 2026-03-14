const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "راب",
    aliases: ["rap", "اغنية_راب", "كلمات_راب"],
    description: "كتابة كلمات أغاني راب عربية باحترافية",
    usage: "راب [الموضوع]",
    cooldown: 5,
    permissions: [],
    category: "fun"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        if (!args[0]) {
            return api.sendMessage(
                "🎤 مولد كلمات الراب\n\n" +
                "📝 الاستخدام:\n" +
                "راب [الموضوع]\n\n" +
                "💡 أمثلة:\n" +
                "• راب النجاح والطموح\n" +
                "• راب الصداقة\n" +
                "• راب الوطن\n" +
                "• راب التحدي والقوة\n" +
                "• راب الأحلام",
                event.threadID,
                event.messageID
            );
        }

        const topic = args.join(" ");

        const waitMsg = await api.sendMessage(
            `🎤 جاري كتابة أغنية راب...\n🎵 الموضوع: ${topic}\n✍️ بكلمات قوية ومعبرة...`,
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "أنت كاتب أغاني راب محترف. تكتب كلمات قوية ومعبرة بإيقاع متناسق وقافية متناغمة. تستخدم لغة عربية معاصرة مع الحفاظ على الفصاحة."
                },
                {
                    role: "user",
                    content: `اكتب أغنية راب عربية عن: ${topic}\n\nالمطلوب:\n\n🎵 المقدمة (Hook):\n[4-6 أسطر متكررة وجذابة]\n\n🎤 المقطع الأول:\n[8-12 سطر بقافية متناسقة]\n\n🎵 الكورس:\n[تكرار المقدمة أو نسخة معدلة]\n\n🎤 المقطع الثاني:\n[8-12 سطر بقافية مختلفة]\n\n🎵 الخاتمة:\n[4 أسطر قوية للنهاية]\n\nاستخدم:\n- قافية واضحة\n- إيقاع منتظم\n- كلمات قوية ومعبرة\n- صور شعرية جميلة\n- رسالة واضحة ومحفزة`
                }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature: 0.9,
            max_completion_tokens: 1536,
            top_p: 0.95,
            stream: false
        });

        const rapLyrics = chatCompletion.choices[0]?.message?.content || "عذراً، لم أتمكن من كتابة الأغنية.";

        api.unsendMessage(waitMsg.messageID);

        return api.sendMessage(
            `🎤 أغنية راب: ${topic}\n${'━'.repeat(30)}\n\n` +
            `${rapLyrics}\n\n` +
            `${'━'.repeat(30)}\n` +
            `🎵 الموضوع: ${topic}\n` +
            `🎤 جاهز للأداء!\n` +
            `💯 شارك إبداعك مع العالم!`,
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error("❌ خطأ في راب:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
