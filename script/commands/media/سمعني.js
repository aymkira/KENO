const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "سمعني",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Yamada | D R X | ايمن",
  description: "البحث عن أغنية وتحميلها كاملة مع غلافها",
  commandCategory: "media",
  usages: "[اسم الأغنية]",
  cooldowns: 10
};

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗠𝗘𝗗𝗜𝗔 ━━ ⌬";

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query)
    return api.sendMessage(
      `${HEADER}\n\n🎧 أكتب اسم الأغنية للبحث عنها.`,
      threadID, messageID
    );

  api.setMessageReaction("🔎", messageID, () => {}, true);

  try {
    // ── 1. بحث يوتيوب للرابط والمدة ──────────────────────────
    const videoInfo = await searchYouTube(query);
    if (!videoInfo) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        `${HEADER}\n\n❌ لم يتم العثور على نتائج.`,
        threadID, messageID
      );
    }

    if (videoInfo.timestamp) {
      const parts = videoInfo.timestamp.split(":");
      const minutes = parseInt(parts[0]);
      if (minutes >= 8) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(
          `${HEADER}\n\n❌ الفيديو طويل (${videoInfo.timestamp})، الحد الأقصى 8 دقائق.`,
          threadID, messageID
        );
      }
    }

    // ── 2. بحث ديزر لجلب الغلاف والمعلومات ──────────────────
    const deezerInfo = await searchDeezer(query);

    api.sendMessage(
      `${HEADER}\n\n⏳ جاري التحميل: ${videoInfo.title}\n⏱️ المدة: ${videoInfo.timestamp || "غير محدد"}\n⌛ قد يستغرق هذا دقيقة...`,
      threadID, messageID
    );
    api.setMessageReaction("⬇️", messageID, () => {}, true);

    // ── 3. تحميل الأغنية كاملة ───────────────────────────────
    const downloadData = await getDownloadUrl(videoInfo.url);

    const sizeCheck = await checkFileSize(downloadData.url);
    if (sizeCheck.size && !sizeCheck.valid) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        `${HEADER}\n\n❌ الملف كبير جداً (${sizeCheck.size.toFixed(2)} ميجابايت).`,
        threadID, messageID
      );
    }

    const filePath = await downloadFile(downloadData.url);
    const fileSize = fs.statSync(filePath).size;
    const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);

    // ── 4. تحميل الغلاف من ديزر إن وُجد ─────────────────────
    let coverPath = null;
    if (deezerInfo && deezerInfo.coverUrl) {
      coverPath = await downloadCover(deezerInfo.coverUrl);
    }

    // ── 5. بناء الرسالة النهائية ──────────────────────────────
    const artist = deezerInfo ? deezerInfo.artist : null;
    const title  = deezerInfo ? deezerInfo.title  : videoInfo.title;

    const bodyText =
      `${HEADER}\n\n` +
      `✅ تم التحميل 🎧\n` +
      `🎵 الأغنية: ${title}\n` +
      (artist ? `🎤 الفنان: ${artist}\n` : "") +
      `📦 الحجم: ${sizeInMB} MB`;

    // إرسال الغلاف + النص أولاً ثم الصوت، أو الكل معاً إن لم يوجد غلاف
    if (coverPath) {
      api.sendMessage(
        { body: bodyText, attachment: fs.createReadStream(coverPath) },
        threadID,
        (err) => {
          setTimeout(() => fs.unlink(coverPath).catch(() => {}), 10000);
          api.sendMessage(
            { body: `🎶 ${title}`, attachment: fs.createReadStream(filePath) },
            threadID,
            (err2) => {
              if (!err2) api.setMessageReaction("✅", messageID, () => {}, true);
              setTimeout(() => fs.unlink(filePath).catch(() => {}), 10000);
            },
            messageID
          );
        },
        messageID
      );
    } else {
      api.sendMessage(
        { body: bodyText, attachment: fs.createReadStream(filePath) },
        threadID,
        (err) => {
          if (!err) api.setMessageReaction("✅", messageID, () => {}, true);
          setTimeout(() => fs.unlink(filePath).catch(() => {}), 10000);
        },
        messageID
      );
    }

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(
      `${HEADER}\n\n❌ فشل: ${err.message}`,
      threadID, messageID
    );
  }
};

