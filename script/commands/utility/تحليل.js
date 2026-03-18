
// ╔══════════════════════════════════════════════════════════════════╗
// ║                   أمر .تحليل — KIRA MIND v4.0                   ║
// ║  تحليل كامل أو مختصر، يدعم منشن / رد / ID / اسم               ║
// ╚══════════════════════════════════════════════════════════════════╝

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const configPath = path.join(__dirname, '../../..', 'config.json');
const CFG        = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const GROQ_KEY   = CFG.GROQ_API_KEY || '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';
const MODEL      = 'llama-3.3-70b-versatile';

function getMind() {
  try { return require('../events/kira_mind'); } catch { return null; }
}

module.exports.config = {
  name: 'تحليل',
  aliases: ['mind', 'شخصية', 'profile', 'تحليلي'],
  version: '4.0.0',
  credits: 'ayman',
  description: 'تحليل شخصية عميق من KIRA MIND',
  usage: `.تحليل             ← ملخص الجميع
.تحليل @منشن        ← تحليل كامل
.تحليل (رد)         ← تحليل صاحب المسج
.تحليل [ID/اسم]     ← بحث
.تحليلي             ← تحليلك أنت
.تحليل حقيقي        ← تحليل المطور الحقيقي بدون تزيين`,
  cooldown: 5,
  permissions: [],
  category: 'utility',
};

// ── Groq مباشر ────────────────────────────────────
async function callGroq(messages, maxTokens = 800, temp = 0.7) {
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
        try { resolve(JSON.parse(data).choices?.[0]?.message?.content || ''); }
        catch { resolve(''); }
      });
    });
    req.on('error', () => resolve(''));
    req.write(body);
    req.end();
  });
}

// ── بناء التحليل العميق عبر Groq ─────────────────
async function buildDeepInsight(profile, isTrueMode = false) {
  const p = profile;

  const systemPrompt = isTrueMode
    ? `أنت محلل نفسي صادق بلا رحمة. مهمتك: تحليل حقيقي وعميق بدون تزيين أو مجاملة. اكشف الحقيقة المؤلمة إن وُجدت.`
    : `أنت كيرا، محللة نفسية ذكية وحاذقة. قدّمي تحليلاً عميقاً وذكياً مع لمسة إنسانية.`;

  const userPrompt = `
الشخص: ${p.name} ${p.isAdmin ? '(المطور — أيمن)' : ''}
MBTI: ${p.personality?.mbti || '؟'}
الاهتمامات: ${p.interests?.primary?.slice(0,6).join(', ')}
الخفية: ${p.interests?.hidden?.join(', ')||'—'}
الأحلام: ${p.interests?.dreams?.join(', ')||'—'}
المخاوف: ${p.interests?.fears?.join(', ')||'—'}
نقاط الضعف: ${p.personality?.darkTraits?.join(', ')||'—'}
القيم: ${p.personality?.coreValues?.join(', ')||'—'}
المزاج: ${p.emotional?.currentMood} (${p.emotional?.moodScore}/100)
الضغط: ${p.emotional?.stressLevel}/100
تقدير الذات: ${p.emotional?.selfEsteem||'—'}/100
الصحة النفسية: ${p.emotional?.mentalHealthNotes?.slice(0,4).join(' | ')||'—'}
${p.isAdmin && isTrueMode ? `تحذيرات: ${p.emotional?.suicidalHints?.join(' | ')||'لا يوجد'}` : ''}
أشخاص مهمون: ${p.lifeContext?.importantPeople?.slice(0,4).map(pp=>`${pp.name}(${pp.sentiment})`).join(', ')||'—'}
حقائق: ${p.memory?.keyFacts?.slice(0,5).join(' | ')||'—'}
آراؤه: ${p.memory?.opinionsOnTopics?.slice(0,4).map(o=>`${o.topic}:${o.opinion}`).join(' | ')||'—'}
مواضيع متكررة: ${p.memory?.repetitiveThemes?.join(', ')||'—'}
رسائل محللة: ${p.confidence?.messagesAnalyzed}

${isTrueMode
  ? 'اكتب تحليلاً صريحاً وحقيقياً بالكامل. لا تخفِ شيئاً. اكشف ما يحاول إخفاءه عن نفسه. كن قاسياً إن لزم.'
  : 'اكتب تحليلاً نفسياً عميقاً وذكياً (6-8 أسطر) يجمع كل هذا ويكشف عن شخصيته الحقيقية.'}`;

  return await callGroq([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], 800, isTrueMode ? 0.3 : 0.7);
}

