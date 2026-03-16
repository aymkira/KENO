// ══════════════════════════════════════════════════════════════
//   MP3 — تحويل فيديو يوتيوب لصوت عبر @abode20000_bot
//   by Ayman v3 — session من MongoDB
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");
const { execSync }   = require("child_process");
const fs             = require("fs-extra");
const path           = require("path");
const axios          = require("axios");

module.exports.config = {
  name: "mp3",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "تحويل فيديو يوتيوب أو مرفق إلى mp3",
  commandCategory: "media",
  usages: "mp3 [رابط يوتيوب] أو أرفق فيديو",
  cooldowns: 30
};

const BOT_USERNAME = "abode20000_bot";
const TIMEOUT_MS   = 120000;

// ── تنزيل يوتيوب عبر yt-dlp ──
async function downloadYoutube(url, outputPath) {
  try { execSync("yt-dlp --version", { stdio: "ignore" }); }
  catch(e) {
    try { execSync("pip3 install yt-dlp", { stdio: "pipe" }); }
    catch(e2) { throw new Error("yt-dlp غير مثبت. شغّل: pip3 install yt-dlp"); }
  }
  execSync(
    "yt-dlp -f \"best[ext=mp4][filesize<50M]/best\" " +
    "--merge-output-format mp4 --no-playlist " +
    "-o \"" + outputPath + "\" \"" + url + "\"",
    { timeout: 120000 }
  );
  if (!await fs.pathExists(outputPath))
    throw new Error("فشل تنزيل الفيديو من يوتيوب");
}

// ── إرسال لبوت تيليجرام والانتظار ──
async function sendAndWait(client, filePath) {
  return new Promise(async (resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("انتهت مهلة الانتظار — البوت لم يرد خلال دقيقتين"));
    }, TIMEOUT_MS);

    let botId;
    try {
      botId = (await client.getEntity(BOT_USERNAME)).id.toString();
    } catch(e) {
      clearTimeout(timer);
      return reject(new Error("لم يتم العثور على البوت: " + BOT_USERNAME));
    }

    const handler = async (ev) => {
      const msg = ev.message;
      if (msg.peerId?.userId?.toString() !== botId) return;
      const hasAudio = msg.audio || msg.voice ||
        (msg.document?.mimeType || "").includes("audio");
      if (!hasAudio) return;

      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({}));

      try {
        const tmpAudio = path.join(process.cwd(), "tmp", "audio_" + Date.now() + ".mp3");
        await fs.ensureDir(path.dirname(tmpAudio));
        await client.downloadMedia(msg, { outputFile: tmpAudio });
        resolve(tmpAudio);
      } catch(e) {
        reject(new Error("فشل تنزيل الصوت: " + e.message));
      }
    };

    client.addEventHandler(handler, new NewMessage({ fromUsers: [BOT_USERNAME] }));

    try {
      await client.sendFile(BOT_USERNAME, { file: filePath, caption: "", forceDocument: false });
    } catch(e) {
      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("فشل إرسال الفيديو: " + e.message));
    }
  });
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  const hasVideo  = event.attachments?.some(a => a.type === "video");
  const url       = args[0]?.match(/https?:\/\/[^\s]+/)?.[0] ||
                    event.messageReply?.body?.match(/https?:\/\/[^\s]+/)?.[0];
  const isYoutube = url && /youtube\.com\/watch|youtu\.be\//i.test(url);

  if (!hasVideo && !isYoutube) {
    return api.sendMessage(
      "🎵 تحويل فيديو لـ MP3\n\n" +
      "الاستخدام:\n" +
      "• mp3 https://youtube.com/watch?v=...\n" +
      "• أو أرفق فيديو واكتب: mp3\n\n" +
      "⚠️ روابط Playlist غير مدعومة",
      threadID, messageID
    );
  }

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);
  api.sendMessage("🎵 جاري التحويل إلى MP3...\nقد يستغرق حتى دقيقتين ⏳", threadID, messageID);

  let videoPath = null;
  let audioPath = null;

  try {
    // تحقق من وجود getTgClient (يُعرَّف في tglogin.js)
    if (typeof global.getTgClient !== "function")
      throw new Error("SESSION_REQUIRED");

    await fs.ensureDir(path.join(process.cwd(), "tmp"));

    if (hasVideo) {
      const att = event.attachments.find(a => a.type === "video");
      videoPath = path.join(process.cwd(), "tmp", "vid_" + Date.now() + ".mp4");
      const res = await axios.get(att.url, {
        responseType: "stream", timeout: 60000,
        maxContentLength: 50 * 1024 * 1024
      });
      await new Promise((res2, rej) => {
        const w = fs.createWriteStream(videoPath);
        res.data.pipe(w);
        w.on("finish", res2);
        w.on("error", rej);
      });
    } else {
      videoPath = path.join(process.cwd(), "tmp", "yt_" + Date.now() + ".mp4");
      await downloadYoutube(url, videoPath);
    }

    const client = await global.getTgClient();
    audioPath    = await sendAndWait(client, videoPath);

    const sizeMB = ((await fs.stat(audioPath)).size / 1024 / 1024).toFixed(2);
    await api.sendMessage(
      { body: "🎵 تم التحويل!\n📦 " + sizeMB + " MB", attachment: fs.createReadStream(audioPath) },
      threadID,
      () => {
        fs.remove(audioPath).catch(() => {});
        if (videoPath) fs.remove(videoPath).catch(() => {});
      },
      messageID
    );

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    if (videoPath) fs.remove(videoPath).catch(() => {});
    if (audioPath) fs.remove(audioPath).catch(() => {});
    api.sendMessage(
      e.message.includes("SESSION_REQUIRED")
        ? "❌ سجّل دخول تيليجرام أولاً:\n.tglogin +964XXXXXXXXXX"
        : "❌ فشل التحويل\n\n" + e.message,
      threadID, messageID
    );
  }
};
