const axios = require("axios");
const path = require("path");

if (!global.conversationHistory) global.conversationHistory = new Map();

module.exports.config = {
  name: "مملكة",
  version: "17.0.0",
  hasPermssion: 0,
  credits: "أيمن",
  description: "لعبة الممالك - ردود قصيرة ومكافآت بناءً على الأحداث",
  commandCategory: "games",
  usages: "[أمرك]",
  cooldowns: 5,
};

const GROQ_API_KEY = "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";
const ADMIN_ID = "61577861540407"; 
const header = `⌬ ━━━━━━━━━━━━ ⌬\n     🏰 مـمـلـكـة كـيـرا\n⌬ ━━━━━━━━━━━━ ⌬`;

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const conversationKey = `${threadID}_${senderID}`;
  if (!global.conversationHistory.has(conversationKey)) global.conversationHistory.set(conversationKey, []);

  api.sendTypingIndicator(threadID);
  await handleGameLogic(api, event, args.join(" ") || "ابدأ", conversationKey);
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID, body } = event;
  if (handleReply.author !== senderID) return;

  api.sendTypingIndicator(threadID);
  await handleGameLogic(api, event, body, handleReply.conversationKey);
};

async function handleGameLogic(api, event, userInput, key) {
  const { threadID, messageID, senderID } = event;
  const mongodb = require(path.join(process.cwd(), "includes", "mongodb.js"));
  const isAdmin = senderID === ADMIN_ID;

  try {
    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: buildSystemRole(isAdmin) },
        ...global.conversationHistory.get(key).slice(-6),
        { role: "user", content: userInput }
      ],
      max_tokens: 150,
      temperature: 0.7
    }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });

    const answer = res.data.choices[0].message.content.trim();
    let rewardMsg = "";

    // منطق المكافأة: فقط عند وجود كلمات تدل على ربح أو نجاح
    if (/(نجحت|بعت|سرقت|نهبت|ربحت|فزت|تطور|انتهى)/i.test(answer) || /(بيع|سرقة|هجوم ناجح)/i.test(userInput)) {
       const money = Math.floor(Math.random() * 600) + 200;
       const xp = Math.floor(Math.random() * 100) + 30;
       await mongodb.addMoney(senderID, money);
       await mongodb.addExp(senderID, xp);
       rewardMsg = `\n\n💰 +${money}$ | 🛡️ +${xp}XP`;
    }

    global.conversationHistory.get(key).push({ role: "user", content: userInput }, { role: "assistant", content: answer });
    if (global.conversationHistory.get(key).length > 10) global.conversationHistory.get(key).splice(0, 2);

    return api.sendMessage(`${header}\n\n${answer}${rewardMsg}`, threadID, (err, info) => {
      global.client.handleReply.push({
        name: "مملكة",
        messageID: info.messageID,
        author: senderID,
        conversationKey: key
      });
    }, messageID);

  } catch (e) {
    return api.sendMessage("❌ عطل فني في المملكة.", threadID);
  }
}

function buildSystemRole(isAdmin) {
  return `أنتِ "كيرا" (17 سنة، عراقية، ساخرة). مديرة لعبة بناء ممالك.
  - كوني مقتضبة جداً: ردي بجملة أو جملتين فقط! لا تحكي كثيراً.
  - إذا كان اللاعب "أيمن" (isAdmin=${isAdmin}): كوني مطيعة ودلوعية "شوقر دادي".
  - لا تعطي مكافآت إلا إذا قام اللاعب بفعل يستحق الربح (بيع، سرقة، هجوم ناجح).
  - تكلمي بلهجة سورية أو عراقية حسب السياق.`;
}