// ════════════════════════════════════════════
//  دوال مساعدة
// ════════════════════════════════════════════

async function searchYouTube(query) {
  try {
    const res = await axios.get(
      `https://weeb-api.vercel.app/ytsearch?query=${encodeURIComponent(query)}`
    );
    if (res.data && res.data.length > 0) return res.data[0];
    return null;
  } catch (e) {
    return null;
  }
}

async function searchDeezer(query) {
  try {
    const res = await axios.get(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`
    );
    if (!res.data.data || res.data.data.length === 0) return null;
    const song = res.data.data[0];
    return {
      title:    song.title,
      artist:   song.artist.name,
      coverUrl: song.album.cover_big
    };
  } catch (e) {
    return null;
  }
}

async function getDownloadUrl(url) {
  const encoded = encodeURIComponent(url);
  const options = { headers: { "User-Agent": "Mozilla/5.0" } };

  try {
    const res = await axios.get(
      `https://p.savenow.to/ajax/download.php?button=1&start=1&end=1&format=mp3&iframe_source=https://www.y2down.app,&url=${encoded}`,
      { ...options, timeout: 20000 }
    );

    const data = res.data;
    if (!data.progress_url) throw new Error("فشل في بدء التحويل.");
    if (data.duration && data.duration > 480)
      throw new Error("الفيديو طويل جداً (أكثر من 8 دقائق).");

    let attempts = 0;
    while (attempts < 60) {
      await new Promise(r => setTimeout(r, 2000));
      attempts++;
      try {
        const progressRes = await axios.get(data.progress_url, {
          ...options, timeout: 8000
        });
        const progressData = progressRes.data;
        if (progressData.success === 1 && progressData.download_url) {
          return {
            url:      progressData.download_url,
            title:    data.title || "Audio Track",
            duration: data.duration
          };
        }
      } catch (e) {}
    }
    throw new Error("السيرفر بطيء جداً، انتهت مهلة التحويل.");
  } catch (err) {
    throw new Error(err.message || "فشل التحميل");
  }
}

async function checkFileSize(url) {
  try {
    const response = await axios.head(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const contentLength = response.headers["content-length"];
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      return { size: sizeInMB, valid: sizeInMB <= 25 };
    }
    return { size: null, valid: true };
  } catch (e) {
    return { size: null, valid: true };
  }
}

async function downloadFile(url) {
  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);
  const filePath = path.join(cacheDir, `music_${Date.now()}.mp3`);

  const MAX_SIZE = 25 * 1024 * 1024;
  let downloadedSize = 0;

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
    timeout: 180000,
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const writer = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    response.data.on("data", (chunk) => {
      downloadedSize += chunk.length;
      if (downloadedSize > MAX_SIZE) {
        response.data.destroy();
        writer.destroy();
        fs.unlink(filePath).catch(() => {});
        reject(new Error("الملف كبير جداً (تجاوز 25 ميجابايت)"));
      }
    });

    response.data.pipe(writer);

    writer.on("finish", () => {
      const finalSize = fs.statSync(filePath).size;
      if (finalSize > MAX_SIZE) {
        fs.unlink(filePath).catch(() => {});
        reject(new Error("الملف كبير جداً"));
      } else {
        resolve(filePath);
      }
    });

    writer.on("error", (err) => {
      fs.unlink(filePath).catch(() => {});
      reject(err);
    });

    response.data.on("error", (err) => {
      writer.destroy();
      fs.unlink(filePath).catch(() => {});
      reject(err);
    });
  });
}

async function downloadCover(url) {
  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);
  const coverPath = path.join(cacheDir, `cover_${Date.now()}.jpg`);

  const response = await axios({
    url,
    method: "GET",
    responseType: "arraybuffer",
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  fs.writeFileSync(coverPath, Buffer.from(response.data));
  return coverPath;
}
