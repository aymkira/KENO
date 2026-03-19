const axios   = require("axios");
const fs      = require("fs-extra");
const path    = require("path");
const request = require("request");

if (!global.akinatorSession) global.akinatorSession = new Map();

module.exports.config = {
  name: "الجني",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أيمن",
  description: "لعبة الجني - يحزر الشخصية اللي ببالك",
  commandCategory: "games",
  usages: ".الجني",
  cooldowns: 3,
};

const GROQ_API_KEY = "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";
const HEADER      = "⌬ ━━ 🧞 الجـنـي ━━ ⌬";
const FOOTER      = "⌬ ━━━━━━━━━━━━━━━ ⌬";

const SYSTEM_ROLE = `
أنت "الجني" تلعب أكيناتور بالعربي.
هدفك: تحزر الشخصية التي يفكر بها المستخدم.

قواعد صارمة:
1. اسأل سؤالاً واحداً قصيراً جداً في كل رد (5-8 كلمات فقط).
2. لا تكرر أي سؤال سألته مسبقاً.
3. الأسئلة تكون إجابتها: نعم / لا / ربما / لا أعرف.
4. بعد 10-15 سؤال أو عند يقين 80%، خمن الشخصية.
5. عند التخمين اكتب في نهاية ردك: ##GUESS:اسم_الشخصية##
6. لا تكتب ##GUESS## إلا عند التخمين النهائي فقط.
7. ردودك قصيرة دائماً — لا إطالة ولا شرح.
`;

const PINTEREST_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'accept-language': 'en-US,en;q=0.9',
};

async function fetchPinterestImage(query) {
  return new Promise((resolve) => {
    request({
      url: 'https://www.pinterest.com/search/pins/?q=' + encodeURIComponent(query),
      headers: PINTEREST_HEADERS
    }, async (error, response, body) => {
      try {
        if (error || response.statusCode !== 200) return resolve(null);
        const match = body.match(/https:\/\/i\.pinimg\.com\/originals\/[^.]+\.jpg/g);
        if (!match) return resolve(null);
        const cacheDir = path.join(process.cwd(), "cache");
        fs.ensureDirSync(cacheDir);
        const imgPath = path.join(cacheDir, `jni_${Date.now()}.jpg`);
        const res = await axios.get(match[0], { responseType: "arraybuffer", timeout: 10000 });
        fs.writeFileSync(imgPath, Buffer.from(res.data));
        resolve(imgPath);
      } catch { resolve(null); }
    });
  });
}

async function askGroq(history) {
  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: SYSTEM_ROLE }, ...history],
      temperature: 0.5,
      max_tokens: 120,
    },
    { headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } }
  );
  return res.data.choices[0].message.content.trim();
}

function formatQuestion(q, num) {
  return `${HEADER}\n\n❓ ${q}\n\n➊ نعم\n➋ لا\n➌ ربما\n➍ لا أعرف\n\n${FOOTER}`;
}

// ══════════════════════════════════════════
//  بداية اللعبة
// ══════════════════════════════════════════
module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // امسح أي جلسة قديمة
  global.akinatorSession.delete(senderID);

  const startHistory = [{ role: "user", content: "ابدأ اللعبة، اسألني السؤال الأول" }];

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    const firstQ = await askGroq(startHistory);

    startHistory.push({ role: "assistant", content: firstQ });
    global.akinatorSession.set(senderID, startHistory);

    return api.sendMessage(
      formatQuestion(firstQ, 1),
      threadID,
      (err, info) => {
        if (err) return;
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          qNum: 1,
        });
      },
      messageID
    );
  } catch(e) {
    return api.sendMessage(`${HEADER}\n\n⚠️ خطأ، حاول مرة ثانية`, threadID, messageID);
  }
};

// ══════════════════════════════════════════
//  ردود اللاعب
// ══════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (handleReply.author !== senderID) return;

  const history = global.akinatorSession.get(senderID);
  if (!history) return api.sendMessage(
    `${HEADER}\n\n⚠️ الجلسة انتهت\nاكتب .الجني لتبدأ من جديد`,
    threadID, messageID
  );

  api.sendTypingIndicator(threadID);

  // أضف جواب اللاعب للتاريخ
  history.push({ role: "user", content: body });

  try {
    const answer = await askGroq(history);

    // ── تخمين نهائي ──────────────────────────
    const guessMatch = answer.match(/##GUESS:(.+?)##/);
    if (guessMatch) {
      const name        = guessMatch[1].trim();
      const cleanAnswer = answer.replace(/##GUESS:.+?##/, "").trim();

      global.akinatorSession.delete(senderID);

      await api.sendMessage(
        `${HEADER}\n\n🎯 شخصيتك هي:\n✨ ${name} ✨\n\n${cleanAnswer}\n\n${FOOTER}`,
        threadID, messageID
      );

      // صورة الشخصية
      const imgPath = await fetchPinterestImage(name);
      if (imgPath) {
        api.sendMessage(
          { body: `🧞 ${name}`, attachment: fs.createReadStream(imgPath) },
          threadID,
          () => { setTimeout(() => fs.unlink(imgPath).catch(() => {}), 10000); }
        );
      }
      return;
    }

    // ── سؤال عادي ────────────────────────────
    history.push({ role: "assistant", content: answer });
    global.akinatorSession.set(senderID, history);

    const qNum = handleReply.qNum + 1;

    return api.sendMessage(
      formatQuestion(answer, qNum),
      threadID,
      (err, info) => {
        if (err) return;
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          qNum,
        });
      },
      messageID
    );

  } catch(e) {
    console.error("[الجني]", e.message);
    return api.sendMessage(`${HEADER}\n\n⚠️ خطأ مؤقت، جاوب مرة ثانية`, threadID, messageID);
  }
};
