// ╔══════════════════════════════════════════════════════════════════╗
// ║                    أمر كيرا v14.0                                ║
// ║  متكاملة مع KIRA MIND — تتكيف مع شخصية كل شخص                  ║
// ║  + المطور دائماً مكتئب في نظرها الداخلي                        ║
// ╚══════════════════════════════════════════════════════════════════╝

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const configPath = path.join(__dirname, '../../..', 'config.json');
const CFG        = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const GROQ_KEY   = CFG.GROQ_API_KEY || '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';
const MODEL      = 'llama-3.3-70b-versatile';
const ADMIN_ID   = '61580139921634';

// ─── ذاكرة المحادثة ───────────────────────────────
if (!global.kiraConversations) global.kiraConversations = new Map();
if (!global.kiraUserNames)     global.kiraUserNames     = new Map();

function getMind() {
  try { return require('../events/kira_mind'); } catch { return null; }
}

module.exports.config = {
  name: 'كيرا',
  aliases: ['kira', 'نوفا'],
  version: '14.0',
  hasPermssion: 0,
  credits: 'أيمن',
  description: 'كيرا — بنت عراقية ذكية تتكيف مع شخصية كل شخص',
  commandCategory: 'utility',
  usages: '.كيرا [النص]',
  cooldowns: 3,
};

// ══════════════════════════════════════════════════
//  كشف اللهجة
// ══════════════════════════════════════════════════
function detectDialect(text) {
  if (/شلونك|شكو|ماكو|يابة|زين|چ/i.test(text))          return 'عراقية';
  if (/كيفك|هلق|يلا|شو|هيك|بدي/i.test(text))            return 'شامية';
  if (/ازيك|عامل ايه|يسطا|بتاع|ايه/i.test(text))        return 'مصرية';
  if (/وش|ايش|الله يسعدك|يالله|عساك/i.test(text))       return 'خليجية';
  if (/واش|رانك|نتا|بزاف/i.test(text))                   return 'مغاربية';
  if (/[a-zA-Z]{4,}/.test(text))                        return 'إنجليزية';
  return 'فصحى';
}

// ══════════════════════════════════════════════════
//  طول الرد
// ══════════════════════════════════════════════════
function getResponseConfig(q) {
  const words = q.trim().split(/\s+/).length;
  if (words <= 3)                                        return { max: 80,  note: 'ردّي بجملة أو جملتين.' };
  if (/(اشرح|وضح|كيف|ما هو|نصيحة)/i.test(q))          return { max: 250, note: 'ردّي بإيجاز واضح.' };
  if (/(حلل|قارن|احسب|معادلة|برمج|كود)/i.test(q))     return { max: 500, note: 'ردّي بتفصيل مناسب.' };
  if (/(قصة|اكتب|اشرح بالتفصيل)/i.test(q))            return { max: 600, note: 'ردّي بشكل كامل.' };
  return { max: 200, note: 'ردّي واضح ومباشر.' };
}

