const { Groq } = require('groq-sdk');

module.exports.config = {
    name: "كود",
    aliases: ["code_groq", "كود", "مبرمج"],
    description: "مساعد برمجة ذكي - يكتب ويشرح الأكواد",
    usage: "كود [لغة البرمجة] [الطلب]",
    cooldown: 5,
    permissions: [],
    category: "developer"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        if (!args[0]) {
            return api.sendMessage(
                "💻 مساعد البرمجة الذكي\n\n" +
                "📝 الاستخدام:\n" +
                "كود [لغة] [الطلب]\n\n" +
                "🔧 اللغات المدعومة:\n" +
                "• javascript | js\n" +
                "• python | py\n" +
                "• java\n" +
                "• cpp | c++\n" +
                "• php\n" +
                "• html\n" +
                "• css\n\n" +
                "💡 أمثلة:\n" +
                "• كود js دالة لحساب المضروب\n" +
                "• كود python برنامج لفرز قائمة\n" +
                "• كود شرح promise في جافاسكربت",
                event.threadID,
                event.messageID
            );
        }

        // قائمة اللغات
        const languages = {
            'javascript': 'JavaScript',
            'js': 'JavaScript',
            'python': 'Python',
            'py': 'Python',
            'java': 'Java',
            'cpp': 'C++',
            'c++': 'C++',
            'php': 'PHP',
            'html': 'HTML',
            'css': 'CSS',
            'sql': 'SQL',
            'ruby': 'Ruby',
            'go': 'Go',
            'rust': 'Rust',
            'swift': 'Swift'
        };

        let language = "JavaScript"; // افتراضي
        let codeRequest = args.join(" ");

        // التحقق من وجود لغة محددة
        const firstArg = args[0].toLowerCase();
        if (languages[firstArg]) {
            language = languages[firstArg];
            codeRequest = args.slice(1).join(" ");
        }

        if (!codeRequest) {
            return api.sendMessage(
                "⚠️ الرجاء كتابة الطلب البرمجي!\n\n" +
                `🔧 اللغة المحددة: ${language}`,
                event.threadID,
                event.messageID
            );
        }

        const waitMsg = await api.sendMessage(
            `💻 جاري كتابة الكود...\n` +
            `🔧 اللغة: ${language}\n` +
            `📝 الطلب: ${codeRequest.substring(0, 50)}...`,
            event.threadID
        );

        const groq = new Groq({
            apiKey: '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'
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `أنت مبرمج خبير في ${language}. تكتب كود نظيف وموثق جيداً. تشرح الكود بالعربية بشكل واضح. اكتب الكود مع التعليقات والشرح المفصل.`
                },
                {
                    role: "user",
                    content: `في لغة ${language}, ${codeRequest}\n\nاكتب الكود مع:\n1. تعليقات توضيحية\n2. شرح مختصر للكود\n3. مثال على الاستخدام إن أمكن`
                }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature: 0.7,
            max_completion_tokens: 2048,
            top_p: 0.9,
            stream: false
        });

        const codeResponse = chatCompletion.choices[0]?.message?.content || "عذراً، لم أتمكن من كتابة الكود.";

        // حذف رسالة الانتظار
        api.unsendMessage(waitMsg.messageID);

        // تقسيم الرد إذا كان طويلاً
        const maxLength = 1800;
        if (codeResponse.length > maxLength) {
            // تقسيم الكود
            const parts = [];
            let currentPart = "";
            const lines = codeResponse.split('\n');

            for (const line of lines) {
                if ((currentPart + line + '\n').length > maxLength) {
                    if (currentPart) parts.push(currentPart);
                    currentPart = line + '\n';
                } else {
                    currentPart += line + '\n';
                }
            }
            if (currentPart) parts.push(currentPart);

            // إرسال الأجزاء
            for (let i = 0; i < parts.length; i++) {
                const header = i === 0 ? 
                    `💻 ${language} - ${codeRequest.substring(0, 40)}\n${'━'.repeat(30)}\n\n` : 
                    `💻 تكملة الكود (${i + 1}/${parts.length}):\n\n`;
                
                const footer = i === parts.length - 1 ? 
                    `\n\n${'━'.repeat(30)}\n🤖 كتب بواسطة Groq AI\n🔧 اللغة: ${language}` : 
                    `\n\n[يتبع...]`;

                await api.sendMessage(
                    header + parts[i] + footer,
                    event.threadID,
                    i === parts.length - 1 ? event.messageID : null
                );

                if (i < parts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } else {
            return api.sendMessage(
                `💻 ${language} - ${codeRequest.substring(0, 40)}\n${'━'.repeat(30)}\n\n` +
                `${codeResponse}\n\n` +
                `${'━'.repeat(30)}\n` +
                `🤖 كتب بواسطة Groq AI\n` +
                `🔧 اللغة: ${language}\n` +
                `📝 الطلب: ${codeRequest.substring(0, 50)}...`,
                event.threadID,
                event.messageID
            );
        }

    } catch (error) {
        console.error("❌ خطأ في كود:", error);
        return api.sendMessage(
            `⚠️ حدث خطأ أثناء كتابة الكود: ${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