// ══════════════════════════════════════════════════
//  RUN
// ══════════════════════════════════════════════════
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  const mind = getMind();
  if (!mind) return api.sendMessage('⚠️ kira_mind.js غير موجود في events.', threadID, messageID);

  await mind.connectDB();
  const UserProfile = mind.getUserProfile();
  if (!UserProfile) return api.sendMessage('⚠️ MongoDB غير متصل.', threadID, messageID);

  const ADMIN_ID  = mind.ADMIN_ID;
  const isAdmin   = senderID === ADMIN_ID;
  const inputText = args.join(' ').trim();

  // ── .تحليلي — تحليل الشخص نفسه ─────────────────
  const isSelf = event.body?.trim().startsWith(`${global.client?.config?.PREFIX||'.'}تحليلي`)
    || inputText === '' && !Object.keys(mentions||{}).length && !messageReply;

  if (isSelf && inputText === '' && !Object.keys(mentions||{}).length && !messageReply) {
    // تحقق من اسم الأمر المستخدم
  }

  // ── .تحليل حقيقي — للمطور فقط ──────────────────
  const isTrueMode = inputText === 'حقيقي';
  if (isTrueMode && !isAdmin)
    return api.sendMessage('❌ هذا الأمر للمطور فقط.', threadID, messageID);

  try {

    // ════ حالة: .تحليل بدون شيء = ملخص الجميع ═════
    if (!inputText && !Object.keys(mentions||{}).length && !messageReply && !isSelf) {
      const profiles = await UserProfile.find({ totalMessages: { $gte: 3 } })
        .sort({ lastSeen: -1 }).limit(20);

      if (!profiles.length)
        return api.sendMessage('📭 لا يوجد بيانات بعد.', threadID, messageID);

      const lines = profiles.map((p, i) => {
        const mood   = p.emotional?.currentMood || '—';
        const stress = p.emotional?.stressLevel || 0;
        const top3   = p.interests?.primary?.slice(0,3).join(', ') || '—';
        const mbti   = p.personality?.mbti || '؟';
        const conf   = p.confidence?.overall || 0;
        const n      = p.confidence?.messagesAnalyzed || 0;
        return `${i+1}. 👤 ${p.name}\n   ${mbti} | ${mood} | ضغط: ${stress}% | ${top3}\n   📊 ${n} رسالة | دقة: ${conf}%`;
      });

      return api.sendMessage(
        `🧠 KIRA MIND — ملخص الأعضاء (${profiles.length})\n━━━━━━━━━━━━━━━━━━━\n${lines.join('\n\n')}\n━━━━━━━━━━━━━━━━━━━\n💡 .تحليل @شخص للتفاصيل`,
        threadID, messageID
      );
    }

    // ════ تحديد الشخص المستهدف ═════════════════════
    let targetID   = null;
    let targetName = null;

    // منشن
    const mentionedIDs = Object.keys(mentions||{});
    if (mentionedIDs.length) {
      targetID   = mentionedIDs[0];
      targetName = mentions[targetID];
    }
    // رد على رسالة
    else if (messageReply) {
      targetID = messageReply.senderID;
      try {
        const info = await api.getUserInfo(targetID);
        targetName = info[targetID]?.name;
      } catch (_) {}
    }
    // حقيقي = المطور نفسه
    else if (isTrueMode) {
      targetID = ADMIN_ID;
    }
    // بحث بالاسم أو ID
    else if (inputText && inputText !== 'حقيقي') {
      const found = await mind.findUser(inputText);
      if (found) { targetID = found.userID; targetName = found.name; }
      else return api.sendMessage(`🔍 ما لقيت: "${inputText}"`, threadID, messageID);
    }
    // نفسه
    else {
      targetID = senderID;
    }

    // ════ جلب الملف الشخصي ═════════════════════════
    const profile = await UserProfile.findOne({ userID: targetID });

    if (!profile || (profile.confidence?.messagesAnalyzed || 0) < 2)
      return api.sendMessage(
        `📭 ما عندي بيانات كافية عن ${targetName||targetID}.\nكيرا تحتاج رسائل أكثر.`,
        threadID, messageID
      );

    // ════ بناء التقرير ═════════════════════════════
    // للمطور عرض قسم الصحة النفسية دائماً
    const showAdmin = isAdmin || profile.isAdmin;
    const report    = mind.formatFullReport(profile, showAdmin);
    const insight   = await buildDeepInsight(profile, isTrueMode);

    const modeLabel = isTrueMode ? '🔴 التحليل الحقيقي (بدون تزيين)' : '🔮 تحليل كيرا العميق';

    return api.sendMessage(
      `${report}\n\n━━━━━━━━ ${modeLabel} ━━━━━━━━\n${insight || 'لا يوجد تحليل إضافي بعد.'}`,
      threadID, messageID
    );

  } catch (err) {
    console.error('[.تحليل] ❌', err.message);
    return api.sendMessage(`⚠️ خطأ: ${err.message}`, threadID, messageID);
  }
};
