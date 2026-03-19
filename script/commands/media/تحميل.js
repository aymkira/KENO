const fs   = require("fs-extra");
const axios = require("axios");
const path  = require("path");

function randomString(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++)
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

// ══════════════════════════════════════════
//  حالة التشغيل لكل كروب
// ══════════════════════════════════════════
if (!global._autoDownload) global._autoDownload = {};

const urlPatterns = {
  "تيك توك":   /tiktok\.com/i,
  "فيسبوك":    /facebook\.com|fb\.watch/i,
  "يوتيوب":    /youtube\.com|youtu\.be/i,
  "انستغرام":  /instagram\.com/i,
  "تويتر":     /twitter\.com|x\.com/i,
  "بنترست":    /pinterest\.com|pin\.it/i,
};

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 ━━ ⌬";

module.exports.config = {
  name: "تحميل",
  version: "9.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "تحميل تلقائي من روابط السوشيال",
  commandCategory: "media",
  usages: "تحميل تشغيل | تحميل إيقاف",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const action = args.join(" ").trim();

  if (!global._autoDownload[threadID]) global._autoDownload[threadID] = "on";

  if (action === "تشغيل") {
    global._autoDownload[threadID] = "on";
    return api.sendMessage(
      `${HEADER}\n\n✅ تم تشغيل التحميل التلقائي\n\n📥 سيتم تحميل أي رابط يُرسل تلقائياً`,
      threadID, messageID
    );
  }

  if (action === "إيقاف") {
    global._autoDownload[threadID] = "off";
    return api.sendMessage(
      `${HEADER}\n\n❌ تم إيقاف التحميل التلقائي`,
      threadID, messageID
    );
  }

  const status = global._autoDownload[threadID] === "off" ? "❌ متوقف" : "✅ يعمل";
  return api.sendMessage(
    `${HEADER}\n\n📊 الحالة: ${status}\n\n🔗 المنصات المدعومة:\n• تيك توك\n• فيسبوك\n• يوتيوب\n• انستغرام\n• تويتر / X\n• بنترست\n\n⚙️ .تحميل تشغيل | .تحميل إيقاف`,
    threadID, messageID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  if (!event.body) return;

  const { threadID, messageID } = event;

  if (global._autoDownload[threadID] === "off") return;

  const urlMatch = event.body.match(/https?:\/\/[^\s]+/);
  if (!urlMatch) return;

  const url = urlMatch[0];
  let platform = null;

  for (const [name, pattern] of Object.entries(urlPatterns)) {
    if (pattern.test(url)) { platform = name; break; }
  }

  if (!platform) return;

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const apiRes = await axios.get(
      `https://noobs-api.top/dipto/alldl?url=${encodeURIComponent(url)}`,
      { timeout: 30000 }
    );

    if (!apiRes.data?.result) throw new Error("فشل جلب الرابط");

    const cacheDir = path.join(process.cwd(), "cache");
    fs.ensureDirSync(cacheDir);
    const filePath = path.join(cacheDir, `dl_${Date.now()}_${randomString(5)}.mp4`);

    const video = await axios.get(apiRes.data.result, { responseType: "arraybuffer", timeout: 60000 });
    fs.writeFileSync(filePath, Buffer.from(video.data));

    await api.sendMessage(
      {
        body: `${HEADER}\n\n📥 ${platform}\n✅ تم التنزيل من تلجرام`,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => { try { fs.unlinkSync(filePath); } catch(_) {} },
      messageID
    );

    api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(err) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("[تحميل]", err.message);
  }
};
