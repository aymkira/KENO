const fs = require('fs');
const path = require('path');
const { Groq } = require('groq-sdk');
const axios = require('axios');

module.exports.config = {
    name: "نص_لصوت",
    aliases: ["text_to_speech", "تحويل_صوت", "قراءة", "صوت_عربي"],
    description: "تحويل النص العربي إلى صوت بلهجة سعودية",
    usage: "نص_لصوت [النص المراد تحويله]",
    cooldown: 10,
    permissions: [],
    category: "media"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        if (!args[0]) {
            return api.sendMessage(
                "⚠️ الرجاء كتابة النص المراد تحويله لصوت!\n\n" +
                "📝 مثال: نص_لصوت مرحباً كيف حالك اليوم؟\n" +
                "🎤 الصوت: فهد (سعودي)",
                event.threadID,
                event.messageID
            );
        }

        const textToSpeak = args.join(" ");
        
        // التحقق من طول النص
        if (textToSpeak.length > 500) {
            return api.sendMessage(
                "⚠️ النص طويل جداً!\n\n" +
                "📏 الحد الأقصى: 500 حرف\n" +
                "📊 طول النص الحالي: " + textToSpeak.length,
                event.threadID,
                event.messageID
            );
        }

        const waitMsg = await api.sendMessage(
            "🎤 جاري تحويل النص إلى صوت...\n" +
            "⏳ الرجاء الانتظار قليلاً",
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        // إنشاء مسار مؤقت للملف
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const speechFile = path.join(tempDir, `speech_${Date.now()}.wav`);

        // تحويل النص إلى صوت
        const wav = await groq.audio.speech.create({
            model: "canopylabs/orpheus-arabic-saudi",
            voice: "fahad",
            response_format: "wav",
            input: textToSpeak
        });

        // حفظ الملف
        const buffer = Buffer.from(await wav.arrayBuffer());
        await fs.promises.writeFile(speechFile, buffer);

        // حذف رسالة الانتظار
        api.unsendMessage(waitMsg.messageID);

        // إرسال ملف الصوت
        await api.sendMessage(
            {
                body: `🎤 تم تحويل النص إلى صوت!\n\n` +
                      `📝 النص: ${textToSpeak.substring(0, 100)}${textToSpeak.length > 100 ? '...' : ''}\n` +
                      `🎙️ الصوت: فهد (سعودي)\n` +
                      `━━━━━━━━━━━━━━━`,
                attachment: fs.createReadStream(speechFile)
            },
            event.threadID,
            () => {
                // حذف الملف بعد الإرسال
                fs.unlinkSync(speechFile);
            },
            event.messageID
        );

    } catch (error) {
        console.error("❌ خطأ في نص_لصوت:", error);
        
        let errorMsg = "⚠️ حدث خطأ أثناء تحويل النص إلى صوت.";
        
        if (error.message.includes("rate_limit")) {
            errorMsg = "⚠️ تم تجاوز حد الطلبات. حاول مرة أخرى بعد دقيقة.";
        }
        
        return api.sendMessage(
            `${errorMsg}\n\n📝 الخطأ: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
