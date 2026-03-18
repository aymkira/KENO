// ╔══════════════════════════════════════════════════════════════════╗
// ║                   أمر .تحليل — KIRA MIND v4.0                   ║
// ║  تحليل كامل أو مختصر، يدعم منشن / رد / ID / اسم               ║
// ╚══════════════════════════════════════════════════════════════════╝

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// قراءة config بطريقة آمنة
function loadConfig() {
  const paths = [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(__dirname, '../../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ];
  for (const p of paths) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) {}
  }
  return {};
}
const CFG      = loadConfig();
const GROQ_KEY = CFG.GROQ_API_KEY || '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';
const MODEL    = 'llama-3.3-70b-versatile';
const ADMIN_ID = '61580139921634';

// جلب kira_mind من مسارات مختلفة
function getMind() {
  const tries = [
    () => require('../events/kira_mind'),
    () => require('../../events/kira_mind'),
    () => require(path.join(process.cwd(), 'script/events/kira_mind')),
  ];
  for (const t of tries) {
    try { return t(); } catch (_) {}
  }
  return null;
}

// ══════════════════════════════════════════════════
//  config — بصيغة هذا البوت
// ══════════════════════════════════════════════════
module.exports.config = {
  name: 'تحليل',
  aliases: ['mind', 'شخصية', 'profile', 'تحليلي'],
  version: '4.0.0',
  hasPermssion: 0,
  credits: 'ayman',
  description: 'تحليل شخصية عميق من KIRA MIND',
  commandCategory: 'utility',
  usages: '.تحليل / .تحليل @شخص / .تحليل حقيقي',
  cooldowns: 5,
};

// ── Groq ──────────────────────────────────────────
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

async function buildDeepInsight(profile, isTrueMode = false) {
  const p = profile;
  const sys = isTrueMode
    ? `أنت محلل نفسي صادق بلا رحمة. حلّل بصدق تام بدون تزيين. اكشف الحقيقة المؤلمة.`
    : `أنت كيرا، محللة نفسية ذكية. قدّمي تحليلاً عميقاً وذكياً مع لمسة إنسانية.`;

  const usr = `الشخص: ${p.name}${p.isAdmin?' (المطور أيمن)':''}
MBTI: ${p.personality?.mbti||'؟'} | المزاج: ${p.emotional?.currentMood} (${p.emotional?.moodScore}/100)
الضغط: ${p.emotional?.stressLevel}/100 | تقدير الذات: ${p.emotional?.selfEsteem||'—'}/100
الاهتمامات: ${p.interests?.primary?.slice(0,5).join(', ')||'—'}
الخفية: ${p.interests?.hidden?.join(', ')||'—'}
المخاوف: ${p.interests?.fears?.join(', ')||'—'}
نقاط الضعف: ${p.personality?.darkTraits?.join(', ')||'—'}
الصحة النفسية: ${p.emotional?.mentalHealthNotes?.slice(0,3).join(' | ')||'—'}
حقائق: ${p.memory?.keyFacts?.slice(0,4).join(' | ')||'—'}
رسائل محللة: ${p.confidence?.messagesAnalyzed}

${isTrueMode?'اكتب تحليلاً صريحاً وحقيقياً بدون رحمة. لا تخفِ شيئاً.':'اكتب تحليلاً نفسياً عميقاً (6-8 أسطر).'}`;

  return await callGroq([{ role:'system', content:sys },{ role:'user', content:usr }], 800, isTrueMode?0.3:0.7);
}

