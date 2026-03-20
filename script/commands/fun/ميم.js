const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");

module.exports.config = {
  name:            "ميم",
  aliases:         ["meme"],
  version:         "1.0.0",
  hasPermssion:    0,
  credits:         "ayman",
  description:     "ميم عشوائي من Reddit",
  commandCategory: "fun",
  usages:          ".ميم",
  cooldowns:       5,
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    const res  = await axios.get("https://meme-api.com/gimme/memes", { timeout: 10000 });
    const data = res.data;

    if (!data?.url) return api.sendMessage("❌ ما لقيت ميم، جرب مجدداً", threadID, messageID);

    // تحقق إنه صورة
    if (!data.url.match(/\.(jpg|jpeg|png|gif|webp)$/i))
      return api.sendMessage(`😂 ${data.title}\n\n🔗 ${data.postLink}`, threadID, messageID);

    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const imgPath = path.join(cacheDir, `meme_${Date.now()}.jpg`);

    const img = await axios.get(data.url, { responseType: "arraybuffer", timeout: 10000 });
    fs.writeFileSync(imgPath, Buffer.from(img.data));

    return api.sendMessage({
      body: `😂 ${data.title}\n👤 u/${data.author} | 🔺 ${data.ups}`,
      attachment: fs.createReadStream(imgPath),
    }, threadID, () => {
      try { fs.unlinkSync(imgPath); } catch(_) {}
    }, messageID);

  } catch(e) {
    return api.sendMessage(`❌ ${e.message}`, threadID, messageID);
  }
};