// ╔══════════════════════════════════════════════════════════════════╗
// ║                   أمر .حلت — فحص KIRA MIND                      ║
// ║   يتحقق من كل مكونات النظام ويعطي تقرير صحة كامل               ║
// ╚══════════════════════════════════════════════════════════════════╝

const https = require('https');
const fs    = require('fs');
const path  = require('path');

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
const GROQ_KEY = CFG.GROQ_API_KEY || '';
const MONGO_URI = CFG.MONGODB_URI  || '';
const ADMIN_ID  = '61580139921634';

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

module.exports.config = {
  name: 'حلت',
  aliases: ['check', 'status', 'فحص'],
  version: '1.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'فحص صحة KIRA MIND الكامل',
  commandCategory: 'developer',
  usages: '.حلت',
  cooldowns: 10,
};

// ── اختبار Groq ───────────────────────────────────
function testGroq() {
  return new Promise((resolve) => {
    if (!GROQ_KEY) return resolve({ ok: false, msg: 'GROQ_API_KEY غير موجود في config.json', ms: 0 });
    const start = Date.now();
    const body  = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'قل "مرحبا" فقط' }],
      max_tokens: 10,
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
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const ms = Date.now() - start;
        try {
          const json = JSON.parse(data);
          if (json.error) return resolve({ ok: false, msg: json.error.message, ms });
          const reply = json.choices?.[0]?.message?.content || '';
          resolve({ ok: true, msg: `رد: "${reply.slice(0,20)}"`, ms });
        } catch {
          resolve({ ok: false, msg: 'فشل تحليل الرد', ms });
        }
      });
    });
    req.on('error', e => resolve({ ok: false, msg: e.message, ms: Date.now() - start }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, msg: 'timeout بعد 8 ثواني', ms: 8000 }); });
    req.write(body);
    req.end();
  });
}

// ── اختبار MongoDB ────────────────────────────────
async function testMongo(mind) {
  if (!MONGO_URI) return { ok: false, msg: 'MONGODB_URI غير موجود في config.json', ms: 0, docs: 0 };
  const start = Date.now();
  try {
    await mind.connectDB();
    const UP = mind.getUserProfile();
    if (!UP) return { ok: false, msg: 'UserProfile model غير موجود', ms: Date.now()-start, docs: 0 };
    const count = await UP.countDocuments();
    const ms    = Date.now() - start;
    return { ok: true, msg: `متصل — ${count} ملف شخصي`, ms, docs: count };
  } catch (e) {
    return { ok: false, msg: e.message, ms: Date.now()-start, docs: 0 };
  }
}

// ── اختبار ملف kira_mind.js ───────────────────────
function testMindFile() {
  const mind = getMind();
  if (!mind) return { ok: false, msg: 'الملف غير موجود أو فيه خطأ syntax', exports: [] };
  const required = ['connectDB', 'findUser', 'formatFullReport', 'formatShortReport', 'getUserProfile'];
  const missing  = required.filter(fn => typeof mind[fn] !== 'function');
  if (missing.length) return { ok: false, msg: `دوال ناقصة: ${missing.join(', ')}`, exports: Object.keys(mind) };
  return { ok: true, msg: 'كل الدوال موجودة', exports: Object.keys(mind), mind };
}

