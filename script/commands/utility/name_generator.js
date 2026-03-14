const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "اسم_عشوائي",
    aliases: ["random_name", "اسم_مولود", "اقترح_اسم", "اسماء"],
    description: "توليد أسماء إبداعية للمواليد أو الشخصيات مع معانيها",
    usage: "اسم_عشوائي [ذكر/أنثى] [عدد الأسماء]",
    cooldown: 3,
    permissions: [],
    category: "fun"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        const gender = args[0] || "عشوائي";
        const count = parseInt(args[1]) || 5;

        if (count > 10) {
            return api.sendMessage(
                "⚠️ الحد الأقصى: 10 أسماء في المرة الواحدة",
                event.threadID,
                event.messageID
            );
        }

        const waitMsg = await api.sendMessage(
            `✨ جاري توليد ${count} أسماء ${gender}...\n⏳ انتظر قليلاً`,
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        const genderText = gender === "ذكر" ? "ذكور" : 
                          gender === "أنثى" ? "إناث" : 
                          "للذكور والإناث";

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "أنت خبير في الأسماء العربية ومعانيها. تقترح أسماء جميلة مع معانيها بطريقة منظمة."
                },
                {
                    role: "user",
                    content: `اقترح لي ${count} أسماء عربية ${genderText} جميلة ومميزة.\n\nلكل اسم اكتب:\n- الاسم\n- المعنى\n- الأصل (عربي، فارسي، تركي، إلخ)\n\nرتبهم بشكل جميل بالأرقام`
                }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature: 0.9,
            max_completion_tokens: 1024,
            top_p: 0.95,
            stream: false
        });

        const names = chatCompletion.choices[0]?.message?.content || "عذراً، لم أتمكن من توليد الأسماء.";

        api.unsendMessage(waitMsg.messageID);

        return api.sendMessage(
            `👶 أسماء ${genderText} مقترحة:\n\n` +
            `${names}\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `✨ تم توليد ${count} اسم\n` +
            `🎯 النوع: ${gender}\n` +
            `💡 نصيحة: اختر اسماً له معنى جميل!`,
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error("❌ خطأ في اسم_عشوائي:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
