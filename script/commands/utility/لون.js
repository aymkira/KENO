const Vibrant = require('node-vibrant');
const axios   = require('axios');
const fs      = require('fs');
const path    = require('path');
const os      = require('os');

module.exports.config = {
  name: 'لون', aliases: ['colors', 'ألوان', 'palette'],
  version: '1.0', credits: 'ayman',
  commandCategory: 'utility',
  description: 'استخراج الألوان المهيمنة من أي صورة',
  usage: '.لون (مع إرسال صورة أو رابط)',
  cooldown: 5,
  };

const hexToRgb = hex => {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgb(${r},${g},${b})`;
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply } = event;

  // جلب الصورة
  let imageUrl = null;
  if (event.attachments?.length) {
    imageUrl = event.attachments.find(a => a.type === 'photo')?.url;
  }
  if (!imageUrl && messageReply?.attachments?.length) {
    imageUrl = messageReply.attachments.find(a => a.type === 'photo')?.url;
  }
  if (!imageUrl && args[0]?.startsWith('http')) {
    imageUrl = args[0];
  }

  if (!imageUrl) return api.sendMessage(
`╔══════════════════════╗
║   🎨 استخراج الألوان ║
╚══════════════════════╝

📝 الاستخدام:
  • أرسل صورة + .لون
  • رد على صورة + .لون
  • .لون [رابط الصورة]`, threadID, messageID);

  const wait = await api.sendMessage('🎨 جاري تحليل ألوان الصورة...', threadID);
  const filePath = path.join(os.tmpdir(), `img_${Date.now()}.jpg`);

  try {
    // تنزيل الصورة
    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
    fs.writeFileSync(filePath, imgRes.data);

    // استخراج الألوان
    const palette = await Vibrant.from(filePath).getPalette();

    const swatches = [
      { name: '🔴 المهيمن',     key: 'Vibrant'      },
      { name: '🌑 الداكن',      key: 'DarkVibrant'  },
      { name: '☀️ الفاتح',      key: 'LightVibrant' },
      { name: '🔇 الخافت',      key: 'Muted'        },
      { name: '🌙 الداكن الخافت', key: 'DarkMuted'  },
      { name: '💫 الفاتح الخافت', key: 'LightMuted' },
    ];

    const colorLines = swatches
      .filter(s => palette[s.key])
      .map(s => {
        const sw  = palette[s.key];
        const hex = sw.hex;
        const pop = (sw.population / 100).toFixed(0);
        const rgb = hexToRgb(hex);
        return `${s.name}:\n  HEX: ${hex} | ${rgb}\n  التشبع: ${(sw.population/50).toFixed(1)}%`;
      }).join('\n\n');

    api.unsendMessage(wait.messageID);
    return api.sendMessage(
`╔══════════════════════╗
║   🎨 تحليل الألوان  ║
╚══════════════════════╝

${colorLines}

━━━━━━━━━━━━━━━━━━━━━━
💡 يمكنك استخدام هذه الألوان في التصميم!
🎨 استخرجت ${swatches.filter(s=>palette[s.key]).length} ألوان`, threadID, messageID);

  } catch (e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ فشل تحليل الصورة: ${e.message}`, threadID, messageID);
  } finally {
    setTimeout(() => { try { fs.unlinkSync(filePath); } catch(_){} }, 30000);
  }
};
