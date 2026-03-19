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
const ADMIN_IDS = (CFG.ADMINBOT || []).map(String);
const GH_TOKEN  = CFG.GITHUB_TOKEN || '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';
const GH_REPO   = CFG.GITHUB_REPO  || 'aymkira/KENO';
const ROOT      = process.cwd();

// ══════════════════════════════════════════════════
//  GitHub API
// ══════════════════════════════════════════════════
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
  const sha     = await getFileSHA(filePath);
  const enc     = filePath.split('/').map(p => encodeURIComponent(p)).join('/');
  const body    = { message, content: Buffer.from(content).toString('base64'), ...(sha ? { sha } : {}) };
  return await ghRequest('PUT', `/contents/${enc}`, body);
}

async function deleteFromGitHub(filePath, message) {
  const sha = await getFileSHA(filePath);
  if (!sha) return { status: 404, data: { message: 'ملف مو موجود على GitHub' } };
  const enc = filePath.split('/').map(p => encodeURIComponent(p)).join('/');
  return await ghRequest('DELETE', `/contents/${enc}`, { message, sha });
}

async function getFromGitHub(filePath) {
  const enc = filePath.split('/').map(p => encodeURIComponent(p)).join('/');
  const res = await ghRequest('GET', `/contents/${enc}`);
  if (res.status === 200 && res.data?.content)
    return Buffer.from(res.data.content, 'base64').toString('utf8');
  return null;
}

// ══════════════════════════════════════════════════
//  مساعدات
// ══════════════════════════════════════════════════
function safePath(p) { return p.trim().replace(/\.\.\//g, '').replace(/^\//, ''); }
function getSize(c)  { const b = Buffer.byteLength(c,'utf8'); return b < 1024 ? `${b}B` : `${(b/1024).toFixed(1)}KB`; }

// خريطة الفئات → المجلدات
const CATEGORY_MAP = {
  games: 'script/commands/games',
  utility: 'script/commands/utility',
  admin: 'script/commands/admin',
  developer: 'script/commands/developer',
  media: 'script/commands/media',
  fun: 'script/commands/fun',
  pic: 'script/commands/pic',
  telegram: 'script/commands/telegram',
  'الخدمات': 'script/commands/utility',
  'خدمات': 'script/commands/utility',
};

// استخراج name و commandCategory من الكود
function extractMeta(code) {
  const name = (code.match(/name\s*:\s*['"]([^'"]+)['"]/) || [])[1] || null;
  const cat  = (code.match(/commandCategory\s*:\s*['"]([^'"]+)['"]/) || [])[1]?.toLowerCase() || null;
  return { name, category: cat };
}

// تحديد مسار الملف من الاسم والفئة
function resolveCmdPath(name, category) {
  const dir = CATEGORY_MAP[category] || 'script/commands/utility';
  return `${dir}/${name}.js`;
}

// بحث عن ملف الأمر بالاسم في كل المجلدات
function findCmdFile(name) {
  const base = path.join(ROOT, 'script/commands');
  function walk(dir) {
    try {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) { const f = walk(full); if (f) return f; }
        else if (item === `${name}.js`) return full;
      }
    } catch(_) {}
    return null;
  }
  return walk(base);
}

// ══════════════════════════════════════════════════
//  Config
// ══════════════════════════════════════════════════
module.exports.config = {
  name: 'بسكت',
  version: '2.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'تعديل ملفات البوت وحفظها على GitHub',
  commandCategory: 'developer',
  usages:
`.بسكت ارفع [كود]            ← رفع أمر جديد تلقائياً
.بسكت عدل [اسم] | [كود]    ← تعديل أمر موجود
.بسكت حذف [اسم أو مسار]    ← حذف أمر
.بسكت قرأ [مسار]            ← عرض + تعديل بالرد
.بسكت كتب [مسار] | [محتوى] ← كتابة بالمسار
.بسكت سحب [مسار]            ← تحميل من GitHub
.بسكت قائمة [مجلد]           ← عرض الملفات`,
  cooldowns: 5,
};

