const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "قصة_جروك",
    aliases: ["story_groq", "اكتب_قصة", "قصة_ذكية"],
    description: "كتابة قصص إبداعية باستخدام Groq AI",
    usage: "قصة_جروك [موضوع القصة]",
    cooldown: 10,
    permissions: [],
    category: "ai"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        if (!args[0]) {
            return api.sendMessage(
                "📖 كاتب القصص الذكي\n\n" +
                "✨ اكتب موضوع القصة وسأقوم بكتابة قصة إبداعية!\n\n" +
                "📝 أمثلة:\n" +
                "• قصة_جروك رحلة إلى الفضاء\n" +
                "• قصة_جروك قطة ضائعة في المدينة\n" +
                "• قصة_جروك مغامرة في الغابة\n" +
                "• قصة_جروك صداقة بين طفل وروبوت",
                event.threadID,
                event.messageID
            );
        }

        const storyTopic = args.join(" ");
        
        const waitMsg = await api.sendMessage(
            "✍️ جاري كتابة قصة إبداعية...\n" +
            "📚 الموضوع: " + storyTopic.substring(0, 50) + "\n" +
            "⏳ قد يستغرق هذا بضع ثوانٍ...",
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "أنت كاتب قصص محترف ومبدع. تكتب قصص قصيرة جذابة ومشوقة باللغة العربية الفصحى. استخدم أسلوب أدبي جميل مع وصف دقيق للأحداث والشخصيات. اجعل القصة بين 300-500 كلمة."
                },
                {
                    role: "user",
                    content: `اكتب قصة قصيرة مشوقة عن: ${storyTopic}\n\nاجعل القصة:\n- بها بداية جذابة\n- أحداث مثيرة\n- نهاية مؤثرة\n- شخصيات واضحة\n- رسالة أو عبرة`
                }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature: 0.9, // أعلى للإبداع
            max_completion_tokens: 2048,
            top_p: 0.95,
            stream: false
        });

        const story = chatCompletion.choices[0]?.message?.content || "عذراً، لم أتمكن من كتابة القصة.";

        // حذف رسالة الانتظار
        api.unsendMessage(waitMsg.messageID);

        // تقسيم القصة إذا كانت طويلة (حد رسالة الفيسبوك ~2000 حرف)
        const maxLength = 1900;
        if (story.length > maxLength) {
            const parts = [];
            let currentPart = "";
            const paragraphs = story.split('\n\n');

            for (const paragraph of paragraphs) {
                if ((currentPart + paragraph).length > maxLength) {
                    if (currentPart) parts.push(currentPart);
                    currentPart = paragraph;
                } else {
                    currentPart += (currentPart ? '\n\n' : '') + paragraph;
                }
            }
            if (currentPart) parts.push(currentPart);

            // إرسال الأجزاء
            for (let i = 0; i < parts.length; i++) {
                const header = i === 0 ? 
                    `📖 قصة: ${storyTopic}\n${'━'.repeat(30)}\n\n` : 
                    `📖 تكملة (${i + 1}/${parts.length}):\n\n`;
                
                const footer = i === parts.length - 1 ? 
                    `\n\n${'━'.repeat(30)}\n✍️ كتبت بواسطة Groq AI\n🎭 الموضوع: ${storyTopic.substring(0, 40)}` : 
                    `\n\n[يتبع...]`;

                await api.sendMessage(
                    header + parts[i] + footer,
                    event.threadID,
                    i === parts.length - 1 ? event.messageID : null
                );

                // انتظار قصير بين الرسائل
                if (i < parts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } else {
            // إرسال القصة كاملة
            return api.sendMessage(
                `📖 قصة: ${storyTopic}\n${'━'.repeat(30)}\n\n` +
                `${story}\n\n` +
                `${'━'.repeat(30)}\n` +
                `✍️ كتبت بواسطة Groq AI\n` +
                `📊 عدد الكلمات: ${story.split(' ').length} تقريباً\n` +
                `🎭 الموضوع: ${storyTopic}`,
                event.threadID,
                event.messageID
            );
        }

    } catch (error) {
        console.error("❌ خطأ في قصة_جروك:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ أثناء كتابة القصة: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
