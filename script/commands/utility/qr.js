const QRCode = require('qrcode');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

module.exports.config = {
  name: 'qr', aliases: ['qrcode', 'باركود'],
  version: '1.0', credits: 'ayman',
  commandCategory: 'utility',
  description: 'إنشاء QR Code لأي نص أو رابط',
  usage: '.qr [النص أو الرابط]', cooldown: 5,
  };

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const text = args.join(' ');
  if (!text) return api.sendMessage(
`╔═══════════════════╗
║   📱 QR Code       ║
╚═══════════════════╝

📝 الاستخدام: .qr [النص أو الرابط]

أمثلة:
  • .qr https://google.com
  • .qr مرحبا بالعالم
  • .qr +9647801234567`, threadID, messageID);

  const wait = await api.sendMessage('⚡ جاري إنشاء QR Code...', threadID);
  const filePath = path.join(os.tmpdir(), `qr_${Date.now()}.png`);

  try {
    await QRCode.toFile(filePath, text, {
      width: 512,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    });

    api.unsendMessage(wait.messageID);
    await api.sendMessage({
      body:
`╔═══════════════════╗
║   📱 QR Code       ║
╚═══════════════════╝

📝 النص: ${text.slice(0,60)}${text.length>60?'...':''}
📏 الطول: ${text.length} حرف
🔒 مستوى التصحيح: عالي (H)
━━━━━━━━━━━━━━━━━━━━━
✅ امسح الكود بكاميرا أي جهاز`,
      attachment: fs.createReadStream(filePath),
    }, threadID, messageID);

  } catch (e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ فشل إنشاء QR: ${e.message}`, threadID, messageID);
  } finally {
    setTimeout(() => { try { fs.unlinkSync(filePath); } catch(_){} }, 30000);
  }
};
