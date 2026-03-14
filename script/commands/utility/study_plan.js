const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "خطة_دراسة",
    aliases: ["study_plan", "جدول_مذاكرة", "خطة_تعلم"],
    description: "إنشاء خطة دراسية مخصصة حسب المادة والوقت المتاح",
    usage: "خطة_دراسة [المادة] [عدد الأيام]",
    cooldown: 5,
    permissions: [],
    category: "utility"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        if (!args[0]) {
            return api.sendMessage(
                "📚 مولد الخطط الدراسية\n\n" +
                "📝 الاستخدام:\n" +
                "خطة_دراسة [المادة] [عدد الأيام]\n\n" +
                "💡 أمثلة:\n" +
                "• خطة_دراسة رياضيات 7\n" +
                "• خطة_دراسة برمجة 14\n" +
                "• خطة_دراسة إنجليزي 30\n" +
                "• خطة_دراسة فيزياء 10",
                event.threadID,
                event.messageID
            );
        }

        const days = parseInt(args[args.length - 1]);
        const subject = isNaN(days) ? 
            args.join(" ") : 
            args.slice(0, -1).join(" ");
        const studyDays = isNaN(days) ? 7 : days;

        if (studyDays > 90) {
            return api.sendMessage(
                "⚠️ الحد الأقصى: 90 يوم\n💡 للخطط الطويلة، قسمها لعدة مراحل",
                event.threadID,
                event.messageID
            );
        }

        const waitMsg = await api.sendMessage(
            `📚 جاري إنشاء خطة دراسية...\n` +
            `📖 المادة: ${subject}\n` +
            `📅 المدة: ${studyDays} يوم`,
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "أنت مستشار تعليمي خبير. تصمم خطط دراسية فعالة ومنظمة تراعي التدرج في الصعوبة والراحة النفسية للطالب."
                },
                {
                    role: "user",
                    content: `صمم لي خطة دراسية تفصيلية لـ "${subject}" لمدة ${studyDays} يوم.\n\nاكتب الخطة بهذا الشكل:\n\n📊 نظرة عامة:\n- الهدف الرئيسي\n- المحاور الأساسية\n- توقع النتائج\n\n📅 الجدول اليومي:\n[قسم المدة لأيام أو أسابيع حسب الطول]\n\nاليوم 1: [الموضوع]\n- ماذا تدرس؟\n- كم ساعة؟\n- تمارين مقترحة\n\n[وهكذا لكل يوم]\n\n💡 نصائح للنجاح:\n- نصائح عملية\n- كيفية التحفيز\n- كيفية التعامل مع الصعوبات\n\n📈 تقييم التقدم:\n- معايير تقييم الفهم\n- مراجعة دورية`
                }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature: 0.75,
            max_completion_tokens: 2048,
            top_p: 0.9,
            stream: false
        });

        const studyPlan = chatCompletion.choices[0]?.message?.content || "عذراً، لم أتمكن من إنشاء الخطة.";

        api.unsendMessage(waitMsg.messageID);

        // تقسيم إذا كان طويلاً
        if (studyPlan.length > 1800) {
            const parts = [];
            let currentPart = "";
            const lines = studyPlan.split('\n');

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
                    `📚 خطة دراسة: ${subject}\n📅 المدة: ${studyDays} يوم\n${'━'.repeat(30)}\n\n` : 
                    `📚 تكملة الخطة (${i + 1}/${parts.length}):\n\n`;

                await api.sendMessage(
                    header + parts[i],
                    event.threadID,
                    i === parts.length - 1 ? event.messageID : null
                );

                if (i < parts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }

            // إضافة رسالة تحفيزية في النهاية
            await api.sendMessage(
                `✨ تذكر:\n` +
                `💪 الانضباط أهم من الحماس\n` +
                `🎯 ركز على الفهم لا الحفظ\n` +
                `☕ خذ راحة كل 50 دقيقة\n` +
                `📝 راجع يومياً ما تعلمته\n\n` +
                `🌟 بالتوفيق في رحلتك الدراسية!`,
                event.threadID
            );

        } else {
            return api.sendMessage(
                `📚 خطة دراسة: ${subject}\n📅 المدة: ${studyDays} يوم\n${'━'.repeat(30)}\n\n` +
                `${studyPlan}\n\n` +
                `━━━━━━━━━━━━━━━\n` +
                `✨ نصيحة: التزم بالخطة وستصل لهدفك!\n` +
                `💪 بالتوفيق!`,
                event.threadID,
                event.messageID
            );
        }

    } catch (error) {
        console.error("❌ خطأ في خطة_دراسة:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
