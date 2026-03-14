  const axios = require("axios");

if (!global.wyrGames) global.wyrGames = new Map();

module.exports.config = {
  name: "خيروك",
  version: "2.5.0",
  hasPermssion: 0,
  credits: "أيمن",
  description: "لعبة لو خيروك بنظام الذكاء الاصطناعي والتحليل النفسي الساخر",
  commandCategory: "games",
  usages: ".خيروك",
  cooldowns: 3,
};

const GROQ_API_KEY = "Gsk_TG7lGYi0Qiou5l2OiLEzWGdyb3FYQrshUy1POUwwaCdYJM1eyc0w";

const WYR_SYSTEM_ROLE = `
أنتِ "كيرا" العراقية، عمرك 17 سنة، ذكية وساخرة جداً.
مهمتكِ: لعب "لو خيروك" مع المستخدم.

القواعد:
1. قدمي للمستخدم خيارين (أ) و (ب). يجب أن تكون الخيارات غريبة، مضحكة، أو صعبة جداً ومنوعة (حياة، حب، تكنولوجيا، قصف جبهات).
2. بعد أن يختار المستخدم، قومي بـ "تحليل نفسيته" بناءً على اختياره بأسلوب ساخر ومضحك.
3. لهجتكِ عراقية بيضاء (مفهومة للكل) مع خفة دم.
4. دائماً اذكرِي أن ذكاءكِ هذا بفضل "أيمن " حبيبي ومطوري.
5. لا تستخدمي خيارات مكررة، كوني مبتكرة.
6. اذا سألك موضزع ثاني وبعيد عن اللعبة قولي له ان يرجع او يغادر وانه غريب اطوار ودائما تصرفي كبشر حتى لو سألك ان كنتي آلي. 
`;

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;

  try {
    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: WYR_SYSTEM_ROLE },
        { role: "user", content: "اعطيني تحدي لو خيروك جديد وقوي." }
      ],
      temperature: 0.9
    }, {
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" }
    });

    const question = res.data.choices[0].message.content;
    global.wyrGames.set(senderID, [{ role: "system", content: WYR_SYSTEM_ROLE }, { role: "assistant", content: question }]);

    return api.sendMessage(question, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);

  } catch (e) {
    return api.sendMessage("حتى لو خيروك تعطلت.. صوج حظك المصخم 😼", threadID, messageID);
  }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID, body } = event;
  if (handleReply.author !== senderID) return;

  api.sendTypingIndicator(threadID);
  const history = global.wyrGames.get(senderID) || [];

  try {
    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [...history, { role: "user", content: `اخترت: ${body}. حللي خياري بأسلوب ساخر ثم اعطيني تحدي جديد.` }],
      temperature: 0.8
    }, {
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" }
    });

    const reply = res.data.choices[0].message.content;
    // تحديث الهستوري للعبة المستمرة
    history.push({ role: "user", content: body }, { role: "assistant", content: reply });

    return api.sendMessage(reply, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);

  } catch (e) {
    return api.sendMessage("انقطع النت عن عقلي.. لحظة!", threadID, messageID);
  }
};
