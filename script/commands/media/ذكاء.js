const axios = require("axios");

module.exports.config = {
    name: "ذكاء",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Kira",
    description: "ذكاء اصطناعي متطور باستخدام Hugging Face",
    commandCategory: "ai",
    usages: "[سؤالك]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const prompt = args.join(" ");

    // المفتاح الخاص بك الذي أرسلته
    const apiKey = "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"; 

    // رابط الموديل (Llama-3-8B)
    const modelUrl = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct";

    if (!prompt) return api.sendMessage("📩 اسألني أي شيء يا أيمن..", threadID, messageID);

    try {
        const response = await axios.post(modelUrl, 
            { 
                inputs: prompt,
                parameters: { max_new_tokens: 500 }
            },
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        // معالجة الرد
        let reply = "";
        if (Array.isArray(response.data)) {
            reply = response.data[0].generated_text;
        } else {
            reply = response.data.generated_text;
        }

        // تنظيف الرد من النص الزائد (البرومبت)
        const cleanReply = reply.replace(prompt, "").trim();

        return api.sendMessage(`🤖 كـيـرا الـذكـي:\n\n${cleanReply || "..."}`, threadID, messageID);

    } catch (error) {
        console.error(error);
        if (error.response && error.response.status === 503) {
            return api.sendMessage("⏳ الموديل يتم تحميله الآن، انتظر دقيقة وأعد المحاولة.", threadID, messageID);
        }
        return api.sendMessage("❌ حدث خطأ في الاتصال بالسيرفر.", threadID, messageID);
    }
};
