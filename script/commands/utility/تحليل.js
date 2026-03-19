const https = require('https');
const fs    = require('fs');
const path  = require('path');

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}
const CFG      = loadConfig();
const GROQ_KEY = CFG.GROQ_API_KEY || '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';
const MODEL    = 'llama-3.3-70b-versatile';
const ADMIN_ID = '61580139921634';

function getMind() {
  for (const t of [
    () => require('../events/kira_mind'),
    () => require(path.join(process.cwd(), 'script/events/kira_mind')),
  ]) { try { return t(); } catch(_){} }
  return null;
}

function getDB() {
  try { return require(path.join(process.cwd(), 'includes', 'data.js')); }
  catch { return null; }
}

module.exports.config = {
  name: 'تحليل',
  aliases: ['mind', 'شخصية', 'تحليلي'],
  version: '5.0.0',
  hasPermssion: 0,
  credits: 'ayman',
  description: 'تحليل شخصية من KIRA MIND',
  commandCategory: 'utility',
  usages: '.تحليل / .تحليل @شخص / .تحليل حقيقي',
  cooldowns: 5,
};

async function deepInsight(p, trueMode) {
  const sys = trueMode
    ? 'محلل صادق بلا رحمة. اكشف الحقيقة المؤلمة بدون تزيين.'
    : 'أنت كيرا، محللة نفسية ذكية. قدمي تحليلاً عميقاً وإنسانياً (6 أسطر).';

  const usr =
`${p.name}${p.isAdmin ? ' (أيمن/المطور)' : ''}
MBTI:${p.mbti||'؟'} | مزاج:${p.mood}(${p.moodScore}/100) | ضغط:${p.stress}%
اهتمامات: ${(p.interests||[]).slice(0,5).join(', ')||'—'}
خفية: ${(p.hiddenInt||[]).join(', ')||'—'}
مخاوف: ${(p.fears||[]).join(', ')||'—'}
أحلام: ${(p.dreams||[]).join(', ')||'—'}
نقاط ضعف: ${(p.darkTraits||[]).join(', ')||'—'}
نفسي: ${(p.mentalNotes||[]).slice(0,3).join(' | ')||'—'}
حقائق: ${(p.keyFacts||[]).slice(0,4).join(' | ')||'—'}
رسائل: ${p.totalMessages||0}`;

  return new Promise(resolve => {
    const body = JSON.stringify({
      model: MODEL,
      messages: [{ role:'system', content:sys }, { role:'user', content:usr }],
      temperature: trueMode ? 0.3 : 0.7,
      max_tokens: 600,
    });
    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).choices?.[0]?.message?.content || ''); }
        catch { resolve(''); }
      });
    });
    req.on('error', () => resolve(''));
    req.write(body);
    req.end();
  });
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, messageReply, body } = event;

  const mind = getMind();
  const db   = getDB();
  if (!mind || !db) return api.sendMessage('⚠️ kira_mind.js أو data.js مو موجود', threadID, messageID);

  const isAdmin    = String(senderID) === ADMIN_ID;
  const inputText  = args.join(' ').trim();
  const cmdUsed    = (body||'').trim().split(' ')[0].replace(/^\./,'');
  const isSelf     = cmdUsed === 'تحليلي';
  const isTrueMode = inputText === 'حقيقي';

  if (isTrueMode && !isAdmin)
    return api.sendMessage('❌ للمطور فقط.', threadID, messageID);

  // ── بدون شيء = ملخص الجميع ────────────────────
  if (!inputText && !Object.keys(mentions||{}).length && !messageReply && !isSelf) {
    const wait = await api.sendMessage('⏳...', threadID);
    const all  = await db.getAllUsers();
    api.unsendMessage(wait.messageID);

    const valid = all.filter(u => u.totalMessages >= 3).sort((a,b) => (b.totalMessages||0)-(a.totalMessages||0)).slice(0,15);
    if (!valid.length) return api.sendMessage('📭 لا يوجد بيانات بعد', threadID, messageID);

    const lines = valid.map((p, i) =>
      `${i+1}. ${mind.formatShort(p)}`
    );
    return api.sendMessage(
      `🧠 KIRA MIND (${valid.length} عضو)\n━━━━━━━━━━━━\n${lines.join('\n')}\n\n💡 .تحليل @شخص للتفاصيل`,
      threadID, messageID
    );
  }

  // ── تحديد الهدف ───────────────────────────────
  const mentionIDs = Object.keys(mentions||{});
  let targetID;

  if (mentionIDs.length)                         targetID = mentionIDs[0];
  else if (messageReply)                         targetID = messageReply.senderID;
  else if (isTrueMode)                           targetID = ADMIN_ID;
  else if (isSelf)                               targetID = senderID;
  else if (inputText && /^\d{10,}$/.test(inputText)) targetID = inputText;
  else if (inputText) {
    // بحث بالاسم
    const all   = await db.getAllUsers();
    const found = all.find(u => u.name?.toLowerCase().includes(inputText.toLowerCase()));
    if (found) targetID = found.userID;
    else return api.sendMessage(`🔍 ما لقيت: "${inputText}"`, threadID, messageID);
  } else {
    targetID = senderID;
  }

  const wait    = await api.sendMessage('⏳ جاري التحليل...', threadID);
  const profile = await db.getUser(String(targetID));
  api.unsendMessage(wait.messageID);

  if (!profile || (profile.totalMessages || 0) < 2)
    return api.sendMessage(`📭 ما عندي بيانات كافية بعد`, threadID, messageID);

  const showAdmin = isAdmin || profile.isAdmin;
  const report    = mind.formatReport(profile, showAdmin);
  const insight   = await deepInsight(profile, isTrueMode);
  const lbl       = isTrueMode ? '🔴 الحقيقي' : '🔮 كيرا';

  return api.sendMessage(
    `${report}\n\n━━━━━━ ${lbl} ━━━━━━\n${insight || '—'}`,
    threadID, messageID
  );
};
