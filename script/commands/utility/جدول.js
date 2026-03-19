const ExcelJS = require('exceljs');
const fs      = require('fs');
const path    = require('path');
const os      = require('os');

module.exports.config = {
  name: 'جدول', aliases: ['xlsx', 'جدول'],
  version: '1.0', credits: 'ayman',
  commandCategory: 'utility',
  description: 'إنشاء ملف Excel من بيانات',
  usage: '.جدول [عنوان] | [عمود1,عمود2] | [بيانات مفصولة بفاصلة]',
  cooldown: 10,
  };

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const input = args.join(' ');

  if (!input) return api.sendMessage(
`╔══════════════════════╗
║   📊 مولّد Excel     ║
╚══════════════════════╝

📝 الاستخدام:
.جدول [عنوان] | [عمود1,عمود2,عمود3] | [ص1ع1,ص1ع2,ص1ع3] | [ص2ع1,ص2ع2,ص2ع3]

مثال:
.excel قائمة الطلاب | الاسم,العمر,الدرجة | أحمد,20,95 | محمد,21,88 | سارة,19,97`, threadID, messageID);

  const parts = input.split('|').map(p => p.trim());
  if (parts.length < 3) return api.sendMessage('❌ الصيغة غير صحيحة. مثال: .excel جدول | عمود1,عمود2 | بيانات1,بيانات2', threadID, messageID);

  const sheetName = parts[0] || 'KIRA Data';
  const headers   = parts[1].split(',').map(h => h.trim());
  const rows      = parts.slice(2).map(row => row.split(',').map(cell => cell.trim()));

  const wait = await api.sendMessage('📊 جاري إنشاء ملف Excel...', threadID);
  const filePath = path.join(os.tmpdir(), `kira_${Date.now()}.xlsx`);

  try {
    const workbook  = new ExcelJS.Workbook();
    workbook.creator = 'KIRA Bot';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName, {
      pageSetup: { orientation: 'landscape' },
      properties: { tabColor: { argb: 'FFe94560' } },
    });

    // تنسيق العناوين
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell(cell => {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };
      cell.font   = { bold: true, color: { argb: 'FFe94560' }, size: 12 };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFe94560' } } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    headerRow.height = 25;

    // إضافة البيانات
    rows.forEach((row, idx) => {
      const dataRow = worksheet.addRow(row);
      const bgColor = idx % 2 === 0 ? 'FFF5F5F5' : 'FFFFFFFF';
      dataRow.eachCell(cell => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border    = { bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } } };
      });
      dataRow.height = 20;
    });

    // عرض الأعمدة تلقائي
    worksheet.columns.forEach(col => { col.width = 18; });

    // صف المعلومات
    worksheet.addRow([]);
    const infoRow = worksheet.addRow([`📅 تاريخ الإنشاء: ${new Date().toLocaleString('ar')}`, '', `✅ إجمالي الصفوف: ${rows.length}`, '', `🤖 KIRA Bot — Made by Ayman`]);
    infoRow.getCell(1).font = { italic: true, color: { argb: 'FF888888' }, size: 9 };
    infoRow.getCell(3).font = { italic: true, color: { argb: 'FF888888' }, size: 9 };
    infoRow.getCell(5).font = { italic: true, color: { argb: 'FF888888' }, size: 9 };

    await workbook.xlsx.writeFile(filePath);
    const sizekb = (fs.statSync(filePath).size / 1024).toFixed(1);

    api.unsendMessage(wait.messageID);
    await api.sendMessage({
      body:
`╔══════════════════════╗
║   📊 تم إنشاء Excel  ║
╚══════════════════════╝

📋 الجدول: ${sheetName}
📌 الأعمدة: ${headers.join(' | ')}
📝 الصفوف:  ${rows.length}
💾 الحجم:   ${sizekb} KB
━━━━━━━━━━━━━━━━━━━━
✅ جاهز للتنزيل!`,
      attachment: fs.createReadStream(filePath),
    }, threadID, messageID);

  } catch (e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ فشل إنشاء Excel: ${e.message}`, threadID, messageID);
  } finally {
    setTimeout(() => { try { fs.unlinkSync(filePath); } catch(_){} }, 60000);
  }
};
