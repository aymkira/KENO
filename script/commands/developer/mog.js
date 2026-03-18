// ╔══════════════════════════════════════════════════════════════════╗
// ║                    أمر .mog — نسخ احتياطي MongoDB               ║
// ║   .mog down  ← تنزيل كل محتوى السحابة كملف JS                  ║
// ║   .mog up    ← رفع الملف واستبدال السحابة كاملاً               ║
// ╚══════════════════════════════════════════════════════════════════╝

const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');

// ── الإعدادات ─────────────────────────────────────
const configPath = path.join(__dirname, '../../..', 'config.json');
const CFG        = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const MONGO_URI  = CFG.MONGODB_URI || 'mongodb+srv://kkayman200_db_user:ukhzlLzjRxQgSnTl@cluster0.7nsuoil.mongodb.net/KiraDB?retryWrites=true&w=majority';
const ADMIN_IDS  = CFG.ADMINBOT || [];

module.exports.config = {
  name: 'mog',
  aliases: ['mongo', 'db'],
  version: '1.0.0',
  credits: 'ayman',
  description: 'نسخ احتياطي لـ MongoDB — تنزيل ورفع',
  usage: `.mog down  ← تنزيل كل البيانات
.mog up    ← رفع ملف واستبدال البيانات`,
  cooldown: 10,
  permissions: [2],   // أدمن فقط
  category: 'developer',
};

// ══════════════════════════════════════════════════
//  اتصال مؤقت بـ MongoDB
// ══════════════════════════════════════════════════
async function getConnection() {
  // استخدم اتصال منفصل لعدم التعارض مع mongoose الرئيسي
  const conn = await mongoose.createConnection(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  }).asPromise();
  return conn;
}

// ══════════════════════════════════════════════════
//  تنزيل كل البيانات من السحابة
// ══════════════════════════════════════════════════
async function downloadAll() {
  const conn = await getConnection();
  const db   = conn.db;

  // جلب كل الـ collections
  const collections = await db.listCollections().toArray();
  const backup = {
    metadata: {
      exportDate:   new Date().toISOString(),
      database:     db.databaseName,
      collections:  collections.length,
      exportedBy:   'KIRA MOG System',
    },
    data: {}
  };

  for (const col of collections) {
    const name = col.name;
    const docs = await db.collection(name).find({}).toArray();
    backup.data[name] = docs;
  }

  await conn.close();
  return backup;
}

// ══════════════════════════════════════════════════
//  رفع البيانات واستبدال السحابة
// ══════════════════════════════════════════════════
async function uploadAll(backup) {
  if (!backup?.data) throw new Error('ملف غير صالح — لا يوجد data');

  const conn = await getConnection();
  const db   = conn.db;

  const results = [];

  for (const [colName, docs] of Object.entries(backup.data)) {
    if (!Array.isArray(docs)) continue;

    const col = db.collection(colName);

    // حذف الكل القديم
    const deleted = await col.deleteMany({});

    // رفع الجديد
    let inserted = 0;
    if (docs.length > 0) {
      // تنظيف الـ _id لتجنب تعارضات
      const cleanDocs = docs.map(doc => {
        const d = { ...doc };
        // احتفظ بالـ _id الأصلي
        return d;
      });
      const res = await col.insertMany(cleanDocs, { ordered: false });
      inserted = res.insertedCount;
    }

    results.push({ collection: colName, deleted: deleted.deletedCount, inserted });
  }

  await conn.close();
  return results;
}

