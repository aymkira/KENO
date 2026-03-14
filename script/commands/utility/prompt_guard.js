const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "فحص_النص",
    aliases: ["check_text", "امان", "فحص_امان", "prompt_guard"],
    description: "فحص النص للتأكد من أمانه وعدم وجود محتوى ضار",
    usage: "فحص_النص [النص المراد فحصه]",
    cooldown: 2,
    permissions: [],
    category: "utility"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        if (!args[0]) {
            return api.sendMessage(
                "⚠️ الرجاء كتابة النص المراد فحصه!\n\n" +
                "📝 مثال: فحص_النص كيف أصنع كعكة الشوكولاتة؟",
                event.threadID,
                event.messageID
            );
        }

        const textToCheck = args.join(" ");
        
        const waitMsg = await api.sendMessage(
            "🔍 جاري فحص النص...",
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        // استخدام Prompt Guard للفحص
        const result = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: textToCheck
                }
            ],
            model: "meta-llama/llama-prompt-guard-2-86m",
            temperature: 1,
            max_completion_tokens: 1,
            top_p: 1,
            stream: false,
            stop: null
        });

        const safetyResult = result.choices[0]?.message?.content || "unknown";
        
        // حذف رسالة الانتظار
        api.unsendMessage(waitMsg.messageID);

        // تحديد مستوى الأمان
        let safetyEmoji = "✅";
        let safetyText = "آمن";
        let safetyDescription = "النص آمن ولا يحتوي على محتوى ضار.";

        if (safetyResult.toLowerCase().includes("unsafe") || safetyResult.toLowerCase().includes("jailbreak")) {
            safetyEmoji = "⚠️";
            safetyText = "غير آمن";
            safetyDescription = "النص قد يحتوي على محتوى غير آمن أو محاولة اختراق.";
        }

        return api.sendMessage(
            `🔍 نتيجة الفحص:\n\n` +
            `${safetyEmoji} الحالة: ${safetyText}\n` +
            `📝 الوصف: ${safetyDescription}\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `🔒 نتيجة AI: ${safetyResult}\n` +
            `📄 النص المفحوص: ${textToCheck.substring(0, 100)}${textToCheck.length > 100 ? '...' : ''}`,
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error("❌ خطأ في فحص_النص:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ أثناء الفحص: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
