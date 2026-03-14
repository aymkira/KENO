const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "وصفة_طعام",
    aliases: ["recipe", "طبخة", "اطبخ", "وصفة"],
    description: "توليد وصفات طعام إبداعية حسب المكونات المتوفرة",
    usage: "وصفة_طعام [المكونات المتوفرة] أو: وصفة_طعام [نوع الطبق]",
    cooldown: 5,
    permissions: [],
    category: "utility"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        if (!args[0]) {
            return api.sendMessage(
                "👨‍🍳 مولد الوصفات الذكي\n\n" +
                "📝 طريقتين للاستخدام:\n\n" +
                "1️⃣ حسب المكونات:\n" +
                "   وصفة_طعام دجاج، أرز، طماطم\n\n" +
                "2️⃣ حسب نوع الطبق:\n" +
                "   وصفة_طعام معكرونة إيطالية\n" +
                "   وصفة_طعام حلى سريع\n" +
                "   وصفة_طعام فطور صحي",
                event.threadID,
                event.messageID
            );
        }

        const input = args.join(" ");

        const waitMsg = await api.sendMessage(
            `👨‍🍳 جاري تحضير وصفة مميزة...\n🥘 الطلب: ${input.substring(0, 40)}...`,
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "أنت طباخ محترف. تقدم وصفات واضحة وسهلة التطبيق مع تعليمات دقيقة. اكتب بطريقة منظمة وجذابة."
                },
                {
                    role: "user",
                    content: `اقترح وصفة طعام لذيذة بناءً على: ${input}\n\nاكتب الوصفة بالتفصيل:\n\n📝 اسم الطبق\n👥 عدد الأشخاص\n⏱️ وقت التحضير\n🔥 مستوى الصعوبة\n\n🥘 المكونات:\n[قائمة واضحة بالمقادير]\n\n👨‍🍳 طريقة التحضير:\n[خطوات مرقمة وواضحة]\n\n💡 نصائح:\n[نصائح مفيدة]\n\n🌟 القيمة الغذائية التقريبية`
                }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature: 0.85,
            max_completion_tokens: 2048,
            top_p: 0.9,
            stream: false
        });

        const recipe = chatCompletion.choices[0]?.message?.content || "عذراً، لم أتمكن من توليد الوصفة.";

        api.unsendMessage(waitMsg.messageID);

        // تقسيم إذا كان طويلاً
        if (recipe.length > 1800) {
            const parts = [];
            let currentPart = "";
            const lines = recipe.split('\n');

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
                    `👨‍🍳 وصفة مميزة\n${'━'.repeat(30)}\n\n` : 
                    `👨‍🍳 تكملة الوصفة (${i + 1}/${parts.length}):\n\n`;

                await api.sendMessage(
                    header + parts[i],
                    event.threadID,
                    i === parts.length - 1 ? event.messageID : null
                );

                if (i < parts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } else {
            return api.sendMessage(
                `👨‍🍳 وصفة مميزة\n${'━'.repeat(30)}\n\n` +
                `${recipe}\n\n` +
                `━━━━━━━━━━━━━━━\n` +
                `✨ بالهناء والشفاء!\n` +
                `📱 شاركنا نتيجتك!`,
                event.threadID,
                event.messageID
            );
        }

    } catch (error) {
        console.error("❌ خطأ في وصفة_طعام:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
