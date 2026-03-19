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
const GROQ_KEY = CFG.GROQ_API_KEY || '';
const ADMIN_IDS = (CFG.ADMINBOT || ['61580139921634']).map(String);

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
  name: 'حلت',
  aliases: ['check', 'status'],
  version: '5.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'فحص KIRA MIND',
  commandCategory: 'developer',
  usages: '.حلت',
  cooldowns: 10,
};

// ── اختبار Groq ───────────────────────────────────
function testGroq() {
  return new Promise(resolve => {
    if (!GROQ_KEY) return resolve({ ok: false, ms: 0, msg: 'GROQ_API_KEY مفقود' });
    const start = Date.now();
    const body  = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'رد بكلمة واحدة: مرحبا' }],
      max_tokens: 5,
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
      timeout: 8000,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const ms = Date.now() - start;
        try {
          const j = JSON.parse(d);
          if (j.error) return resolve({ ok: false, ms, msg: j.error.message });
          resolve({ ok: true, ms, msg: j.choices?.[0]?.message?.content || '✅' });
        } catch { resolve({ ok: false, ms, msg: 'parse error' }); }
      });
    });
    req.on('error', e => resolve({ ok: false, ms: 0, msg: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, ms: 8000, msg: 'timeout' }); });
    req.write(body);
    req.end();
  });
}

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const wait = await api.sendMessage('🔍 جاري الفحص...', threadID);

  const mind = getMind();
  const db   = getDB();

  // ① kira_mind.js
  const mindOk  = !!mind;
  const mindMsg = mindOk ? '✅ موجود' : '❌ مفقود من script/events/';

  // ② Groq
  const groq = await testGroq();

  // ③ data.js + GitHub
  let dbOk = false, dbMsg = '', dbCount = 0;
  if (!db) {
    dbMsg = '❌ includes/data.js مفقود';
  } else {
    try {
      const start = Date.now();
      const users = await db.getAllUsers();
      dbCount = users.length;
      dbOk  = true;
      dbMsg = `✅ ${dbCount} مستخدم (${Date.now()-start}ms)`;
    } catch(e) {
      dbMsg = `❌ ${e.message}`;
    }
  }

  // ④ config
  const cfgOk  = !!CFG.GROQ_API_KEY && !!CFG.GITHUB_TOKEN;
  const cfgMsg = [
    CFG.GROQ_API_KEY  ? '✅ GROQ'   : '❌ GROQ',
    CFG.GITHUB_TOKEN  ? '✅ GitHub' : '❌ GitHub',
    CFG.MONGODB_URI   ? '⚠️ Mongo (غير مستخدم)' : '',
  ].filter(Boolean).join(' | ');

  // ⑤ آخر نشاط
  let lastMsg = '—';
  if (db && dbOk) {
    try {
      const users = await db.getAllUsers();
      const last  = users.sort((a,b) => new Date(b.lastSeen||0) - new Date(a.lastSeen||0))[0];
      if (last) {
        const ago = Math.round((Date.now() - new Date(last.lastSeen)) / 60000);
        lastMsg = `${last.name} — منذ ${ago < 60 ? ago+'د' : Math.round(ago/60)+'س'}`;
      }
    } catch(_) {}
  }

  const score  = [mindOk, groq.ok, dbOk, cfgOk].filter(Boolean).length;
  const allOk  = score === 4;
  const icon   = v => v ? '✅' : '❌';

  api.unsendMessage(wait.messageID);
  return api.sendMessage(
`🔬 KIRA MIND — ${allOk ? '🟢 كل شيء يعمل' : `🔴 ${4-score} مشاكل`}
النتيجة: ${score}/4

① kira_mind.js: ${mindMsg}
② Groq: ${icon(groq.ok)} ${groq.msg} ${groq.ms ? `(${groq.ms}ms)` : ''}
③ data.js: ${dbMsg}
④ config: ${cfgMsg}
⑤ آخر نشاط: ${lastMsg}

🖥️ Node ${process.version} | RAM: ${Math.round(process.memoryUsage().heapUsed/1024/1024)}MB | ⏱ ${Math.round(process.uptime()/60)}د`,
    threadID, messageID
  );
};