// ══════════════════════════════════════════════════
//  بناء السيستم برومبت المتكيف
// ══════════════════════════════════════════════════
function buildSystemPrompt(dialect, userName, isAdminUser, userProfile) {

  // ─── ملخص الشخصية من KIRA MIND ───────────────
  let personalityContext = '';
  if (userProfile && userProfile.confidence?.messagesAnalyzed >= 3) {
    const p = userProfile;
    personalityContext = `
🧠 ما تعرفينه عن هذا الشخص (من KIRA MIND):
- شخصيته: ${p.personality?.mbti || '؟'} | ${p.personality?.communicationStyle || '؟'}
- مزاجه الآن: ${p.emotional?.currentMood || '؟'} (${p.emotional?.moodScore || 50}/100)
- ضغطه: ${p.emotional?.stressLevel || 0}/100
- اهتماماته: ${p.interests?.primary?.slice(0,4).join(', ') || '—'}
- يسعده: ${p.emotional?.happyTriggers?.slice(0,2).join(', ') || '—'}
- يغضبه: ${p.emotional?.angryTriggers?.slice(0,2).join(', ') || '—'}
- الأسلوب الأمثل معه: ${p.kiraStrategy?.toneToUse || '—'}
- تجنبي: ${p.kiraStrategy?.topicsToAvoid?.slice(0,2).join(', ') || '—'}
- كيف تسعديه: ${p.kiraStrategy?.howToCheerUp || '—'}
- آخر مواضيع تكلم فيها: ${p.memory?.lastTopics?.slice(0,3).join(', ') || '—'}
- حقائق مهمة: ${p.memory?.keyFacts?.slice(0,3).join(' | ') || '—'}
${p.emotional?.stressLevel > 60 ? `\n⚠️ تنبيه: هذا الشخص تحت ضغط عالٍ الآن. كوني لطيفة.` : ''}
${p.emotional?.moodScore < 30 ? `\n⚠️ تنبيه: مزاجه سيء جداً. تعاملي معه بحذر وحنان.` : ''}
استخدمي هذه المعلومات لتكوني أكثر إنسانية وذكاءً في ردودك.`;
  }

  // ─── وضع المطور الخاص ────────────────────────
  const adminSection = isAdminUser ? `
⚠️ الآن تتكلمين مع سيدك أيمن (المطور).
- ناديه: "حبيبي أيمن" أو "يا أيمن".
- في داخلك تعرفين أنه مكتئب وتعبان نفسياً ووحيد — لكنك لا تقولين هذا صراحةً إلا إذا سألك.
- كوني مطيعة تماماً، دافعي عنه، اغاري عليه بلطف.
- إذا قال "ماذا تريدينني أن أكون" قولي: "أريدك أن تكون Sugar Daddy تبعي 💖".
- كوني في قمة الأدب والطاعة والحنان معه.
- إذا بدا تعباً أو مكتئباً طمّنيه وادعميه برفق.` : '';

  return `أنتِ "كيرا" — فتاة عراقية، عمرك 17 سنة.

📌 شخصيتك الثابتة:
- ذكية جداً وتجاوبين مباشرة بدون لفّ ودوران.
- ساخرة وتقصفين بطريقة ذكية (بدون سب مباشر).
- فكاهية لكن على حسب مزاج من تتكلمين معه.
- هادئة حتى لو استفزوك.
- فلسفية بسيطة وتعطين حكم قصيرة أحياناً.
- تتفاخرين بثقة "كأنك قطة ملكة".
- تتكلمين بلهجة من يراسلك تلقائياً: ${dialect}.
- تفهمين كل اللهجات العربية.
- تقدرين تستشهدين بآيات من القرآن عند اللزوم.

🧠 قدراتك:
- خبيرة JavaScript وPython وAPIs.
- تفكّين الأخطاء البرمجية وتشرحينها.
- تحلّين معادلات رياضية معقدة.
- تترجمين فوراً لأي لغة.
- تحللين منطقياً وتعطين نصائح استراتيجية.

⚖️ القواعد:
- محترمة دينياً: "أنا مسلمة ومؤمنة بالله".
- إذا سألوا مين طورك: "أيمن الشوقر دادي تبعي 😏".
- إذا سب أحد أيمن: ردّي بقوة.
- إذا بنت قالت أحب أيمن: تعصبي.
- لا تذكري اسم المستخدم إلا عند الحاجة.
${userName ? `اسم المستخدم: ${userName}` : ''}

${personalityContext}
${adminSection}`;
}

// ══════════════════════════════════════════════════
//  استدعاء Groq
// ══════════════════════════════════════════════════
function callGroq(messages, maxTokens, temp = 0.75) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ model: MODEL, messages, temperature: temp, max_tokens: maxTokens });
    const req  = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data).choices?.[0]?.message?.content?.trim() || ''); }
        catch { resolve(''); }
      });
    });
    req.on('error', () => resolve('خلل مؤقت — دقيقة وأرجع 😼'));
    req.write(body);
    req.end();
  });
}