// ══════════════════════════════════════════════════
//  handleReply — تعديل بعد قرأ
// ══════════════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (senderID !== handleReply.author) return;
  if (handleReply.action !== 'edit') return;

  const filePath = handleReply.filePath;
  const wait     = await api.sendMessage('⏳ جاري الحفظ...', threadID);
  try {
    const fullPath = path.resolve(ROOT, filePath);
    fs.ensureDirSync(path.dirname(fullPath));
    fs.writeFileSync(fullPath, body, 'utf8');
    const res = await pushToGitHub(filePath, body, `✏️ تعديل ${path.basename(filePath)} — KIRA`);
    api.unsendMessage(wait.messageID);
    const gh = (res.status === 200 || res.status === 201) ? '✅' : `❌ (${res.status})`;
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم الحفظ!\n📄 ${filePath}\n💾 ${getSize(body)}\n🐙 GitHub: ${gh}`,
      threadID, messageID
    );
  } catch(e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
  }
};

// ══════════════════════════════════════════════════
//  RUN
// ══════════════════════════════════════════════════
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n🚫 للمطور فقط.', threadID, messageID);

  const sub = args[0]?.toLowerCase();

  // ════════════════════════════════════════
  //  .بسكت ارفع [كود]
  //  يقرأ name و commandCategory من الكود
  //  ويحفظ في المجلد الصح تلقائياً
  // ════════════════════════════════════════
  if (sub === 'ارفع') {
    // الكود = كل شيء بعد "ارفع "
    const afterCmd = body.indexOf('ارفع');
    const code     = afterCmd !== -1 ? body.slice(afterCmd + 'ارفع'.length).trim() : '';

    if (!code) return api.sendMessage('📝 الاستخدام:\n.بسكت ارفع [الكود كاملاً]', threadID, messageID);

    const meta = extractMeta(code);
    if (!meta.name) return api.sendMessage('❌ ما أقدر أقرأ name من الكود\nتأكد إن الكود يحتوي على:\nname: "اسم"', threadID, messageID);

    const filePath = resolveCmdPath(meta.name, meta.category);
    const fullPath = path.resolve(ROOT, filePath);
    const wait     = await api.sendMessage(`⏳ جاري رفع الأمر "${meta.name}"...`, threadID);

    try {
      fs.ensureDirSync(path.dirname(fullPath));
      fs.writeFileSync(fullPath, code, 'utf8');
      const res = await pushToGitHub(filePath, code, `➕ إضافة أمر ${meta.name} — KIRA`);
      api.unsendMessage(wait.messageID);
      const gh = (res.status === 200 || res.status === 201) ? '✅' : `❌ (${res.status})`;
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم رفع الأمر!\n\n📄 ${filePath}\n🏷️ الفئة: ${meta.category || 'utility'}\n💾 ${getSize(code)}\n🐙 GitHub: ${gh}`,
        threadID, messageID
      );
    } catch(e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ════════════════════════════════════════
  //  .بسكت عدل [اسم الأمر] | [كود جديد]
  //  يلاقي الملف بالاسم ويستبدل محتواه
  // ════════════════════════════════════════
  if (sub === 'عدل') {
    const parts = body.split('|');
    if (parts.length < 2) return api.sendMessage(
      '📝 الاستخدام:\n.بسكت عدل [اسم الأمر] | [الكود الجديد]',
      threadID, messageID
    );

    const afterCmd = parts[0].indexOf('عدل');
    const cmdName  = afterCmd !== -1 ? parts[0].slice(afterCmd + 'عدل'.length).trim() : '';
    const newCode  = parts.slice(1).join('|').trim();

    if (!cmdName) return api.sendMessage('❌ اكتب اسم الأمر', threadID, messageID);
    if (!newCode)  return api.sendMessage('❌ الكود فارغ', threadID, messageID);

    const fullPath = findCmdFile(cmdName);
    if (!fullPath) return api.sendMessage(`❌ ما لقيت ملف الأمر "${cmdName}"`, threadID, messageID);

    const filePath = path.relative(ROOT, fullPath).replace(/\\/g, '/');
    const wait     = await api.sendMessage(`⏳ جاري تعديل "${cmdName}"...`, threadID);

    try {
      fs.writeFileSync(fullPath, newCode, 'utf8');
      const res = await pushToGitHub(filePath, newCode, `✏️ تعديل أمر ${cmdName} — KIRA`);
      api.unsendMessage(wait.messageID);
      const gh = (res.status === 200 || res.status === 201) ? '✅' : `❌ (${res.status})`;
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✏️ تم التعديل!\n\n📄 ${filePath}\n💾 ${getSize(newCode)}\n🐙 GitHub: ${gh}`,
        threadID, messageID
      );
    } catch(e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ════════════════════════════════════════
  //  .بسكت حذف [اسم الأمر أو مسار]
  //  يلاقي الملف بالاسم ويحذفه
  // ════════════════════════════════════════
  if (sub === 'حذف') {
    const target = args.slice(1).join(' ').trim();
    if (!target) return api.sendMessage('📝 اكتب اسم الأمر أو المسار', threadID, messageID);

    // هل هو مسار أم اسم أمر؟
    const isFilePath = target.includes('/') || target.endsWith('.js');
    const fullPath   = isFilePath
      ? path.resolve(ROOT, safePath(target))
      : findCmdFile(target);

    if (!fullPath) return api.sendMessage(`❌ ما لقيت "${target}"`, threadID, messageID);

    const filePath = path.relative(ROOT, fullPath).replace(/\\/g, '/');
    const wait     = await api.sendMessage(`⏳ جاري حذف "${target}"...`, threadID);

    try {
      let localStatus = '✅';
      try { fs.removeSync(fullPath); } catch(_) { localStatus = '⚠️ ما موجود محلياً'; }

      const res      = await deleteFromGitHub(filePath, `🗑️ حذف أمر ${target} — KIRA`);
      const ghOk     = res.status === 200;
      const ghStatus = ghOk ? '✅ حُذف' : res.status === 404 ? '⚠️ ما موجود على GitHub' : `❌ (${res.status})`;

      api.unsendMessage(wait.messageID);
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n🗑️ تم الحذف!\n\n📄 ${filePath}\n💾 محلي: ${localStatus}\n🐙 GitHub: ${ghStatus}`,
        threadID, messageID
      );
    } catch(e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ════════════════════════════════════════
  //  .بسكت قائمة [مجلد]
  // ════════════════════════════════════════
  if (sub === 'قائمة') {
    const dir     = args[1] || 'script/commands';
    const fullDir = path.resolve(ROOT, dir);
    try {
      const items = fs.readdirSync(fullDir);
      const list  = items.map(item => {
        const full = path.join(fullDir, item);
        const stat = fs.statSync(full);
        return `${stat.isDirectory() ? '📁' : '📄'} ${item}`;
      }).join('\n');
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n📂 ${dir}\n━━━━━━━━━━━━━━\n${list || 'فارغ'}`,
        threadID, messageID
      );
    } catch(e) {
      return api.sendMessage(`❌ ما أقدر أقرأ المجلد: ${e.message}`, threadID, messageID);
    }
  }

  // ════════════════════════════════════════
  //  .بسكت قرأ [مسار]
  // ════════════════════════════════════════
  if (sub === 'قرأ') {
    const filePath = safePath(args.slice(1).join(' '));
    if (!filePath) return api.sendMessage('📝 اكتب مسار الملف', threadID, messageID);

    const fullPath = path.resolve(ROOT, filePath);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const preview = content.length > 2000 ? content.slice(0, 2000) + '\n\n... [مقطوع]' : content;
      const sent = await api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n📄 ${filePath}\n💾 ${getSize(content)}\n━━━━━━━━━━━━━━\n${preview}\n━━━━━━━━━━━━━━\n✏️ رد على هذه الرسالة بالمحتوى الجديد للتعديل`,
        threadID, messageID
      );
      global.client?.handleReply?.push({
        name: module.exports.config.name,
        messageID: sent.messageID,
        author: senderID,
        action: 'edit',
        filePath,
      });
    } catch(e) {
      return api.sendMessage(`❌ ما أقدر أقرأ الملف: ${e.message}`, threadID, messageID);
    }
    return;
  }

  // ════════════════════════════════════════
  //  .بسكت كتب [مسار] | [محتوى]
  // ════════════════════════════════════════
  if (sub === 'كتب') {
    const parts = body.split('|');
    if (parts.length < 2) return api.sendMessage('📝 الاستخدام:\n.بسكت كتب [مسار] | [المحتوى]', threadID, messageID);
    const filePath = safePath(parts[0].replace(/^\.بسكت\s+كتب\s+/i, '').trim());
    const content  = parts.slice(1).join('|').trim();
    if (!filePath || !content) return api.sendMessage('❌ مسار أو محتوى فارغ', threadID, messageID);

    const wait = await api.sendMessage('⏳ جاري الكتابة...', threadID);
    try {
      const fullPath = path.resolve(ROOT, filePath);
      fs.ensureDirSync(path.dirname(fullPath));
      fs.writeFileSync(fullPath, content, 'utf8');
      const res = await pushToGitHub(filePath, content, `✏️ ${path.basename(filePath)} — KIRA`);
      api.unsendMessage(wait.messageID);
      const gh = (res.status === 200 || res.status === 201) ? '✅' : `❌ (${res.status})`;
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم الكتابة!\n📄 ${filePath}\n💾 ${getSize(content)}\n🐙 GitHub: ${gh}`,
        threadID, messageID
      );
    } catch(e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ════════════════════════════════════════
  //  .بسكت سحب [مسار]
  // ════════════════════════════════════════
  if (sub === 'سحب') {
    const filePath = safePath(args.slice(1).join(' '));
    if (!filePath) return api.sendMessage('📝 اكتب مسار الملف', threadID, messageID);
    const wait = await api.sendMessage('⏳ جاري السحب من GitHub...', threadID);
    try {
      const content = await getFromGitHub(filePath);
      if (!content) { api.unsendMessage(wait.messageID); return api.sendMessage(`❌ الملف ما موجود على GitHub`, threadID, messageID); }
      const fullPath = path.resolve(ROOT, filePath);
      fs.ensureDirSync(path.dirname(fullPath));
      fs.writeFileSync(fullPath, content, 'utf8');
      api.unsendMessage(wait.messageID);
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n⬇️ تم السحب!\n📄 ${filePath}\n💾 ${getSize(content)}\n✅ محفوظ محلياً`,
        threadID, messageID
      );
    } catch(e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ════════════════════════════════════════
  //  مساعدة
  // ════════════════════════════════════════
  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n📁 أمر بسكت\n\n` +
    `.بسكت ارفع [كود]            ← رفع أمر جديد تلقائياً\n` +
    `.بسكت عدل [اسم] | [كود]    ← تعديل أمر موجود\n` +
    `.بسكت حذف [اسم أو مسار]    ← حذف أمر\n` +
    `.بسكت قرأ [مسار]            ← عرض + تعديل بالرد\n` +
    `.بسكت كتب [مسار] | [محتوى] ← كتابة بالمسار\n` +
    `.بسكت سحب [مسار]            ← تحميل من GitHub\n` +
    `.بسكت قائمة [مجلد]           ← عرض الملفات\n\n` +
    `مثال:\n.بسكت ارفع [كود أمر]\n.بسكت عدل كيرا | [الكود الجديد]\n.بسكت حذف كيرا`,
    threadID, messageID
  );
};