// ══════════════════════════════════════════════════
//  RUN
// ══════════════════════════════════════════════════
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  // جلب mind
  const mind = getMind();
  if (!mind) return api.sendMessage(
`╔══════════════════════════╗
║  ⚠️ KIRA MIND غير متاح  ║
╚══════════════════════════╝

تأكد من وجود الملف:
script/events/kira_mind.js`, threadID, messageID);

  await mind.connectDB();
  const UserProfile = mind.getUserProfile();
  if (!UserProfile) return api.sendMessage('⚠️ MongoDB غير متصل.', threadID, messageID);

  const isAdmin    = senderID === ADMIN_ID;
  const inputText  = args.join(' ').trim();
  const cmdUsed    = (event.body||'').trim().split(' ')[0].replace(/^\./,'');
  const isSelf     = cmdUsed === 'تحليلي';
  const isTrueMode = inputText === 'حقيقي';

  if (isTrueMode && !isAdmin)
    return api.sendMessage('❌ هذا الأمر للمطور فقط.', threadID, messageID);

  try {
    // ── بدون شيء = ملخص الجميع ───────────────────
    if (!inputText && !Object.keys(mentions||{}).length && !messageReply && !isSelf) {
      const profiles = await UserProfile.find({ totalMessages: { $gte: 3 } })
        .sort({ lastSeen: -1 }).limit(20);

      if (!profiles.length) return api.sendMessage(
`╔══════════════════════════╗
║   🧠 KIRA MIND            ║
╚══════════════════════════╝
📭 لا يوجد بيانات بعد.
كيرا تحتاج تسمع رسائل الأعضاء أولاً.`, threadID, messageID);

      const lines = profiles.map((p, i) =>
        `${i+1}. 👤 ${p.name} | ${p.personality?.mbti||'؟'} | ${p.emotional?.currentMood||'—'} | ضغط: ${p.emotional?.stressLevel||0}%\n   ${p.interests?.primary?.slice(0,3).join(', ')||'—'} | ${p.confidence?.messagesAnalyzed||0} رسالة`
      );

      return api.sendMessage(
`╔══════════════════════════╗
║  🧠 KIRA MIND — الأعضاء  ║
╚══════════════════════════╝

${lines.join('\n\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 .تحليل @شخص للتفاصيل`, threadID, messageID);
    }

    // ── تحديد الشخص ──────────────────────────────
    let targetID = null, targetName = null;
    const mentionedIDs = Object.keys(mentions||{});

    if (mentionedIDs.length) {
      targetID = mentionedIDs[0]; targetName = mentions[targetID];
    } else if (messageReply) {
      targetID = messageReply.senderID;
      try { const i = await api.getUserInfo(targetID); targetName = i[targetID]?.name; } catch(_){}
    } else if (isTrueMode || isSelf || !inputText) {
      targetID = isTrueMode ? ADMIN_ID : senderID;
    } else {
      const found = await mind.findUser(inputText);
      if (found) { targetID = found.userID; targetName = found.name; }
      else return api.sendMessage(`🔍 ما لقيت: "${inputText}"`, threadID, messageID);
    }

    // ── جلب الملف ────────────────────────────────
    const profile = await UserProfile.findOne({ userID: targetID });
    if (!profile || (profile.confidence?.messagesAnalyzed||0) < 2)
      return api.sendMessage(
`╔══════════════════════════╗
║   🧠 KIRA MIND            ║
╚══════════════════════════╝
📭 ما عندي بيانات كافية عن ${targetName||targetID}.
كيرا تحتاج على الأقل 5 رسائل منه.`, threadID, messageID);

    // ── التقرير ───────────────────────────────────
    const showAdmin = isAdmin || profile.isAdmin;
    const report    = mind.formatFullReport(profile, showAdmin);
    const insight   = await buildDeepInsight(profile, isTrueMode);
    const lbl       = isTrueMode ? '🔴 التحليل الحقيقي (بدون تزيين)' : '🔮 تحليل كيرا العميق';

    return api.sendMessage(`${report}\n\n━━━━━━━━ ${lbl} ━━━━━━━━\n${insight||'لا يوجد تحليل إضافي.'}`, threadID, messageID);

  } catch (err) {
    console.error('[.تحليل] ❌', err.message);
    return api.sendMessage(`⚠️ خطأ: ${err.message}`, threadID, messageID);
  }
};
