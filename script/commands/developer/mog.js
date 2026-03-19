// ╔══════════════════════════════════════════════════════════════════╗
// ║              أمر .mog — نسخ احتياطي GitHub JSON                ║
// ║   .mog down  ← تنزيل كل البيانات كملف JSON                    ║
// ║   .mog up    ← رفع ملف واستعادة البيانات                      ║
// ╚══════════════════════════════════════════════════════════════════╝

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const db   = require(path.join(process.cwd(), 'includes', 'data.js'));

const configPath = path.join(__dirname, '../../..', 'config.json');
const CFG        = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const ADMIN_IDS  = CFG.ADMINBOT || [];

module.exports.config = {
  name: 'mog',
  aliases: ['backup', 'db'],
  version: '2.0.0',
  credits: 'ayman',
  description: 'نسخ احتياطي لـ GitHub JSON — تنزيل ورفع',
  usage: `.mog down  ← تنزيل كل البيانات
.mog up    ← رفع ملف واستعادة البيانات`,
  cooldown: 10,
  permissions: [2],
  category: 'developer',
};

async function downloadAll() {
  const files = Object.values(db.FILES);
  const backup = {
    metadata: { exportDate: new Date().toISOString(), source: 'GitHub JSON — KIRA data.js' },
    data: {}
  };
  for (const file of files) {
    try { backup.data[file] = await db.loadFile(file); }
    catch(e) { backup.data[file] = {}; }
  }
  return backup;
}

async function uploadAll(backup) {
  if (!backup?.data) throw new Error('ملف غير صالح');
  const results = [];
  for (const [filePath, content] of Object.entries(backup.data)) {
    try {
      await db.writeCustomFile(filePath, content, 'restore from backup');
      results.push({ file: filePath, inserted: Object.keys(content).length });
    } catch(e) {
      results.push({ file: filePath, inserted: 0, error: e.message });
    }
  }
  return results;
}

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  if (!ADMIN_IDS.includes(senderID))
    return api.sendMessage('❌ هذا الأمر للأدمن فقط.', threadID, messageID);

  const sub = args[0]?.toLowerCase();

  if (sub === 'down') {
    const waitMsg = await api.sendMessage('⏳ جاري استخراج البيانات...', threadID);
    try {
      const backup = await downloadAll();
      const totalDocs = Object.values(backup.data).reduce((s, d) => s + Object.keys(d).length, 0);
      const jsContent = `// KIRA GitHub JSON Backup — ${backup.metadata.exportDate}\n// لرفع هذا الملف: أرسله ورد عليه بـ .mog up\nmodule.exports = ${JSON.stringify(backup, null, 2)};`;
      const filePath = path.join(os.tmpdir(), `kira_backup_${Date.now()}.js`);
      fs.writeFileSync(filePath, jsContent, 'utf8');
      api.unsendMessage(waitMsg.messageID);
      await api.sendMessage({
        body: `✅ تم التصدير\n\n${Object.entries(backup.data).map(([f,d]) => `• ${f}: ${Object.keys(d).length} سجل`).join('\n')}\n\n📊 الإجمالي: ${totalDocs} سجل\n💡 لاستعادة: رد على الملف بـ .mog up`,
        attachment: fs.createReadStream(filePath),
      }, threadID, messageID);
      setTimeout(() => { try { fs.unlinkSync(filePath); } catch(_) {} }, 30000);
    } catch(err) {
      api.unsendMessage(waitMsg.messageID);
      api.sendMessage(`❌ فشل التصدير: ${err.message}`, threadID, messageID);
    }
  }

  else if (sub === 'up') {
    const reply = event.messageReply;
    if (!reply?.attachments?.length)
      return api.sendMessage('⚠️ رد على ملف الـ backup بـ .mog up', threadID, messageID);

    const waitMsg = await api.sendMessage('⏳ جاري التحميل والاستعادة...', threadID);
    try {
      const fileContent = await downloadFile(reply.attachments[0].url);
      let backup;
      try {
        const jsonStr = fileContent.replace(/^[\s\S]*?module\.exports\s*=\s*/m, '').replace(/;\s*$/, '').trim();
        backup = JSON.parse(jsonStr);
      } catch(e) { backup = JSON.parse(fileContent); }

      if (!backup?.data) throw new Error('هيكل الملف غير صحيح');
      const total = Object.values(backup.data).reduce((s, d) => s + Object.keys(d).length, 0);
      api.unsendMessage(waitMsg.messageID);

      const confirmMsg = await api.sendMessage(
        `⚠️ تأكيد الاستعادة\n\n${Object.entries(backup.data).map(([f,d]) => `• ${f}: ${Object.keys(d).length} سجل`).join('\n')}\n\n📊 الإجمالي: ${total} سجل\n\n✅ رد بـ "نعم" للمتابعة أو "لا" للإلغاء`,
        threadID
      );
      global.client?.handleReply?.push({
        name: module.exports.config.name,
        messageID: confirmMsg.messageID,
        author: senderID,
        action: 'confirm_upload',
        backup,
      });
    } catch(err) {
      api.unsendMessage(waitMsg.messageID);
      api.sendMessage(`❌ فشل التحميل: ${err.message}`, threadID, messageID);
    }
  }

  else {
    const stats = await db.stats();
    api.sendMessage(
      `🗄️ KIRA — GitHub JSON Manager\n━━━━━━━━━━━━━━\n👥 المستخدمين: ${stats.users}\n💰 المحافظ: ${stats.wallets}\n🚫 المحظورين: ${stats.activeBans}\n🏷️ المجموعات: ${stats.threads}\n\n.mog down  ← تصدير\n.mog up    ← استيراد (رد على ملف)`,
      threadID, messageID
    );
  }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID, body } = event;
  if (handleReply.author !== senderID) return;
  if (handleReply.action !== 'confirm_upload') return;

  if (!['نعم','yes','y','اه','أه','ok'].includes(body?.trim().toLowerCase()))
    return api.sendMessage('❌ تم إلغاء العملية.', threadID, messageID);

  const waitMsg = await api.sendMessage('⏳ جاري الاستعادة...', threadID);
  try {
    const results = await uploadAll(handleReply.backup);
    api.unsendMessage(waitMsg.messageID);
    const total = results.reduce((s,r) => s + r.inserted, 0);
    api.sendMessage(
      `✅ تمت الاستعادة!\n\n${results.map(r => `• ${r.file}: ${r.inserted} سجل`).join('\n')}\n\n📊 الإجمالي: ${total} سجل`,
      threadID, messageID
    );
  } catch(err) {
    api.unsendMessage(waitMsg.messageID);
    api.sendMessage(`❌ فشلت الاستعادة: ${err.message}`, threadID, messageID);
  }
};

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? require('https') : require('http');
    client.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302)
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}
