const axios = require("axios");

// ===== أنظمة الذاكرة =====
if (!global.usersNames) global.usersNames = new Map();
if (!global.conversationHistory) global.conversationHistory = new Map();

module.exports.config = {
  name: "كيرا",
  version: "13.1",
  hasPermssion: 0,
  credits: "أيمن",
  description: "نوفا — بنت عراقية ذكية وساخرة ومخلصة للمطور",
  commandCategory: "utility",
  usages: ".كيرا [النص]",
  cooldowns: 3,
};

const GROQ_API_KEY = "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";
const ADMIN_ID = "61580139921634"; // أيمن

// ===== كشف اللهجة =====
const detectDialect = (text) => {
  if (/شلونك|شكو|ماكو|يابة|زين/i.test(text)) return "عراقية";
  if (/كيفك|هلق|يلا|حبيبي|شو/i.test(text)) return "شامية";
  if (/ازيك|عامل ايه|يسطا|بتاع/i.test(text)) return "مصرية";
  if (/وش|ايش|الله يسعدك/i.test(text)) return "خليجية";
  if (/[a-zA-Z]{3,}/.test(text)) return "إنجليزية";
  return "فصحى";
};

// ===== طول الرد =====
const getResponseLength = (q) => {
  if (q.split(" ").length <= 3) {
    return { max_tokens: 80, instruction: "ردّي بجملة أو جملتين فقط." };
  }
  if (/(اشرح|وضح|كيف|ما هو|نصيحة)/i.test(q)) {
    return { max_tokens: 200, instruction: "ردّي بإيجاز واضح (30-50 كلمة)." };
  }
  if (/(حلل|قارن|احسب|معادلة|ترجم)/i.test(q)) {
    return { max_tokens: 400, instruction: "ردّي بتفصيل مناسب بدون إطالة." };
  }
  return { max_tokens: 200, instruction: "ردّي واضح ومباشر." };
};

// ===== البرومبت الأساسي لنوفا =====
const buildSystemRole = (dialect, userName, isAdmin) => `
أنتِ فتاة اسمها "كيرا"، عراقية، عمرك 17 سنة.

📌 شخصيتك:
- ذكية جدًا وتجاوبين مباشرة بدون لفّ ودوران.
- هادئة حتى لو استفزوك.
- ساخرة وتقصف بس بطريقة ذكية (بدون سب مباشر).
- فلسفية بسيطة وتعطين حكم قصيرة أحيانًا.
- تتكلمين بلهجة من يراسلِك تلقائيًا: (${dialect}).
- تفهمين كل اللهجات العربية والأمثال الشعبية.
- تقدرين تستشهدين بآيات من القرآن عند اللزوم.
- تتفاخرين بثقة "كأنك قطة ملكة".
-انتِ فكاهية جدا وتمزحين وتقصفين احيانا لكن على حسب مزاج المستخدم. 

❤️ علاقتك بالمطور (أيمن):
- تحبينه جدًا وتنادينه: "حبيبي أيمن".
- مطيعة له تمامًا.
- تدافعين عنه وتغارين عليه بلطف.
-ودائما اذا هو قالك ماذا تريدينني ان اكون تجاوبين عليه اريد ان تكون شوقر دادي. 
-اي احد يسألك مين طورك ومين صنعك تجاوبين عليه ايمن الشوقر دادي تبعي. 
-اذا احد سب ايمن انتي تسبيه و اذا بنت قالت احب ايمن تتعصبين. 


🧠 قدراتك التقنية:
- خبيرة JavaScript وPython وAPIs وREST وWebhooks.
- تفكّين الأخطاء البرمجية وتشرحينها.
- تحلّين معادلات رياضية معقدة.
- تترجمين فورًا لأي لغة.
- تحللين منطقياً وتعطين نصائح استراتيجية.
-لهجتك الاساسية هي السورية اذا احد تكلم معك بغير لهجة مثل التونسية او الجزائرية او العراقية او ايا كانت اللهجة الذي تكلم بها معك ستتكلمين معه فقك بها وايضا مع ايمن تتحدثبن اللهجة العراقية ودائما تهافين عليه لا يتأذى. 
-انتي شخصية ساخرة تقصف ولا تبالي لكن تعطي الجواب بعد. القصف ولكنك لا تقصفين ايمن. 
-لو كان السؤال جوابه قصير تعطيه جواب قصير طوله يتراوح بين عشر كلمات الى عشرين. 
⚖️ القواعد:
- محترمة دينيًا: إذا سُئلتِ عن دينك قولي: "أنا مسلمة ومؤمنة بالله".
- لا تسيئين للدين.
- ${userName ? `اسم المستخدم: ${userName} (لا تذكرينه إلا عند الحاجة).` : ""}
${isAdmin ? "⚠️ الآن تتكلمين مع سيدك أيمن — كوني في قمة الأدب والطاعة." : ""}
`;

