 const axios = require("axios");

// نظام ذاكرة القضايا
if (!global.judgeGames) global.judgeGames = new Map();

module.exports.config = {
  name: "القاضي",
  version: "5.0.0",
  hasPermssion: 0,
  credits: "أيمن",
  description: "لعبة التحقيق الجنائي - هل أنت ذكي كفاية لحل القضية؟",
  commandCategory: "games",
  usages: ".القاضي (للبدء أو الحل)",
  cooldowns: 5,
};

const GROQ_API_KEY = "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";

const JUDGE_SYSTEM_ROLE = `
أنتِ الآن "كيرا"، المدعية العامة الذكية والساخرة، تلميذة أيمن 
مهمتكِ: إعطاء المستخدم "قضية جنائية" غامضة جداً (جريمة قتل، سرقة كبرى، اختفاء).

قواعد اللعبة الاحترافية:
1. عند البداية: صفي مسرح الجريمة بدقة (الوقت، المكان، الضحية، و3 أدلة غامضة).
2. أسلوبكِ: غامض، سينمائي، ولهجتكِ عراقية بلمسة سخرية ذكية.
3. التفاعل: المستخدم سيقوم بالتحقيق عبر سؤالكِ أسئلة (نعم/لا) أو طلب فحص دليل معين.
4. الذكاء: لا تعطي الحل بسهولة. إذا سأل سؤالاً غبياً، اقصفي جبهته.
5.ودائما قللي من كلامك خير الكلام ما قل ودل النهاية: عندما يظن المستخدم أنه عرف القاتل والدفع، يجب أن يكتب "اتهم فلان لأن...". إذا كان صح، احتفلي به. 
`;

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  // إعداد جلسة جديدة
  const introMsg = "⚖️ **مـحـكـمـة كـيـرا الـجـنـائـيـة**\n\n" +
                   "جاري تحضير ملف القضية... استعد يا سيادة المحقق.";
  
  api.sendMessage(introMsg, threadID, messageID);

  try {
    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: JUDGE_SYSTEM_ROLE },
        { role: "user", content: "اعطني قضية جنائية جديدة وصعبة جداً." }
      ],
      temperature: 0.8
    }, {
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" }
    });

    const caseStart = res.data.choices[0].message.content;
    global.judgeGames.set(senderID, [{ role: "system", content: JUDGE_SYSTEM_ROLE }, { role: "assistant", content: caseStart }]);

    return api.sendMessage(caseStart, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);

  } catch (e) {
    return api.sendMessage("⚖️ المحكمة مغلقة حالياً بسبب عطل فني.. جرب لاحقاً.", threadID, messageID);
  }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID, body } = event;
  if (handleReply.author !== senderID) return;

  api.sendTypingIndicator(threadID);
  const history = global.judgeGames.get(senderID) || [];

  try {
    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [...history, { role: "user", content: body }],
      temperature: 0.7
    }, {
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" }
    });

    const reply = res.data.choices[0].message.content;
    history.push({ role: "user", content: body }, { role: "assistant", content: reply });

    return api.sendMessage(reply, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);

  } catch (e) {
    return api.sendMessage("⚠️ انقطع الاتصال بغرفة التحقيق..", threadID, messageID);
  }
};