// ══════════════════════════════════════════════════
//  RUN
// ══════════════════════════════════════════════════
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  // التحقق من الصلاحية
  if (!ADMIN_IDS.includes(senderID)) {
    return api.sendMessage('❌ هذا الأمر للأدمن فقط.', threadID, messageID);
  }

  const sub = args[0]?.toLowerCase();

  // ════════════════════════════════════════
  //  .mog down — تنزيل
  // ════════════════════════════════════════
  if (sub === 'down') {
    const waitMsg = await api.sendMessage('⏳ جاري استخراج بيانات السحابة...', threadID);

    try {
      const backup = await downloadAll();

      // إحصائيات
      const totalDocs = Object.values(backup.data).reduce((s, d) => s + d.length, 0);
      const colNames  = Object.keys(backup.data);

      // إنشاء ملف JS قابل للتنفيذ
      const jsContent = `// ╔══════════════════════════════════════════════╗
// ║     KIRA MongoDB Backup                      ║
// ║     تاريخ: ${backup.metadata.exportDate}   ║
// ║     قاعدة البيانات: ${backup.metadata.database}                 ║
// ╚══════════════════════════════════════════════╝
//
// لرفع هذا الملف: أرسله ورد عليه بـ .mog up
//
// المجموعات: ${colNames.join(', ')}
// إجمالي السجلات: ${totalDocs}

module.exports = ${JSON.stringify(backup, null, 2)};
`;

      // حفظ الملف مؤقتاً
      const filePath = path.join(os.tmpdir(), `kira_backup_${Date.now()}.js`);
      fs.writeFileSync(filePath, jsContent, 'utf8');

      // حذف رسالة الانتظار
      api.unsendMessage(waitMsg.messageID);

      // إرسال الملف
      await api.sendMessage({
        body: `✅ تم تصدير قاعدة البيانات\n\n📦 المجموعات (${colNames.length}):\n${colNames.map(c => `• ${c}: ${backup.data[c].length} سجل`).join('\n')}\n\n📊 الإجمالي: ${totalDocs} سجل\n📅 ${new Date().toLocaleString('ar')}\n\n💡 لاستعادة: رد على الملف بـ .mog up`,
        attachment: fs.createReadStream(filePath),
      }, threadID, messageID);

      // حذف الملف المؤقت
      setTimeout(() => {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }, 30000);

    } catch (err) {
      api.unsendMessage(waitMsg.messageID);
      console.error('[mog down]', err);
      return api.sendMessage(`❌ فشل التصدير:\n${err.message}`, threadID, messageID);
    }
  }

  // ════════════════════════════════════════
  //  .mog up — رفع (يجب أن يكون رداً على ملف)
  // ════════════════════════════════════════
  else if (sub === 'up') {
    const reply = event.messageReply;

    if (!reply?.attachments?.length) {
      return api.sendMessage(
        '⚠️ كيفية الاستخدام:\n\nرد على ملف الـ backup بـ .mog up\n\nالملف يجب أن يكون بصيغة .js تم تنزيله بـ .mog down',
        threadID, messageID
      );
    }

    const attachment = reply.attachments[0];
    if (!attachment.url) {
      return api.sendMessage('❌ ما أقدر أوصل للملف.', threadID, messageID);
    }

    const waitMsg = await api.sendMessage('⏳ جاري تحميل الملف والاستعادة...', threadID);

    try {
      // تنزيل الملف
      const fileContent = await downloadFile(attachment.url);

      // تحليل المحتوى
      let backup;
      try {
        // إزالة module.exports = وتحليل الـ JSON
        const jsonStr = fileContent
          .replace(/^[\s\S]*?module\.exports\s*=\s*/m, '')
          .replace(/;\s*$/, '')
          .trim();
        backup = JSON.parse(jsonStr);
      } catch (e) {
        // محاولة ثانية: تحليل مباشر
        try {
          backup = JSON.parse(fileContent);
        } catch {
          throw new Error('الملف غير صالح أو تالف');
        }
      }

      // التحقق من صحة الملف
      if (!backup?.data || typeof backup.data !== 'object') {
        throw new Error('هيكل الملف غير صحيح — لا يوجد data');
      }

      // تأكيد من الأدمن
      const colCount  = Object.keys(backup.data).length;
      const totalDocs = Object.values(backup.data).reduce((s, d) => s + (Array.isArray(d) ? d.length : 0), 0);

      api.unsendMessage(waitMsg.messageID);

      // رسالة تأكيد
      const confirmMsg = await api.sendMessage(
        `⚠️ تأكيد الاستعادة\n\n📦 سيتم استبدال:\n${Object.keys(backup.data).map(c => `• ${c}: ${(backup.data[c]||[]).length} سجل`).join('\n')}\n\n📊 الإجمالي: ${totalDocs} سجل\n📅 تاريخ الـ backup: ${backup.metadata?.exportDate || 'غير معروف'}\n\n⚠️ هذا سيحذف كل البيانات الحالية!\n\n✅ رد بـ "نعم" للمتابعة\n❌ رد بـ "لا" للإلغاء`,
        threadID
      );

      // حفظ للـ handleReply
      global.client?.handleReply?.push({
        name:       module.exports.config.name,
        messageID:  confirmMsg.messageID,
        author:     senderID,
        threadID,
        action:     'confirm_upload',
        backup:     backup,
      });

    } catch (err) {
      api.unsendMessage(waitMsg.messageID);
      console.error('[mog up]', err);
      return api.sendMessage(`❌ فشل التحميل:\n${err.message}`, threadID, messageID);
    }
  }

  // ════════════════════════════════════════
  //  .mog (بدون sub) — عرض المساعدة
  // ════════════════════════════════════════
  else {
    try {
      const conn = await getConnection();
      const cols = await conn.db.listCollections().toArray();
      let stats  = '';
      for (const col of cols) {
        const count = await conn.db.collection(col.name).countDocuments();
        stats += `\n• ${col.name}: ${count} سجل`;
      }
      await conn.close();

      return api.sendMessage(
        `🗄️ KIRA — MongoDB Manager\n━━━━━━━━━━━━━━\n📦 قاعدة البيانات: ${conn.db?.databaseName || 'KiraDB'}\n${stats}\n━━━━━━━━━━━━━━\n.mog down  ← تصدير كل البيانات\n.mog up    ← استيراد (رد على ملف)`,
        threadID, messageID
      );
    } catch (err) {
      return api.sendMessage(
        `🗄️ MOG — MongoDB Manager\n\n.mog down  ← تصدير\n.mog up    ← استيراد\n\n❌ تعذّر الاتصال: ${err.message}`,
        threadID, messageID
      );
    }
  }
};

