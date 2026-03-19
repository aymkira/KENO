// KIRA MIND v5.0 — GitHub JSON بدلاً من MongoDB

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

function getDB() {
  try { return require(path.join(process.cwd(), 'includes', 'data.js')); }
  catch { return null; }
}

module.exports.config = {
  name: 'kira_mind',
  eventType: ['message', 'message_reply'],
  version: '5.0.0',
  credits: 'ayman',
  description: 'KIRA MIND — يستمع ويحلل بصمت ويحفظ على GitHub',
};

const pending = new Map();

// ── Groq ──────────────────────────────────────────
async function callGroq(prompt, tokens = 1000) {
  return new Promise(resolve => {
    const body = JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: tokens,
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

// ── تحليل ─────────────────────────────────────────
async function analyze(messages, userName, old, isAdmin) {
  const msgs = Array.isArray(messages)
    ? messages.map((m, i) => `[${i+1}] ${m}`).join('\n')
    : messages;

  const prev = old
    ? `MBTI:${old.mbti||'?'} مزاج:${old.mood||'?'} اهتمامات:${(old.interests||[]).slice(0,3).join(',')}`
    : 'جديد';

  const adminNote = isAdmin
    ? '\n⚠️ هذا المطور أيمن — حلل بصدق تام، دوّن علامات الاكتئاب والوحدة.'
    : '';

  const prompt =
`محلل نفسي. حلل رسائل "${userName}".${adminNote}
السياق: ${prev}
الرسائل:
${msgs}

JSON فقط:
{"emotion":"","intent":"","sentiment":0,"topics":[],"mental_flag":"","mbti":"","interests":[],"hidden_interests":[],"fears":[],"dreams":[],"mood":"","mood_score":50,"stress":30,"mental_notes":[],"key_facts":[],"important_people":[{"name":"","rel":"","feel":""}],"location":"","life_period":"","kira_tone":"","avoid":[],"cheer":"","phrases":[],"dark_traits":[]}`;

  try {
    const raw = await callGroq(prompt);
    const s   = raw.indexOf('{'), e = raw.lastIndexOf('}');
    if (s === -1) return null;
    return JSON.parse(raw.slice(s, e + 1));
  } catch { return null; }
}

// ── تحديث الملف ───────────────────────────────────
async function updateProfile(userID, userName, a, isAdmin) {
  if (!a) return;
  const db  = getDB();
  if (!db) return;

  const old = await db.getUser(userID) || {};
  const merge = (a1 = [], a2 = [], max = 30) =>
    [...new Set([...a1, ...a2])].filter(Boolean).slice(0, max);

  const n   = (old.totalMessages || 0) + 1;
  const conf = Math.min(Math.round(5 + n * 1.2 + (n > 15 ? 15 : 0) + (n > 40 ? 15 : 0)), 98);
  const moodDelta = Math.abs((a.mood_score || 50) - (old.moodScore || 50));

  await db.setUser(userID, {
    name: userName || old.name,
    isAdmin,
    lastSeen: new Date().toISOString(),
    totalMessages: n,
    confidence: conf,

    mbti:       a.mbti       || old.mbti       || '',
    darkTraits: merge(old.darkTraits, a.dark_traits),

    kiraStrat: {
      tone:  a.kira_tone || old.kiraStrat?.tone  || '',
      avoid: merge(old.kiraStrat?.avoid, a.avoid),
      cheer: a.cheer     || old.kiraStrat?.cheer || '',
    },

    interests:  merge(old.interests, a.interests),
    hiddenInt:  merge(old.hiddenInt, a.hidden_interests),
    fears:      merge(old.fears, a.fears),
    dreams:     merge(old.dreams, a.dreams),

    mood:      a.mood       || old.mood      || '',
    moodScore: a.mood_score ?? old.moodScore ?? 50,
    stress:    a.stress     ?? old.stress    ?? 0,
    mentalNotes: merge(old.mentalNotes, a.mental_notes, 50),

    location:   a.location    || old.location   || '',
    lifePeriod: a.life_period  || old.lifePeriod || '',
    keyFacts:   merge(old.keyFacts, [
      ...( a.key_facts || []),
      ...(moodDelta >= 20 ? [`تغير مزاج: ${old.moodScore}→${a.mood_score}`] : []),
    ], 100),
    phrases:    merge(old.phrases, a.phrases, 30),
    lastTopics: [...(a.topics || []), ...(old.lastTopics || [])].slice(0, 10),

    importantPeople: (() => {
      const list = [...(old.importantPeople || [])];
      for (const p of (a.important_people || [])) {
        if (!p.name) continue;
        const ex = list.find(x => x.name === p.name);
        if (ex) ex.feel = p.feel || ex.feel;
        else list.push(p);
      }
      return list.slice(0, 20);
    })(),

    stats: {
      positive: (old.stats?.positive || 0) + (a.sentiment > 20 ? 1 : 0),
      negative: (old.stats?.negative || 0) + (a.sentiment < -20 ? 1 : 0),
      neutral:  (old.stats?.neutral  || 0) + (Math.abs(a.sentiment || 0) <= 20 ? 1 : 0),
    },

    moodHistory: [
      ...(old.moodHistory || []),
      { date: new Date().toISOString(), mood: a.mood, score: a.mood_score },
    ].slice(-50),
  });

  if (moodDelta >= 20)
    console.log(`[ KIRA MIND ] ⚡ ${userName}: تغير مزاج ${moodDelta} نقطة`);
}

// ── Event ──────────────────────────────────────────
module.exports.run = async function({ api, event }) {
  try {
    if (event.senderID === api.getCurrentUserID()) return;
    const body = event.body?.trim();
    if (!body || body.length < 2) return;
    if (body.startsWith(global.client?.config?.PREFIX || '.')) return;

    const db = getDB();
    if (!db) return;

    const userID  = String(event.senderID);
    const isAdmin = userID === ADMIN_ID;

    let userName = 'مجهول';
    try { const i = await api.getUserInfo(userID); userName = i[userID]?.name || 'مجهول'; } catch(_){}

    const existing = await db.getUser(userID);

    if (!existing) {
      if (!pending.has(userID)) pending.set(userID, []);
      const buf = pending.get(userID);
      buf.push(body);
      console.log(`[ KIRA MIND ] ⏳ ${userName}: ${buf.length}/5`);
      if (buf.length < 5) return;
      const bodies = [...buf];
      pending.delete(userID);
      const a = await analyze(bodies, userName, null, isAdmin);
      await updateProfile(userID, userName, a, isAdmin);
      await db.logEvent('new_profile', { userID, name: userName });
      console.log(`[ KIRA MIND ] ✅ ${userName}`);
      return;
    }

    const a = await analyze(body, userName, existing, isAdmin);
    await updateProfile(userID, userName, a, isAdmin);
    console.log(`[ KIRA MIND ] 👁️ ${userName}: ${a?.emotion || '—'}`);

  } catch(e) {
    console.error('[ KIRA MIND ] ❌', e.message);
  }
};

// ── دوال مُصدَّرة ─────────────────────────────────
module.exports.getUser    = id => getDB()?.getUser(String(id));
module.exports.getAllUsers = ()  => getDB()?.getAllUsers() || [];
module.exports.ADMIN_ID   = ADMIN_ID;

module.exports.formatReport = function(p, admin = false) {
  const bar = '█'.repeat(Math.round((p.confidence||0)/10)) + '░'.repeat(10 - Math.round((p.confidence||0)/10));
  let r =
`🧠 ${p.name} [${bar}] ${p.confidence||0}%
💬 ${p.totalMessages||0} رسالة | 📅 ${p.lastSeen ? new Date(p.lastSeen).toLocaleDateString('ar') : '—'}

🎭 ${p.mbti||'—'} | ${p.mood||'—'} (${p.moodScore||50}/100)
⚡ ضغط: ${p.stress||0}% | 📍 ${p.lifePeriod||'—'}

🌟 ${(p.interests||[]).slice(0,5).join(' | ')||'—'}
🔍 ${(p.hiddenInt||[]).slice(0,3).join(' | ')||'—'}
😨 ${(p.fears||[]).slice(0,3).join(' | ')||'—'}
✨ ${(p.dreams||[]).slice(0,3).join(' | ')||'—'}

👥 ${(p.importantPeople||[]).slice(0,4).map(x=>`${x.name}(${x.feel})`).join(', ')||'—'}

💡 ${p.kiraStrat?.tone||'—'}
✅ ${p.kiraStrat?.cheer||'—'}
❌ ${(p.kiraStrat?.avoid||[]).slice(0,2).join(', ')||'—'}

🗝️
${(p.keyFacts||[]).slice(0,5).map(f=>`• ${f}`).join('\n')||'—'}`;

  if (admin && (p.mentalNotes||[]).length)
    r += `\n\n🔴 نفسي:\n${p.mentalNotes.slice(0,4).map(n=>`• ${n}`).join('\n')}`;

  return r;
};

module.exports.formatShort = p =>
  `👤 ${p.name} | ${p.mbti||'؟'} | ${p.mood||'—'} | ضغط:${p.stress||0}%`;
