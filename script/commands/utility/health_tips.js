const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "نصائح_صحية",
    aliases: ["health_tips", "صحة", "نصيحة_صحية"],
    description: "نصائح صحية مخصصة حسب الهدف أو الحالة",
    usage: "نصائح_صحية [الهدف أو المشكلة]",
    cooldown: 5,
    permissions: [],
    category: "utility"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        if (!args[0]) {
            return api.sendMessage(
                "🏥 مستشارك الصحي الذكي\n\n" +
                "📝 الاستخدام:\n" +
                "نصائح_صحية [الهدف أو المشكلة]\n\n" +
                "💡 أمثلة:\n" +
                "• نصائح_صحية إنقاص الوزن\n" +
                "• نصائح_صحية زيادة العضلات\n" +
                "• نصائح_صحية تحسين النوم\n" +
                "• نصائح_صحية تقوية المناعة\n" +
                "• نصائح_صحية التخلص من التوتر\n\n" +
                "⚠️ تنبيه: هذه نصائح عامة، استشر طبيبك للحالات الخاصة",
                event.threadID,
                event.messageID
            );
        }

        const goal = args.join(" ");

        const waitMsg = await api.sendMessage(
            `🏥 جاري إعداد نصائح صحية مخصصة...\n🎯 الهدف: ${goal}`,
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "أنت مستشار صحي متخصص. تقدم نصائح صحية علمية وعملية بطريقة واضحة. تذكر دائماً بأهمية استشارة الطبيب للحالات الخاصة."
                },
                {
                    role: "user",
                    content: `قدم نصائح صحية شاملة وعملية عن: ${goal}\n\nاكتب النصائح بهذا الشكل:\n\n🎯 نظرة عامة:\n[فهم الهدف أو المشكلة]\n\n🍎 التغذية:\n[نصائح غذائية محددة]\n- أطعمة يُنصح بها\n- أطعمة يُنصح بتجنبها\n- وجبات مقترحة\n\n💪 النشاط البدني:\n[تمارين وأنشطة مناسبة]\n- نوع التمارين\n- المدة والتكرار\n- تحذيرات مهمة\n\n😴 نمط الحياة:\n[عادات صحية يومية]\n- النوم\n- شرب الماء\n- تقليل التوتر\n\n💊 مكملات (اختيارية):\n[مكملات قد تساعد]\n\n📊 خطة عملية:\n[خطة أسبوعية بسيطة]\n\n⚠️ تحذيرات ومحاذير:\n[متى يجب استشارة الطبيب]\n\n💡 نصائح إضافية:\n[نصائح تحفيزية وعملية]\n\nتذكر: "هذه نصائح عامة للاستئناس. استشر طبيبك قبل بدء أي برنامج صحي جديد."`
                }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature: 0.7,
            max_completion_tokens: 2048,
            top_p: 0.9,
            stream: false
        });

        const healthTips = chatCompletion.choices[0]?.message?.content || "عذراً، لم أتمكن من تقديم النصائح.";

        api.unsendMessage(waitMsg.messageID);

        // تقسيم إذا كان طويلاً
        if (healthTips.length > 1800) {
            const parts = [];
            let currentPart = "";
            const lines = healthTips.split('\n');

            for (const line of lines) {
                if ((currentPart + line + '\n').length > 1800) {
                    if (currentPart) parts.push(currentPart);
                    currentPart = line + '\n';
                } else {
                    currentPart += line + '\n';
                }
            }
            if (currentPart) parts.push(currentPart);

            for (let i = 0; i < parts.length; i++) {
                const header = i === 0 ? 
                    `🏥 نصائح صحية: ${goal}\n${'━'.repeat(30)}\n\n` : 
                    `🏥 تكملة النصائح (${i + 1}/${parts.length}):\n\n`;

                await api.sendMessage(
                    header + parts[i],
                    event.threadID,
                    i === parts.length - 1 ? event.messageID : null
                );

                if (i < parts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }
        } else {
            return api.sendMessage(
                `🏥 نصائح صحية: ${goal}\n${'━'.repeat(30)}\n\n` +
                `${healthTips}\n\n` +
                `━━━━━━━━━━━━━━━\n` +
                `🎯 الهدف: ${goal}\n` +
                `💪 ابدأ اليوم، ولو بخطوة صغيرة!\n` +
                `⚠️ استشر طبيبك للحالات الخاصة`,
                event.threadID,
                event.messageID
            );
        }

    } catch (error) {
        console.error("❌ خطأ في نصائح_صحية:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
