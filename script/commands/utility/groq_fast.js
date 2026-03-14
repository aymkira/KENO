const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "جروك_سريع",
    aliases: ["groq_fast", "جي_سريع", "سؤال_سريع"],
    description: "محادثة سريعة مع Groq AI مع عرض الرد بشكل تدريجي",
    usage: "جروك_سريع [رسالتك]",
    cooldown: 3,
    permissions: [],
    category: "ai"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        if (!args[0]) {
            return api.sendMessage(
                "⚠️ الرجاء كتابة رسالتك!\n\n" +
                "📝 مثال: جروك_سريع ما هي فوائد البرمجة؟",
                event.threadID,
                event.messageID
            );
        }

        const userMessage = args.join(" ");
        
        const waitMsg = await api.sendMessage(
            "⚡ جاري الرد السريع...",
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        // استخدام streaming للرد السريع
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "أنت مساعد سريع ومباشر. أجب بإيجاز ووضوح بالعربية."
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature: 0.7,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: true
        });

        let fullResponse = "";
        
        // جمع الرد من streaming
        for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || '';
            fullResponse += content;
        }

        // حذف رسالة الانتظار
        api.unsendMessage(waitMsg.messageID);

        // إرسال الرد الكامل
        return api.sendMessage(
            `⚡ جروك AI (سريع):\n\n${fullResponse}\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `💬 ${userMessage.substring(0, 40)}...`,
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error("❌ خطأ في جروك_سريع:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
