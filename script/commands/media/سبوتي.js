module.exports.config = {
  name: "سبوتي",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "البحث عن الأغاني وإرسالها (نسخة مستقرة)",
  commandCategory: "media",
  usages: "سبوتي [اسم الأغنية]",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");
  const { threadID, messageID, senderID } = event;

  const songName = args.join(" ");

  if (!songName) {
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\nيرجى كتابة اسم الأغنية التي تبحث عنها!", threadID, messageID);
  }

  api.setMessageReaction("🔍", messageID, () => {}, true);

  try {
    // استخدام API ديزر للبحث
    const res = await axios.get(`https://api.deezer.com/search?q=${encodeURIComponent(songName)}&limit=1`);
    
    if (!res.data.data || res.data.data.length === 0) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\nلم أجد هذا المقطع، جرب كتابة اسم الفنان مع الأغنية.", threadID, messageID);
    }

    const song = res.data.data[0];
    const audioUrl = song.preview; // رابط المقطع الصوتي (30 ثانية بجودة عالية)
    const title = song.title;
    const artist = song.artist.name;
    const coverUrl = song.album.cover_big;

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    const audioPath = path.join(cacheDir, `${Date.now()}_audio.mp3`);
    const coverPath = path.join(cacheDir, `${Date.now()}_cover.jpg`);

    api.setMessageReaction("🎵", messageID, () => {}, true);

    // تحميل الغلاف والصوت
    const [audioRes, coverRes] = await Promise.all([
      axios.get(audioUrl, { responseType: "arraybuffer" }),
      axios.get(coverUrl, { responseType: "arraybuffer" })
    ]);

    fs.writeFileSync(audioPath, Buffer.from(audioRes.data));
    fs.writeFileSync(coverPath, Buffer.from(coverRes.data));

    const msg = {
      body: `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗦𝗣𝗢𝗧𝗜𝗙𝗬 ━━ ⌬\n\n` +
            `🎤 الفنان: ${artist}\n` +
            `🎵 الأغنية: ${title}\n\n` +
            `جاري إرسال المقطع الصوتي...`,
      attachment: fs.createReadStream(coverPath)
    };

    // إرسال الصورة مع النص أولاً، ثم إرسال المقطع الصوتي
    return api.sendMessage(msg, threadID, (err, info) => {
      api.sendMessage({
        body: `🎶 مقطع: ${title}`,
        attachment: fs.createReadStream(audioPath)
      }, threadID, () => {
        // تنظيف الملفات بعد الإرسال
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        api.setMessageReaction("✅", messageID, () => {}, true);
      }, messageID);
    }, messageID);

  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\nحدث خطأ أثناء الاتصال بالمخدم، حاول لاحقاً.", threadID, messageID);
  }
};
