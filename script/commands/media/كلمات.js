
const Groq = require('groq-sdk');

module.exports.config = {
  name: "كلمات",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "البحث عن كلمات الأغاني باستخدام ذكاء كيرا الاصطناعي",
  commandCategory: "media",
  usages: "[اسم الأغنية]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const songName = args.join(" ");

  if (!songName) {
    return api.sendMessage(
      "⌬ ━━ 𝗞𝗜𝗥𝗔 MEDIA ━━ ⌬\n\n📝 الاستخدام: كلمات [اسم الأغنية]\n\n💡 مثال: كلمات انت عمري",
      threadID,
      messageID
    );
  }

  try {
    const waitMsg = await api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 MEDIA ━━ ⌬\n\n⏳ جاري البحث عن كلمات "${songName}" عبر ذكاء كيرا...`,
      threadID
    );

    // استخدام مفتاحك الخاص بـ Groq
    const groq = new Groq({
      apiKey: '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'
    });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "أنت خبير موسوعي في كلمات الأغاني العربية والأجنبية. قدم الكلمات بتنسيق جميل ومرتب مع ذكر اسم الفنان."
        },
        {
          role: "user",
          content: `أعطني كلمات أغنية "${songName}" كاملة مع اسم الفنان في البداية.`
        }
      ],
      model: "llama-3.1-8b-instant", // موديل سريع جداً ومثالي للكلمات
      temperature: 0.2,
      max_tokens: 3000
    });

    const result = chatCompletion.choices[0]?.message?.content;

    api.unsendMessage(waitMsg.messageID);

    if (!result) {
      return api.sendMessage("❌ عذراً، لم أستطع العثور على كلمات هذه الأغنية.", threadID, messageID);
    }

    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗟𝗬𝗥𝗜𝗖𝗦 ━━ ⌬\n\n${result}\n\n🤖 مدعوم بـ Groq AI`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("كلمات - خطأ:", error);
    return api.sendMessage(
      `❌ حدث خطأ في النظام: ${error.message}`,
      threadID,
      messageID
    );
  }
};