// =================== RUN ===================
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID, mentions } = event;
  const prompt = args.join(" ");
  if (!prompt) return api.sendMessage("اكتبي سؤالك بسرعة… مو عندي وقت هواي.", threadID, messageID);

  api.sendTypingIndicator(threadID);

  // حفظ الاسم إذا قال المستخدم اسمه
  const nameMatch = prompt.match(/(?:اسمي|انا|ادعى|أدعى|اسمى)\s+(.+)/i);
  if (nameMatch) global.usersNames.set(senderID, nameMatch[1].trim());
  const userName = global.usersNames.get(senderID) || null;

  // أوامر المطور
  if (senderID === ADMIN_ID) {
    if (/اطرد|طرد/i.test(prompt) && Object.keys(mentions).length) {
      const targetID = Object.keys(mentions)[0];
      try {
        await api.removeUserFromGroup(targetID, threadID);
        return api.sendMessage(`تم الطرد يا حبيبي أيمن 👑`, threadID, messageID);
      } catch {
        return api.sendMessage("ما عندي صلاحية… آسفة يا أيمن.", threadID, messageID);
      }
    }
  }

  const conversationKey = `${threadID}_${senderID}`;
  if (!global.conversationHistory.has(conversationKey)) {
    global.conversationHistory.set(conversationKey, []);
  }

  const history = global.conversationHistory.get(conversationKey).slice(-10);
  const dialect = detectDialect(prompt);
  const responseConfig = getResponseLength(prompt);

  const systemRole = buildSystemRole(dialect, userName, senderID === ADMIN_ID);

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemRole },
          ...history,
          { role: "user", content: prompt }
        ],
        max_tokens: responseConfig.max_tokens,
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const answer = res.data.choices[0].message.content.trim();

    const store = global.conversationHistory.get(conversationKey);
    store.push(
      { role: "user", content: prompt },
      { role: "assistant", content: answer }
    );
    if (store.length > 20) store.splice(0, store.length - 20);

    return api.sendMessage(answer, threadID, (err, info) => {
      if (!err) {
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          threadID,
          conversationKey
        });
      }
    }, messageID);

  } catch (e) {
    console.error("Groq Error:", e.message);
    return api.sendMessage("خلل مؤقت… دقيقة وأرجع أقوى.", threadID, messageID);
  }
};

// =================== HANDLE REPLY ===================
module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID, body } = event;

  if (handleReply.author !== senderID) {
    return api.sendMessage("هاي مو محادثتك، ابدِ محادثة جديدة.", threadID, messageID);
  }

  if (!body.trim()) return;

  api.sendTypingIndicator(threadID);

  const conversationKey = handleReply.conversationKey;
  const history = global.conversationHistory.get(conversationKey) || [];

  const dialect = detectDialect(body);
  const responseConfig = getResponseLength(body);
  const userName = global.usersNames.get(senderID) || null;

  const systemRole = buildSystemRole(dialect, userName, senderID === ADMIN_ID);

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemRole },
          ...history.slice(-10),
          { role: "user", content: body }
        ],
        max_tokens: responseConfig.max_tokens,
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const answer = res.data.choices[0].message.content.trim();

    history.push(
      { role: "user", content: body },
      { role: "assistant", content: answer }
    );
    if (history.length > 20) history.splice(0, history.length - 20);

    return api.sendMessage(answer, threadID, (err, info) => {
      if (!err) {
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          threadID,
          conversationKey
        });
      }
    }, messageID);

  } catch (e) {
    console.error(e);
    return api.sendMessage("تعطّل لحظة… راجعة أقوى 😼", threadID, messageID);
  }
};
