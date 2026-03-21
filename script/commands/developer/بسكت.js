const fs   = require('fs-extra');
const path = require('path');
const http = require('https');

const ROOT      = process.cwd();
const ADMIN_IDS = () => (global.config?.ADMINBOT || []).map(String);
const GH_TOKEN  = () => global.config?.GITHUB_TOKEN || '';
const GH_REPO   = () => global.config?.GITHUB_REPO  || '';

// ══════════════════════════════════════════════════
//  GitHub API
// ══════════════════════════════════════════════════
function ghRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req  = http.request({
      hostname: 'api.github.com',
      path:     `/repos/${GH_REPO()}${endpoint}`,
      method,
      headers: {
        'Authorization': `token ${GH_TOKEN()}`,
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
  if (!GH_TOKEN() || !GH_REPO()) return { status: 0, error: 'GITHUB_TOKEN أو GITHUB_REPO مو موجود في config.json' };
  try {
    const sha  = await getFileSHA(filePath);
    const enc  = filePath.split('/').map(p => encodeURIComponent(p)).join('/');
    const body = { message, content: Buffer.from(content).toString('base64'), ...(sha ? { sha } : {}) };
    const res  = await ghRequest('PUT', `/contents/${enc}`, body);
    // تحقق حقيقي من النتيجة
    if (res.status === 200 || res.status === 201) return { status: res.status, ok: true };
    return { status: res.status, ok: false, error: res.data?.message || `خطأ ${res.status}` };
  } catch(e) {
    return { status: 0, ok: false, error: e.message };
  }
}

async function deleteFromGitHub(filePath, message) {
  if (!GH_TOKEN() || !GH_REPO()) return { status: 0, ok: false, error: 'GITHUB_TOKEN مو موجود' };
  try {
    const sha = await getFileSHA(filePath);
    if (!sha) return { status: 404, ok: false, error: 'الملف مو موجود على GitHub' };
    const enc = filePath.split('/').map(p => encodeURIComponent(p)).join('/');
    const res = await ghRequest('DELETE', `/contents/${enc}`, { message, sha });
    if (res.status === 200) return { status: 200, ok: true };
    return { status: res.status, ok: false, error: res.data?.message || `خطأ ${res.status}` };
  } catch(e) {
    return { status: 0, ok: false, error: e.message };
  }
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

function extractMeta(code) {
  const name = (code.match(/name\s*:\s*['"]([^'"]+)['"]/) || [])[1] || null;
  const cat  = (code.match(/commandCategory\s*:\s*['"]([^'"]+)['"]/) || [])[1]?.toLowerCase() || 'utility';
  return { name, category: cat };
}

const CATEGORY_MAP = {
  games: 'script/commands/games',
  utility: 'script/commands/utility',
  admin: 'script/commands/admin',
  developer: 'script/commands/developer',
  media: 'script/commands/media',
  fun: 'script/commands/fun',
  pic: 'script/commands/pic',
};

function resolveCmdPath(name, category) {
  const dir = CATEGORY_MAP[category] || 'script/commands/utility';
  return `${dir}/${name}.js`;
}

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

function ghStatus(res) {
  if (!GH_TOKEN()) return '⚠️ TOKEN مو موجود';
  if (res.ok) return '✅ رُفع';
  return `❌ ${res.error || res.status}`;
}

// ══════════════════════════════════════════════════
//  Config
// ══════════════════════════════════════════════════
module.exports.config = {
  name: 'بسكت',
  version: '3.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'إدارة ملفات البوت مع GitHub',
  commandCategory: 'developer',
  usages: 'ارفع | عدل | حذف | قرأ | كتب | سحب | قائمة',
  cooldowns: 3,
};

// ══════════════════════════════════════════════════
//  handleReply — تعديل بعد قرأ
// ══════════════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply: hr }) {
  const { threadID, messageID, senderID, body } = event;
  if (senderID !== hr.author || hr.action !== 'edit') return;

  const wait = await api.sendMessage('⏳ جاري الحفظ...', threadID);
  try {
    const fullPath = path.resolve(ROOT, hr.filePath);
    fs.ensureDirSync(path.dirname(fullPath));
    fs.writeFileSync(fullPath, body, 'utf8');
    const res = await pushToGitHub(hr.filePath, body, `✏️ تعديل ${path.basename(hr.filePath)}`);
    api.unsendMessage(wait.messageID);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم الحفظ!\n📄 ${hr.filePath}\n💾 ${getSize(body)}\n🐙 GitHub: ${ghStatus(res)}`,
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

  if (!ADMIN_IDS().includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const sub = args[0]?.toLowerCase();

  // ── ارفع ──────────────────────────────────────
  if (sub === 'ارفع') {
    const idx  = body.indexOf('ارفع');
    const code = idx !== -1 ? body.slice(idx + 'ارفع'.length).trim() : '';
    if (!code) return api.sendMessage('📝 الاستخدام:\n.بسكت ارفع [الكود]', threadID, messageID);

    const meta = extractMeta(code);
    if (!meta.name) return api.sendMessage('❌ ما أقدر أقرأ name من الكود', threadID, messageID);

    const filePath = resolveCmdPath(meta.name, meta.category);
    const fullPath = path.resolve(ROOT, filePath);
    const wait     = await api.sendMessage(`⏳ جاري رفع "${meta.name}"...`, threadID);

    try {
      fs.ensureDirSync(path.dirname(fullPath));
      fs.writeFileSync(fullPath, code, 'utf8');
      const res = await pushToGitHub(filePath, code, `➕ ${meta.name}`);
      api.unsendMessage(wait.messageID);

      if (!res.ok) return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ رُفع محلياً\n📄 ${filePath}\n🐙 GitHub: ❌ ${res.error}`,
        threadID, messageID
      );

      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم الرفع!\n📄 ${filePath}\n🏷️ ${meta.category}\n💾 ${getSize(code)}\n🐙 GitHub: ✅`,
        threadID, messageID
      );
    } catch(e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ── عدل ──────────────────────────────────────
  if (sub === 'عدل') {
    const parts = body.split('|');
    if (parts.length < 2) return api.sendMessage('📝 .بسكت عدل [اسم] | [الكود]', threadID, messageID);

    const cmdName = parts[0].replace(/^.*عدل\s*/i, '').trim();
    const newCode = parts.slice(1).join('|').trim();
    if (!cmdName || !newCode) return api.sendMessage('❌ اسم أو كود فارغ', threadID, messageID);

    const fullPath = findCmdFile(cmdName);
    if (!fullPath) return api.sendMessage(`❌ ما لقيت الأمر "${cmdName}"`, threadID, messageID);

    const filePath = path.relative(ROOT, fullPath).replace(/\\/g, '/');
    const wait     = await api.sendMessage(`⏳ جاري تعديل "${cmdName}"...`, threadID);

    try {
      fs.writeFileSync(fullPath, newCode, 'utf8');
      const res = await pushToGitHub(filePath, newCode, `✏️ ${cmdName}`);
      api.unsendMessage(wait.messageID);

      if (!res.ok) return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ عُدّل محلياً\n📄 ${filePath}\n🐙 GitHub: ❌ ${res.error}`,
        threadID, messageID
      );

      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✏️ تم التعديل!\n📄 ${filePath}\n💾 ${getSize(newCode)}\n🐙 GitHub: ✅`,
        threadID, messageID
      );
    } catch(e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ── حذف ──────────────────────────────────────
  if (sub === 'حذف') {
    const target = args.slice(1).join(' ').trim();
    if (!target) return api.sendMessage('📝 .بسكت حذف [اسم الأمر]', threadID, messageID);

    const isPath   = target.includes('/') || target.endsWith('.js');
    const fullPath = isPath ? path.resolve(ROOT, safePath(target)) : findCmdFile(target);
    if (!fullPath) return api.sendMessage(`❌ ما لقيت "${target}"`, threadID, messageID);

    const filePath = path.relative(ROOT, fullPath).replace(/\\/g, '/');
    const wait     = await api.sendMessage(`⏳ جاري حذف "${target}"...`, threadID);

    try {
      try { fs.removeSync(fullPath); } catch(_) {}
      const res = await deleteFromGitHub(filePath, `🗑️ ${target}`);
      api.unsendMessage(wait.messageID);

      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n🗑️ تم الحذف!\n📄 ${filePath}\n🐙 GitHub: ${ghStatus(res)}`,
        threadID, messageID
      );
    } catch(e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ── قرأ ──────────────────────────────────────
  if (sub === 'قرأ') {
    const filePath = safePath(args.slice(1).join(' '));
    if (!filePath) return api.sendMessage('📝 .بسكت قرأ [مسار]', threadID, messageID);

    try {
      const content = fs.readFileSync(path.resolve(ROOT, filePath), 'utf8');
      const preview = content.length > 2000 ? content.slice(0, 2000) + '\n... [مقطوع]' : content;
      const sent = await api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n📄 ${filePath} | 💾 ${getSize(content)}\n━━━━━━━━━━\n${preview}\n━━━━━━━━━━\n✏️ رد بالمحتوى الجديد للتعديل`,
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

  // ── كتب ──────────────────────────────────────
  if (sub === 'كتب') {
    const parts = body.split('|');
    if (parts.length < 2) return api.sendMessage('📝 .بسكت كتب [مسار] | [المحتوى]', threadID, messageID);
    const filePath = safePath(parts[0].replace(/^.*كتب\s*/i, '').trim());
    const content  = parts.slice(1).join('|').trim();
    if (!filePath || !content) return api.sendMessage('❌ مسار أو محتوى فارغ', threadID, messageID);

    const wait = await api.sendMessage('⏳ جاري الكتابة...', threadID);
    try {
      const fullPath = path.resolve(ROOT, filePath);
      fs.ensureDirSync(path.dirname(fullPath));
      fs.writeFileSync(fullPath, content, 'utf8');
      const res = await pushToGitHub(filePath, content, `📝 ${path.basename(filePath)}`);
      api.unsendMessage(wait.messageID);

      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم الكتابة!\n📄 ${filePath}\n💾 ${getSize(content)}\n🐙 GitHub: ${ghStatus(res)}`,
        threadID, messageID
      );
    } catch(e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ── سحب ──────────────────────────────────────
  if (sub === 'سحب') {
    const filePath = safePath(args.slice(1).join(' '));
    if (!filePath) return api.sendMessage('📝 .بسكت سحب [مسار]', threadID, messageID);

    const wait = await api.sendMessage('⏳ جاري السحب من GitHub...', threadID);
    try {
      const content = await getFromGitHub(filePath);
      if (!content) { api.unsendMessage(wait.messageID); return api.sendMessage('❌ الملف مو موجود على GitHub', threadID, messageID); }
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

  // ── قائمة ──────────────────────────────────────
  if (sub === 'قائمة') {
    const dir     = args[1] || 'script/commands';
    const fullDir = path.resolve(ROOT, dir);
    try {
      const items = fs.readdirSync(fullDir);
      const list  = items.map(item => {
        const full = path.join(fullDir, item);
        return `${fs.statSync(full).isDirectory() ? '📁' : '📄'} ${item}`;
      }).join('\n');
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n📂 ${dir}\n━━━━━━━━━━\n${list || 'فارغ'}`,
        threadID, messageID
      );
    } catch(e) {
      return api.sendMessage(`❌ ما أقدر أقرأ المجلد: ${e.message}`, threadID, messageID);
    }
  }

  // ── مساعدة ──────────────────────────────────────
  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n` +
    `.بسكت ارفع [كود]         ← رفع أمر جديد\n` +
    `.بسكت عدل [اسم] | [كود] ← تعديل أمر\n` +
    `.بسكت حذف [اسم]          ← حذف أمر\n` +
    `.بسكت قرأ [مسار]         ← عرض ملف\n` +
    `.بسكت كتب [مسار] | [محتوى]\n` +
    `.بسكت سحب [مسار]         ← سحب من GitHub\n` +
    `.بسكت قائمة [مجلد]       ← عرض الملفات`,
    threadID, messageID
  );
};
