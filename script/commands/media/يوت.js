const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const ytdl = require("@distube/ytdl-core");
const yts = require("yt-search");

module.exports.config = {
  name: "يوت",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "تحميل فيديو من يوتيوب وإرساله",
  commandCategory: "media",
  usages: "[اسم الفيديو]",
  cooldowns: 15
};

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗠𝗘𝗗𝗜𝗔 ━━ ⌬";
const MAX_SIZE = 25 * 1024 * 1024;

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query)
    return api.sendMessage(
      `${HEADER}\n\n🎬 أكتب اسم الفيديو للبحث عنه.`,
      threadID, messageID
    );

  api.setMessageReaction("🔎", messageID, () => {}, true);

  try {
    // ── 1. بحث عن الفيديو ─────────────────────────────────
    const searchResult = await yts(query);
    const video = searchResult.videos[0];

    if (!video) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        `${HEADER}\n\n❌ لم يتم العثور على نتائج.`,
        threadID, messageID
      );
    }

    // ── 2. التحقق من المدة ────────────────────────────────
    if (video.seconds > 480) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        `${HEADER}\n\n❌ الفيديو طويل (${video.timestamp})، الحد الأقصى 8 دقائق.`,
        threadID, messageID
      );
    }

    api.setMessageReaction("⬇️", messageID, () => {}, true);

    // ── 3. تحميل الفيديو عبر ytdl ─────────────────────────
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const filePath = path.join(cacheDir, `video_${Date.now()}.mp4`);

    await new Promise((resolve, reject) => {
      let downloadedSize = 0;

      const stream = ytdl(video.url, {
        quality: "highestvideo",
        filter: format =>
          format.container === "mp4" &&
          format.hasVideo &&
          format.hasAudio
      });

      const writer = fs.createWriteStream(filePath);

      stream.on("data", chunk => {
        downloadedSize += chunk.length;
        if (downloadedSize > MAX_SIZE) {
          stream.destroy();
          writer.destroy();
          fs.unlink(filePath).catch(() => {});
          reject(new Error("الفيديو كبير جداً (تجاوز 25 MB)"));
        }
      });

      stream.pipe(writer);
      stream.on("error", err => { writer.destroy(); fs.unlink(filePath).catch(() => {}); reject(err); });
      writer.on("finish", () => resolve());
      writer.on("error", err => { fs.unlink(filePath).catch(() => {}); reject(err); });
    });

    const fileSize = fs.statSync(filePath).size;
    const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);

    if (fileSize > MAX_SIZE) {
      fs.unlink(filePath).catch(() => {});
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        `${HEADER}\n\n❌ الفيديو كبير جداً (${sizeInMB} MB).`,
        threadID, messageID
      );
    }

    // ── 4. إرسال الفيديو ──────────────────────────────────
    api.sendMessage(
      {
        body: `${HEADER}\n\n🎬 ${video.title}\n⏱️ ${video.timestamp} · 📦 ${sizeInMB} MB`,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      (err) => {
        if (!err) api.setMessageReaction("✅", messageID, () => {}, true);
        setTimeout(() => fs.unlink(filePath).catch(() => {}), 10000);
      },
      messageID
    );

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(
      `${HEADER}\n\n❌ فشل: ${err.message}`,
      threadID, messageID
    );
  }
};