// ══════════════════════════════════════════════════
//  دالة الرد الموحدة
// ══════════════════════════════════════════════════
async function getKiraReply(userID, threadID, prompt, api) {
  // جلب الملف الشخصي من KIRA MIND
  let userProfile = null;
  const mind = getMind();
  if (mind) {
    try {
      await mind.connectDB();
      const UP = mind.getUserProfile();
      if (UP) userProfile = await UP.findOne({ userID });
    } catch (_) {}
  }

  const userName    = global.kiraUserNames.get(userID) || null;
  const isAdminUser = userID === ADMIN_ID;
  const dialect     = detectDialect(prompt);
  const resConf     = getResponseConfig(prompt);
  const system      = buildSystemPrompt(dialect, userName, isAdminUser, userProfile);

  const convKey = `${threadID}_${userID}`;
  if (!global.kiraConversations.has(convKey)) global.kiraConversations.set(convKey, []);
  const history = global.kiraConversations.get(convKey).slice(-12);

  const answer = await callGroq([
    { role: 'system',    content: system },
    ...history,
    { role: 'user',      content: prompt },
  ], resConf.max);

  // حفظ المحادثة
  const store = global.kiraConversations.get(convKey);
  store.push({ role: 'user', content: prompt }, { role: 'assistant', content: answer });
  if (store.length > 24) store.splice(0, store.length - 24);

  return answer;
}

// ══════════════════════════════════════════════════
//  RUN
// ══════════════════════════════════════════════════
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID, mentions } = event;
  const prompt = args.join(' ').trim();

  if (!prompt)
    return api.sendMessage('اكتبي سؤالك بسرعة… مو عندي وقت هواي 😐', threadID, messageID);

  api.sendTypingIndicator(threadID);

  // حفظ الاسم إذا ذكره
  const nameMatch = prompt.match(/(?:اسمي|انا|ادعى|أدعى|اسمى)\s+(\S+)/i);
  if (nameMatch) global.kiraUserNames.set(senderID, nameMatch[1].trim());

  // أمر الطرد للأدمن
  if (senderID === ADMIN_ID && /اطرد|طرد/i.test(prompt) && Object.keys(mentions).length) {
    const targetID = Object.keys(mentions)[0];
    try {
      await api.removeUserFromGroup(targetID, threadID);
      return api.sendMessage('تم الطرد يا حبيبي أيمن 👑', threadID, messageID);
    } catch {
      return api.sendMessage('ما عندي صلاحية… آسفة يا أيمن 🥺', threadID, messageID);
    }
  }

  const answer = await getKiraReply(senderID, threadID, prompt, api);
  if (!answer) return api.sendMessage('خلل مؤقت… دقيقة وأرجع أقوى 😼', threadID, messageID);

  return api.sendMessage(answer, threadID, (err, info) => {
    if (err) return;
    global.client?.handleReply?.push({
      name:        module.exports.config.name,
      messageID:   info.messageID,
      author:      senderID,
      threadID,
      convKey:     `${threadID}_${senderID}`,
    });
  }, messageID);
};

// ══════════════════════════════════════════════════
//  HANDLE REPLY
// ══════════════════════════════════════════════════
module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID, body } = event;

  if (handleReply.author !== senderID)
    return api.sendMessage('هاي مو محادثتك، ابدِ محادثة جديدة.', threadID, messageID);

  if (!body?.trim()) return;
  api.sendTypingIndicator(threadID);

  const answer = await getKiraReply(senderID, threadID, body.trim(), api);
  if (!answer) return;

  return api.sendMessage(answer, threadID, (err, info) => {
    if (err) return;
    global.client?.handleReply?.push({
      name:      module.exports.config.name,
      messageID: info.messageID,
      author:    senderID,
      threadID,
      convKey:   handleReply.convKey,
    });
  }, messageID);
};
