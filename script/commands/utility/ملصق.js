const axios = require('axios');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');

module.exports.config = {
  name: 'ملصق', aliases: ['gifapi', 'صورة_متحركة'],
  version: '1.0', credits: 'ayman',
  commandCategory: 'utility',
  description: 'بحث عن GIF من Giphy',
  usage: '.ملصق [الكلمة]', cooldown: 5,
  };

// Giphy API Key مجانية
const GIPHY_KEY = 'dc6zaTOxFJmzC'; // مفتاح عام مجاني

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const query = args.join(' ');

  if (!query) return api.sendMessage(
`╔═══════════════════╗
║   🎞️ بحث GIF      ║
╚═══════════════════╝

📝 الاستخدام: .ملصق [الكلمة]

أمثلة:
  • .ملصق funny
  • .ملصق cat
  • .ملصق wow
  • .ملصق anime`, threadID, messageID);

  const wait = await api.sendMessage('🎞️ جاري البحث عن GIF...', threadID);
  try {
    const res = await axios.get('https://api.giphy.com/v1/gifs/search', {
      params: { api_key: GIPHY_KEY, q: query, limit: 10, rating: 'g' },
      timeout: 8000,
    });

    const gifs = res.data.data;
    if (!gifs?.length) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ ما لقيت GIF لـ "${query}"`, threadID, messageID);
    }

    // اختيار عشوائي
    const gif     = gifs[Math.floor(Math.random() * gifs.length)];
    const gifUrl  = gif.images.original.url;
    const title   = gif.title || query;
    const width   = gif.images.original.width;
    const height  = gif.images.original.height;
    const sizeMb  = (gif.images.original.size / 1024 / 1024).toFixed(1);

    // تنزيل الـ GIF
    const filePath = path.join(os.tmpdir(), `gif_${Date.now()}.gif`);
    const gifRes   = await axios.get(gifUrl, { responseType: 'arraybuffer', timeout: 15000 });
    fs.writeFileSync(filePath, gifRes.data);

    api.unsendMessage(wait.messageID);
    await api.sendMessage({
      body:
`🎞️ ${title}
━━━━━━━━━━━━━━
📐 ${width}×${height} | 💾 ${sizeMb} MB
🔍 "${query}" — Giphy`,
      attachment: fs.createReadStream(filePath),
    }, threadID, messageID);

    setTimeout(() => { try { fs.unlinkSync(filePath); } catch(_){} }, 60000);

  } catch (e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
  }
};
