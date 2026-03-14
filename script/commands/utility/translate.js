const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "ترجمة_جروك",
    aliases: ["translate_groq", "ترجم_جروك", "ترجمة_ذكية"],
    description: "ترجمة النصوص بذكاء باستخدام Groq AI",
    usage: "ترجمة_جروك [النص] | أو: ترجمة_جروك [اللغة] [النص]",
    cooldown: 5,
    permissions: [],
    category: "utility"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        if (!args[0]) {
            return api.sendMessage(
                "🌐 ترجمة ذكية بـ Groq AI\n\n" +
                "📝 الاستخدام:\n" +
                "• ترجمة_جروك [النص] - ترجمة تلقائية\n" +
                "• ترجمة_جروك [اللغة] [النص] - ترجمة للغة محددة\n\n" +
                "🌍 اللغات المدعومة:\n" +
                "en = إنجليزي | ar = عربي | fr = فرنسي\n" +
                "es = إسباني | de = ألماني | it = إيطالي\n" +
                "ja = ياباني | ko = كوري | zh = صيني\n\n" +
                "💡 أمثلة:\n" +
                "• ترجمة_جروك Hello how are you?\n" +
                "• ترجمة_جروك fr مرحباً كيف حالك؟",
                event.threadID,
                event.messageID
            );
        }

        // قائمة اللغات
        const languages = {
            'en': 'الإنجليزية',
            'ar': 'العربية',
            'fr': 'الفرنسية',
            'es': 'الإسبانية',
            'de': 'الألمانية',
            'it': 'الإيطالية',
            'ja': 'اليابانية',
            'ko': 'الكورية',
            'zh': 'الصينية',
            'ru': 'الروسية',
            'pt': 'البرتغالية',
            'tr': 'التركية'
        };

        let targetLang = null;
        let textToTranslate = "";

        // التحقق من وجود لغة محددة
        if (languages[args[0]]) {
            targetLang = args[0];
            textToTranslate = args.slice(1).join(" ");
        } else {
            textToTranslate = args.join(" ");
        }

        if (!textToTranslate) {
            return api.sendMessage(
                "⚠️ الرجاء كتابة النص المراد ترجمته!",
                event.threadID,
                event.messageID
            );
        }

        const waitMsg = await api.sendMessage(
            "🌐 جاري الترجمة...\n🔄 استخدام الذكاء الاصطناعي",
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        // إعداد رسالة الترجمة
        let systemPrompt = "أنت مترجم محترف. قم بالترجمة بدقة مع الحفاظ على المعنى والسياق.";
        let userPrompt = "";

        if (targetLang) {
            const langName = languages[targetLang];
            userPrompt = `ترجم النص التالي إلى ${langName} فقط بدون أي إضافات:\n\n${textToTranslate}`;
        } else {
            userPrompt = `ترجم النص التالي. إذا كان عربي ترجمه للإنجليزي، وإذا كان إنجليزي ترجمه للعربي. أعطني الترجمة فقط بدون إضافات:\n\n${textToTranslate}`;
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature: 0.3, // أقل للحصول على ترجمة دقيقة
            max_completion_tokens: 1024,
            top_p: 0.9,
            stream: false
        });

        const translation = chatCompletion.choices[0]?.message?.content || "عذراً، فشلت الترجمة.";

        // حذف رسالة الانتظار
        api.unsendMessage(waitMsg.messageID);

        // تحديد اللغات
        const fromLang = targetLang ? "تلقائي" : "تلقائي";
        const toLang = targetLang ? languages[targetLang] : "تلقائي";

        return api.sendMessage(
            `🌐 الترجمة:\n\n${translation}\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `📤 النص الأصلي: ${textToTranslate.substring(0, 100)}${textToTranslate.length > 100 ? '...' : ''}\n` +
            `🔄 من: ${fromLang} → إلى: ${toLang}\n` +
            `🤖 مدعوم بـ Groq AI`,
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error("❌ خطأ في ترجمة_جروك:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ في الترجمة: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
