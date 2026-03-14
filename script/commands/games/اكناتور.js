const axios = require("axios");

// ===== أنظمة الذاكرة اللحظية =====
if (!global.akinatorSession) global.akinatorSession = new Map();

module.exports.config = {
  name: "اكيناتور",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أيمن",
  description: "لعبة أكيناتور - كيرا تحزر الشخصية اللي ببالك",
  commandCategory: "games",
  usages: ".اكيناتور [ابدأ / جوابك]",
  cooldowns: 3,
};

const GROQ_API_KEY = "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";

// ===== البرومبت الخاص بأكيناتور =====
const AKI_SYSTEM_ROLE = `
أنتِ الآن تلعبين دور "أكيناتور" (المارد العبقري) لكن بشخصية "كيرا" العراقية الساخرة.
وظيفتك: تحزرين الشخصية (حقيقية، خيالية، مشهورة) التي يفكر بها المستخدم.

قواعد اللعبة:
1. ابدئي بطلب من المستخدم أن يفكر بشخصية.
2. اسألي أسئلة ذكية (سؤال واحد في كل مرة) تكون إجابتها (نعم، لا، لا أعلم، ربما، من الممكن).
3. بعد حوالي 10-15 سؤال، أو عندما تصبحين متأكدة بنسبة 80%، قومي بتخمين الشخصية.
4. أسلوبك: ساخر، واثق بزيادة، وتستخدمين لهجة المستخدم (عراقي، سوري، مصري.. إلخ).
5. إذا حزرتِ الشخصية صح، تفاخري بذكائك وقلي "أنا تلميذة أيمن الشوقر دادي، أكيد أحزرها".
6. إذا خسرتِ، اعترفي بهدوء واطلبي اسم الشخصية لتتعلمي.
`;

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const input = args.join(" ");

  // تشغيل الجلسة
  if (!input || input === "ابدأ" || input === "ابدا") {
    global.akinatorSession.set(senderID, []);
    const startMsg = "🧞‍♂️ هلا بيك.. أنا أكيناتور كيرا. فكر بشخصية (مشهورة، خيالية، أو حتى أيمن حبيبي) وقولي 'جاهز' حتى أبلش أسألك!";
    return api.sendMessage(startMsg, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);
  }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID, body } = event;

  if (handleReply.author !== senderID) return;

  api.sendTypingIndicator(threadID);

  const history = global.akinatorSession.get(senderID) || [];
  
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: AKI_SYSTEM_ROLE },
          ...history,
          { role: "user", content: body }
        ],
        temperature: 0.6
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const answer = res.data.choices[0].message.content.trim();

    // تحديث الذاكرة
    history.push({ role: "user", content: body }, { role: "assistant", content: answer });
    global.akinatorSession.set(senderID, history);

    return api.sendMessage(answer, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);

  } catch (e) {
    return api.sendMessage("المارد دايخ شوية.. أعد المحاولة.", threadID, messageID);
  }
};
