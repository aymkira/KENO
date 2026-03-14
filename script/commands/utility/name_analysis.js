const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "تحليل_اسم",
    aliases: ["analyze_name", "شخصية_اسم", "معنى_اسمي"],
    description: "تحليل شخصية الشخص من خلال اسمه (للترفيه)",
    usage: "تحليل_اسم [الاسم]",
    cooldown: 5,
    permissions: [],
    category: "fun"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        if (!args[0]) {
            return api.sendMessage(
                "⚠️ الرجاء كتابة الاسم!\n\n" +
                "📝 مثال: تحليل_اسم أحمد\n" +
                "💡 يمكنك كتابة الاسم الأول أو الكامل",
                event.threadID,
                event.messageID
            );
        }

        const name = args.join(" ");

        const waitMsg = await api.sendMessage(
            `🔮 جاري تحليل شخصية "${name}"...\n✨ قراءة الطاقات...`,
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "أنت خبير في علم الأسماء وتأثيرها على الشخصية. تقدم تحليل ممتع وإيجابي بطريقة احترافية. اجعل التحليل محفز وجميل."
                },
                {
                    role: "user",
                    content: `حلل شخصية صاحب اسم "${name}" بشكل ممتع وإيجابي.\n\nاكتب:\n1. معنى الاسم\n2. صفات الشخصية المتوقعة\n3. نقاط القوة\n4. المهارات المحتملة\n5. نصيحة شخصية\n6. رقم الحظ\n7. اللون المناسب\n\nاجعله ممتعاً وإيجابياً!`
                }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature: 0.85,
            max_completion_tokens: 1024,
            top_p: 0.9,
            stream: false
        });

        const analysis = chatCompletion.choices[0]?.message?.content || "عذراً، لم أتمكن من التحليل.";

        api.unsendMessage(waitMsg.messageID);

        return api.sendMessage(
            `🔮 تحليل شخصية: ${name}\n\n` +
            `${analysis}\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `⚠️ هذا التحليل للمتعة فقط ولا يعتمد على علم حقيقي\n` +
            `✨ كل شخص فريد ومميز بطريقته الخاصة!`,
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error("❌ خطأ في تحليل_اسم:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
