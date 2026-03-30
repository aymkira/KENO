const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "tik",
  aliases: ["tiktok", "tt"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "OpenAI",
  description: "Search and send a TikTok video by keyword",
  commandCategory: "tools",
  usages: "[اسم الفيديو]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ").trim();

  if (!query)
    return api.sendMessage("❌ اكتب اسم للبحث", threadID, messageID);

  api.setMessageReaction("🔎", messageID, () => {}, true);

  // ── 1. البحث في TikTok ─────────────────────────────────────
  let video;
  try {
    const searchRes = await axios.get("https://www.tikwm.com/api/feed/search", {
      params: { keywords: query, count: 1 },
      timeout: 20000
    });

    video = searchRes.data?.data?.videos?.[0];
    if (!video) throw new Error("لا نتائج");
  } catch (e) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ لم أجد نتائج لـ "${query}"`, threadID, messageID);
  }

  const videoUrl = video.play || video.hdplay || video.wmplay;
  if (!videoUrl) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ لم أتمكن من جلب رابط الفيديو", threadID, messageID);
  }

  const title = video.title || "TikTok Video";
  const author = video.author?.nickname || video.author?.unique_id || "Unknown";

  // ── 2. إشعار المستخدم ──────────────────────────────────────
  api.setMessageReaction("⏳", messageID, () => {}, true);
  await api.sendMessage(
    `🎬 ${title}\n👤 ${author}\n\n⬇️ جاري التحميل، انتظر...`,
    threadID
  );

  // ── 3. تحميل الفيديو وإرساله ───────────────────────────────
  try {
    const filePath = path.join(__dirname, `tik_${Date.now()}.mp4`);
    const writer = fs.createWriteStream(filePath);

    const videoRes = await axios.get(videoUrl, {
      responseType: "stream",
      timeout: 30000
    });
    videoRes.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await api.sendMessage(
      {
        body: `🎬 ${title}\n👤 ${author}`,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => { try { fs.unlinkSync(filePath); } catch (_) {} },
      messageID
    );

    api.setMessageReaction("✅", messageID, () => {}, true);

  } catch (e) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID);
  }
};
