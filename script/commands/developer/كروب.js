const fs   = require('fs-extra');
const path = require('path');
const http = require('https');

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}
const CFG       = loadConfig();
const ADMIN_IDS = (CFG.ADMINBOT || ['61580139921634']).map(String);
const GH_TOKEN  = CFG.GITHUB_TOKEN;
const GH_REPO   = CFG.GITHUB_REPO || 'aymkira/KENO';
const ROOT      = process.cwd();

// ── GitHub API (نفس بسكت) ────────────────────────────────────
function ghRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req  = http.request({
      hostname: 'api.github.com',
      path:     `/repos/${GH_REPO}${endpoint}`,
      method,
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'User-Agent':    'KIRA-Bot',
        'Accept':        'application/vnd.github.v3+json',
        'Content-Type':  'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch(_) { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getFileSHA(filePath) {
  try {
    const enc = filePath.split('/').map(p => encodeURIComponent(p)).join('/');
    const res = await ghRequest('GET', `/contents/${enc}`);
    if (res.status === 200 && res.data?.sha) return res.data.sha;
  } catch(_) {}
  return null;
}

async function pushToGitHub(filePath, content, message) {
  const sha = await getFileSHA(filePath);
  const enc = filePath.split('/').map(p => encodeURIComponent(p)).join('/');
  const body = { message, content: Buffer.from(content).toString('base64'), ...(sha ? { sha } : {}) };
  return await ghRequest('PUT', `/contents/${enc}`, body);
}

// ── ─────────────────────────────────────────────────────────
module.exports.config = {
  name:            'كروب',
  aliases:         ['group'],
  version:         '2.0.0',
  hasPermssion:    2,
  credits:         'ayman',
  description:     'فتح وإغلاق مضاد الإضافة — يعدل config.json على GitHub',
  commandCategory: 'developer',
  usages:          '.كروب غلق — منع الإضافة\n.كروب فتح — السماح بالإضافة\n.كروب — عرض الحالة',
  cooldowns:       3,
};

module.exports.run = async function({ api, event, args, Threads }) {
  const { threadID, messageID, senderID } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const sub = (args[0] || '').trim().toLowerCase();

  // ── جيب الحالة الحالية من SQLite ─────────────────────────────
  let data = {};
  try { const td = await Threads.getData(threadID); data = td?.data || {}; } catch(_) {}
  const current = data.antiJoin === true;

  // ── عرض الحالة ───────────────────────────────────────────────
  if (!sub || (sub !== 'غلق' && sub !== 'فتح' && sub !== 'close' && sub !== 'open')) {
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗥𝗢𝗨𝗣 ━━ ⌬\n\n🏠 حالة المجموعة\n🔒 مضاد الإضافة: ${current ? '🔴 مفعّل' : '🟢 معطّل'}\n\n📝 الأوامر:\n• .كروب غلق\n• .كروب فتح`,
      threadID, messageID
    );
  }

  const close = sub === 'غلق' || sub === 'close';

  if (close && current)
    return api.sendMessage('⚠️ المجموعة مغلقة أصلاً!', threadID, messageID);
  if (!close && !current)
    return api.sendMessage('⚠️ المجموعة مفتوحة أصلاً!', threadID, messageID);

  const wait = await api.sendMessage('⏳ جاري التحديث...', threadID);

  try {
    // ① تحديث SQLite
    data.antiJoin = close;
    await Threads.setData(threadID, { data });

    // ② تحديث الذاكرة
    if (global.data?.threadData) {
      const existing = global.data.threadData.get(String(threadID)) || {};
      existing.antiJoin = close;
      global.data.threadData.set(String(threadID), existing);
    }

    // ③ تحديث config.json محلياً وعلى GitHub
    const configPath = path.join(ROOT, 'config.json');
    const cfg        = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // احفظ قائمة المجموعات المغلقة في config
    if (!cfg.closedGroups) cfg.closedGroups = [];
    if (close) {
      if (!cfg.closedGroups.includes(threadID)) cfg.closedGroups.push(threadID);
    } else {
      cfg.closedGroups = cfg.closedGroups.filter(id => id !== threadID);
    }

    const cfgStr = JSON.stringify(cfg, null, 2);

    // حفظ محلي
    fs.writeFileSync(configPath, cfgStr, 'utf8');

    // رفع لـ GitHub
    let ghStatus = '⏳';
    if (GH_TOKEN) {
      const res = await pushToGitHub('config.json', cfgStr, `${close ? '🔴 غلق' : '🟢 فتح'} كروب ${threadID} — KIRA`);
      ghStatus  = (res.status === 200 || res.status === 201) ? '✅' : `❌ (${res.status})`;
    } else {
      ghStatus = '⚠️ GITHUB_TOKEN مفقود';
    }

    // تحديث global.config
    global.config = cfg;

    api.unsendMessage(wait.messageID);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗥𝗢𝗨𝗣 ━━ ⌬\n\n${close
        ? '🔴 تم إغلاق المجموعة!\n🚫 أي شخص يُضاف سيُطرد تلقائياً'
        : '🟢 تم فتح المجموعة!\n✅ يمكن إضافة أعضاء الآن'
      }\n\n🐙 GitHub: ${ghStatus}`,
      threadID, messageID
    );

  } catch(e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
  }
};