// ══════════════════════════════════════════════════
//  HANDLE REPLY — تأكيد الرفع
// ══════════════════════════════════════════════════
module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID, body } = event;

  if (handleReply.author !== senderID) return;
  if (handleReply.action !== 'confirm_upload') return;

  const answer = body?.trim().toLowerCase();

  if (!['نعم', 'yes', 'y', 'اه', 'أه', 'ok'].includes(answer)) {
    return api.sendMessage('❌ تم إلغاء العملية.', threadID, messageID);
  }

  const waitMsg = await api.sendMessage('⏳ جاري الاستعادة... لا تغلق البوت', threadID);

  try {
    const results = await uploadAll(handleReply.backup);

    api.unsendMessage(waitMsg.messageID);

    const summary = results.map(r =>
      `• ${r.collection}: حذف ${r.deleted} ← رفع ${r.inserted}`
    ).join('\n');

    const totalInserted = results.reduce((s, r) => s + r.inserted, 0);

    return api.sendMessage(
      `✅ تمت الاستعادة بنجاح!\n\n${summary}\n\n📊 إجمالي: ${totalInserted} سجل\n📅 ${new Date().toLocaleString('ar')}`,
      threadID, messageID
    );

  } catch (err) {
    api.unsendMessage(waitMsg.messageID);
    console.error('[mog upload]', err);
    return api.sendMessage(`❌ فشلت الاستعادة:\n${err.message}`, threadID, messageID);
  }
};

// ══════════════════════════════════════════════════
//  دالة مساعدة: تنزيل ملف من URL
// ══════════════════════════════════════════════════
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const https  = require('https');
    const http   = require('http');
    const client = url.startsWith('https') ? https : http;

    client.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end',  () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}