// ── اختبار آخر تحليل ──────────────────────────────
async function testLastActivity(mind) {
  try {
    const UP = mind.getUserProfile();
    if (!UP) return { ok: false, msg: 'لا يوجد' };
    const last = await UP.findOne().sort({ lastSeen: -1 });
    if (!last) return { ok: false, msg: 'لا يوجد ملفات بعد' };
    const ago  = Math.round((Date.now() - new Date(last.lastSeen)) / 60000);
    return {
      ok: true,
      msg: `آخر تحليل: ${last.name} (منذ ${ago < 60 ? ago+' دقيقة' : Math.round(ago/60)+' ساعة'})`,
      name: last.name,
      msgs: last.confidence?.messagesAnalyzed || 0,
    };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

// ══════════════════════════════════════════════════
//  RUN
// ══════════════════════════════════════════════════
module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;

  // أدمن فقط
  const admins = CFG.ADMINBOT || [ADMIN_ID];
  if (!admins.includes(senderID))
    return api.sendMessage('❌ هذا الأمر للمطور فقط.', threadID, messageID);

  const wait = await api.sendMessage('🔍 جاري فحص KIRA MIND...', threadID);

  // ── ① فحص ملف kira_mind ──────────────────────
  const fileCheck = testMindFile();

  // ── ② فحص Groq ────────────────────────────────
  const groqCheck = await testGroq();

  // ── ③ فحص MongoDB ─────────────────────────────
  let mongoCheck = { ok: false, msg: 'kira_mind.js غير موجود', ms: 0, docs: 0 };
  let activityCheck = { ok: false, msg: '—' };
  if (fileCheck.ok && fileCheck.mind) {
    mongoCheck    = await testMongo(fileCheck.mind);
    if (mongoCheck.ok) activityCheck = await testLastActivity(fileCheck.mind);
  }

  // ── ④ فحص config.json ─────────────────────────
  const configKeys = {
    GROQ_API_KEY: !!CFG.GROQ_API_KEY,
    MONGODB_URI:  !!CFG.MONGODB_URI,
    PREFIX:       !!CFG.PREFIX,
    ADMINBOT:     !!CFG.ADMINBOT,
  };
  const configOk = configKeys.GROQ_API_KEY && configKeys.MONGODB_URI;

  // ── ⑤ فحص النظام العام ───────────────────────
  const nodeVer  = process.version;
  const uptime   = Math.round(process.uptime() / 60);
  const memUsed  = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

  // ── تجميع النتائج ─────────────────────────────
  const icon = v => v ? '✅' : '❌';
  const ms   = v => v > 0 ? ` (${v}ms)` : '';

  const allOk = fileCheck.ok && groqCheck.ok && mongoCheck.ok && configOk;
  const score = [fileCheck.ok, groqCheck.ok, mongoCheck.ok, configOk].filter(Boolean).length;

  api.unsendMessage(wait.messageID);
  return api.sendMessage(
`╔═══════════════════════════════╗
║   🔬 فحص KIRA MIND            ║
╚═══════════════════════════════╝
${allOk ? '🟢 كل شيء يعمل بشكل مثالي!' : `🔴 ${4 - score} مشكلة تحتاج حل`}
النتيجة: ${score}/4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
① ملف kira_mind.js
   ${icon(fileCheck.ok)} ${fileCheck.msg}
   ${fileCheck.ok ? `📦 الدوال: ${fileCheck.exports.join(', ')}` : ''}

② Groq API${ms(groqCheck.ms)}
   ${icon(groqCheck.ok)} ${groqCheck.msg}
   🔑 المفتاح: ${GROQ_KEY ? GROQ_KEY.slice(0,12)+'...' : '❌ غير موجود'}

③ MongoDB${ms(mongoCheck.ms)}
   ${icon(mongoCheck.ok)} ${mongoCheck.msg}
   🌐 URI: ${MONGO_URI ? MONGO_URI.split('@')[1]?.split('/')[0] || '✅' : '❌ غير موجود'}

④ config.json
   ${icon(configOk)} ${Object.entries(configKeys).map(([k,v])=>`${icon(v)} ${k}`).join(' | ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⑤ آخر نشاط
   ${icon(activityCheck.ok)} ${activityCheck.msg}
   ${activityCheck.ok ? `📊 رسائل محللة: ${activityCheck.msgs}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖥️ البوت:
   Node.js ${nodeVer} | تشغيل: ${uptime} دقيقة | RAM: ${memUsed} MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${!allOk ? `\n💡 حل المشاكل:\n${!fileCheck.ok ? '• تأكد من وجود kira_mind.js في script/events/\n' : ''}${!groqCheck.ok ? '• تحقق من GROQ_API_KEY في config.json\n' : ''}${!mongoCheck.ok ? '• تحقق من MONGODB_URI في config.json\n' : ''}` : ''}🕐 ${new Date().toLocaleString('ar')}`,
    threadID, messageID
  );
};
