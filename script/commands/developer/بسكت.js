const fs   = require('fs-extra');
const path = require('path');
const http = require('https');

// ══════════════════════════════════════════════════
//  الإعدادات
// ══════════════════════════════════════════════════
function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}
const CFG       = loadConfig();
const ADMIN_IDS = (CFG.ADMINBOT || []).map(String);
const GH_TOKEN  = CFG.GITHUB_TOKEN  || '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';
const GH_REPO   = CFG.GITHUB_REPO   || 'aymkira/KENO';
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

// جلب SHA الملف من GitHub (مطلوب للتعديل)
async function getFileSHA(filePath) {
  try {
    const res = await ghRequest('GET', `/contents/${filePath}`);
    if (res.status === 200) return res.data.sha;
  } catch(_) {}
  return null;
}

// رفع أو تعديل ملف على GitHub
async function pushToGitHub(filePath, content, message) {
  const sha      = await getFileSHA(filePath);
  const encoded  = Buffer.from(content).toString('base64');
  const body     = {
    message,
    content: encoded,
    ...(sha ? { sha } : {}),
  };
  return await ghRequest('PUT', `/contents/${filePath}`, body);
}

// حذف ملف من GitHub
async function deleteFromGitHub(filePath, message) {
  const sha = await getFileSHA(filePath);
  if (!sha) return { status: 404 };
  return await ghRequest('DELETE', `/contents/${filePath}`, { message, sha });
}

// جلب محتوى ملف من GitHub
async function getFromGitHub(filePath) {
  const res = await ghRequest('GET', `/contents/${filePath}`);
  if (res.status === 200 && res.data.content) {
    return Buffer.from(res.data.content, 'base64').toString('utf8');
  }
  return null;
}

