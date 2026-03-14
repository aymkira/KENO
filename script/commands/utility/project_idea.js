const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "فكرة_مشروع",
    aliases: ["project_idea", "مشروع", "افكار_مشاريع", "بزنس"],
    description: "توليد أفكار مشاريع ومشاريع ريادية مع خطة تنفيذ",
    usage: "فكرة_مشروع [المجال أو الميزانية]",
    cooldown: 5,
    permissions: [],
    category: "utility"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        if (!args[0]) {
            return api.sendMessage(
                "💡 مولد أفكار المشاريع\n\n" +
                "📝 الاستخدام:\n" +
                "فكرة_مشروع [المجال]\n\n" +
                "💡 أمثلة:\n" +
                "• فكرة_مشروع تقنية\n" +
                "• فكرة_مشروع صغير\n" +
                "• فكرة_مشروع من المنزل\n" +
                "• فكرة_مشروع طعام\n" +
                "• فكرة_مشروع أونلاين\n" +
                "• فكرة_مشروع ميزانية محدودة",
                event.threadID,
                event.messageID
            );
        }

        const field = args.join(" ");

        const waitMsg = await api.sendMessage(
            `💡 جاري توليد فكرة مشروع مبتكرة...\n🎯 المجال: ${field}`,
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "أنت مستشار أعمال وريادة أعمال خبير. تقترح أفكار مشاريع عملية ومبتكرة مع خطط تنفيذ واقعية."
                },
                {
                    role: "user",
                    content: `اقترح لي فكرة مشروع مبتكرة في مجال: ${field}\n\nاكتب بالتفصيل:\n\n💡 الفكرة الأساسية:\n[وصف الفكرة بوضوح]\n\n🎯 الفئة المستهدفة:\n[من هم العملاء؟]\n\n💰 نموذج الربح:\n[كيف ستحقق الدخل؟]\n\n📊 الميزانية المتوقعة:\n- التكلفة الأولية\n- التكاليف الشهرية\n- العائد المتوقع\n\n🚀 خطة التنفيذ:\n[خطوات بدء المشروع]\n\n⚡ المميزات التنافسية:\n[لماذا فكرتك مميزة؟]\n\n⚠️ المخاطر والتحديات:\n[ما هي المخاطر؟]\n\n📈 فرص التوسع:\n[كيف يمكن تطوير المشروع؟]\n\n💡 نصائح للنجاح:\n[نصائح عملية]`
                }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature: 0.85,
            max_completion_tokens: 2048,
            top_p: 0.9,
            stream: false
        });

        const projectIdea = chatCompletion.choices[0]?.message?.content || "عذراً، لم أتمكن من توليد فكرة.";

        api.unsendMessage(waitMsg.messageID);

        // تقسيم إذا كان طويلاً
        if (projectIdea.length > 1800) {
            const parts = [];
            let currentPart = "";
            const lines = projectIdea.split('\n');

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
                    `💡 فكرة مشروع: ${field}\n${'━'.repeat(30)}\n\n` : 
                    `💡 تكملة (${i + 1}/${parts.length}):\n\n`;

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
                `💡 فكرة مشروع: ${field}\n${'━'.repeat(30)}\n\n` +
                `${projectIdea}\n\n` +
                `━━━━━━━━━━━━━━━\n` +
                `🎯 المجال: ${field}\n` +
                `✨ نصيحة: ابدأ صغيراً وطور تدريجياً!\n` +
                `💪 بالتوفيق في مشروعك!`,
                event.threadID,
                event.messageID
            );
        }

    } catch (error) {
        console.error("❌ خطأ في فكرة_مشروع:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