// ══════════════════════════════════════════════════
//  مساعدات
// ══════════════════════════════════════════════════
function safePath(filePath) {
  const clean = filePath.trim().replace(/\.\.\//g, '').replace(/^\//, '');
  return clean;
}

function getSize(content) {
  const bytes = Buffer.byteLength(content, 'utf8');
  return bytes < 1024 ? `${bytes}B` : `${(bytes/1024).toFixed(1)}KB`;
}

// ══════════════════════════════════════════════════
//  Config
// ══════════════════════════════════════════════════
module.exports.config = {
  name: 'بسكت',
  version: '1.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'تعديل ملفات البوت وحفظها على GitHub — للمطور فقط',
  commandCategory: 'developer',
  usages: `.بسكت قرأ [مسار]           ← عرض محتوى الملف
.بسكت كتب [مسار] | [محتوى] ← كتابة وحفظ على GitHub
.بسكت حذف [مسار]            ← حذف من البوت وGitHub
.بسكت سحب [مسار]            ← تحميل من GitHub للبوت
.بسكت قائمة [مجلد]           ← عرض الملفات`,
  cooldowns: 5,
};

// ══════════════════════════════════════════════════
//  handleReply — لتعديل محتوى الملف
// ══════════════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (senderID !== handleReply.author) return;
  if (handleReply.action !== 'edit') return;

  const filePath = handleReply.filePath;
  const content  = body;
  const wait     = await api.sendMessage('⏳ جاري الحفظ...', threadID);

  try {
    // حفظ على البوت محلياً
    const fullPath = path.resolve(ROOT, filePath);
    fs.ensureDirSync(path.dirname(fullPath));
    fs.writeFileSync(fullPath, content, 'utf8');

    // رفع على GitHub
    const res = await pushToGitHub(
      filePath, content,
      `✏️ تعديل ${path.basename(filePath)} — KIRA Bot`
    );

    api.unsendMessage(wait.messageID);

    if (res.status === 200 || res.status === 201) {
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم الحفظ!\n\n📄 ${filePath}\n💾 ${getSize(content)}\n🐙 GitHub: ✅ محدّث`,
        threadID, messageID
      );
    } else {
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n⚠️ حُفظ محلياً لكن GitHub فشل!\n\n❌ ${res.data?.message || res.status}`,
        threadID, messageID
      );
    }
  } catch (e) {
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
  //  .بسكت قائمة [مجلد]
  // ════════════════════════════════════════
  if (sub === 'قائمة' || sub === 'ls') {
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
    } catch (e) {
      return api.sendMessage(`❌ ما أقدر أقرأ المجلد: ${e.message}`, threadID, messageID);
    }
  }

  // ════════════════════════════════════════
  //  .بسكت قرأ [مسار]
  // ════════════════════════════════════════
  if (sub === 'قرأ' || sub === 'read') {
    const filePath = safePath(args.slice(1).join(' '));
    if (!filePath) return api.sendMessage('📝 اكتب مسار الملف', threadID, messageID);

    const fullPath = path.resolve(ROOT, filePath);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const preview = content.length > 2000
        ? content.slice(0, 2000) + '\n\n... [مقطوع — الملف كبير]'
        : content;

      const sent = await api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n📄 ${filePath}\n💾 ${getSize(content)}\n━━━━━━━━━━━━━━\n${preview}\n━━━━━━━━━━━━━━\n✏️ رد على هذه الرسالة بالمحتوى الجديد للتعديل`,
        threadID, messageID
      );

      global.client?.handleReply?.push({
        name:      module.exports.config.name,
        messageID: sent.messageID,
        author:    senderID,
        action:    'edit',
        filePath,
      });

    } catch (e) {
      return api.sendMessage(`❌ ما أقدر أقرأ الملف: ${e.message}`, threadID, messageID);
    }
    return;
  }

  // ════════════════════════════════════════
  //  .بسكت كتب [مسار] | [محتوى]
  // ════════════════════════════════════════
  if (sub === 'كتب' || sub === 'write') {
    const rest  = (body || '').split('|');
    if (rest.length < 2) return api.sendMessage(
      '📝 الاستخدام:\n.بسكت كتب [مسار] | [المحتوى]',
      threadID, messageID
    );

    const filePath = safePath(rest[0].replace(/^\.بسكت\s+كتب\s+/i, '').trim());
    const content  = rest.slice(1).join('|').trim();

    if (!filePath || !content) return api.sendMessage('❌ مسار أو محتوى فارغ', threadID, messageID);

    const wait = await api.sendMessage('⏳ جاري الكتابة والرفع...', threadID);

    try {
      // حفظ محلي
      const fullPath = path.resolve(ROOT, filePath);
      fs.ensureDirSync(path.dirname(fullPath));
      fs.writeFileSync(fullPath, content, 'utf8');

      // GitHub
      const res = await pushToGitHub(filePath, content, `✏️ ${path.basename(filePath)} — KIRA Bot`);
      api.unsendMessage(wait.messageID);

      const ghStatus = (res.status === 200 || res.status === 201) ? '✅' : `❌ (${res.status})`;
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم الكتابة!\n\n📄 ${filePath}\n💾 ${getSize(content)}\n🐙 GitHub: ${ghStatus}`,
        threadID, messageID
      );
    } catch (e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ════════════════════════════════════════
  //  .بسكت حذف [مسار]
  // ════════════════════════════════════════
  if (sub === 'حذف' || sub === 'delete') {
    const filePath = safePath(args.slice(1).join(' '));
    if (!filePath) return api.sendMessage('📝 اكتب مسار الملف للحذف', threadID, messageID);

    const wait = await api.sendMessage(`⏳ جاري حذف ${filePath}...`, threadID);

    try {
      // حذف محلي
      const fullPath = path.resolve(ROOT, filePath);
      let localStatus = '✅';
      try { fs.removeSync(fullPath); } catch(_) { localStatus = '⚠️ ما موجود محلياً'; }

      // حذف من GitHub
      const res       = await deleteFromGitHub(filePath, `🗑️ حذف ${path.basename(filePath)} — KIRA Bot`);
      const ghStatus  = (res.status === 200) ? '✅' : res.status === 404 ? '⚠️ ما موجود' : `❌ (${res.status})`;

      api.unsendMessage(wait.messageID);
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n🗑️ تم الحذف!\n\n📄 ${filePath}\n💾 محلي: ${localStatus}\n🐙 GitHub: ${ghStatus}`,
        threadID, messageID
      );
    } catch (e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ════════════════════════════════════════
  //  .بسكت سحب [مسار]
  // ════════════════════════════════════════
  if (sub === 'سحب' || sub === 'pull') {
    const filePath = safePath(args.slice(1).join(' '));
    if (!filePath) return api.sendMessage('📝 اكتب مسار الملف للسحب من GitHub', threadID, messageID);

    const wait = await api.sendMessage(`⏳ جاري السحب من GitHub...`, threadID);

    try {
      const content = await getFromGitHub(filePath);
      if (!content) {
        api.unsendMessage(wait.messageID);
        return api.sendMessage(`❌ الملف ما موجود على GitHub: ${filePath}`, threadID, messageID);
      }

      const fullPath = path.resolve(ROOT, filePath);
      fs.ensureDirSync(path.dirname(fullPath));
      fs.writeFileSync(fullPath, content, 'utf8');

      api.unsendMessage(wait.messageID);
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n⬇️ تم السحب!\n\n📄 ${filePath}\n💾 ${getSize(content)}\n✅ محفوظ على البوت`,
        threadID, messageID
      );
    } catch (e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ════════════════════════════════════════
  //  مساعدة
  // ════════════════════════════════════════
  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n📁 أمر بسكت — تعديل ملفات البوت\n\n` +
    `.بسكت قرأ [مسار]           ← عرض الملف + تعديل بالرد\n` +
    `.بسكت كتب [مسار] | [محتوى] ← كتابة مباشرة\n` +
    `.بسكت حذف [مسار]            ← حذف من البوت وGitHub\n` +
    `.بسكت سحب [مسار]            ← تحميل من GitHub\n` +
    `.بسكت قائمة [مجلد]           ← عرض الملفات\n\n` +
    `مثال:\n.بسكت قرأ script/commands/utility/كيرا.js`,
    threadID, messageID
  );
};
