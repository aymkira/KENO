const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬";

module.exports.config = {
  name: "يوت",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "بحث يوتيوب وتحميل الفيديو",
  commandCategory: "media",
  usages: "[اسم الفيديو أو الأغنية]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ").trim();

  if (!query)
    return api.sendMessage(
      `${HEADER}\n\n🎬 أكتب اسم الفيديو أو الأغنية بعد الأمر.\nمثال: .يوت moonlight xxxtentacion`,
      threadID, messageID
    );

  api.setMessageReaction("🔎", messageID, () => {}, true);

  // ── 1. البحث في يوتيوب ─────────────────────────────────────
  let videoInfo;
  try {
    const searchRes = await axios.get(
      `https://weeb-api.vercel.app/ytsearch?query=${encodeURIComponent(query)}`,
      { timeout: 15000 }
    );
    if (!searchRes.data || searchRes.data.length === 0)
      throw new Error("لا نتائج");
    videoInfo = searchRes.data[0];
  } catch (e) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(
      `${HEADER}\n\n❌ ما لقيت نتائج لـ "${query}"`,
      threadID, messageID
    );
  }

  // ── 2. إشعار المستخدم بالانتظار ────────────────────────────
  api.setMessageReaction("⏳", messageID, () => {}, true);
  await api.sendMessage(
    `${HEADER}\n\n🎬 ${videoInfo.title}\n⏱️ ${videoInfo.timestamp || "غير محدد"}\n\n⬇️ جاري التحميل، انتظر...`,
    threadID
  );

  // ── 3. جلب رابط التحميل ─────────────────────────────────────
  let downloadUrl;
  try {
    // نستخدم نفس API المستخدم في سمعني بس نطلب mp4
    const encoded = encodeURIComponent(videoInfo.url);
    const dlRes = await axios.get(
      `https://p.savenow.to/ajax/download.php?button=1&start=1&end=1&format=mp4&iframe_source=https://www.y2down.app,&url=${encoded}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 20000 }
    );

    if (!dlRes.data?.progress_url) throw new Error("فشل بدء التحويل");

    // polling حتى يجهز الرابط
    let attempts = 0;
    while (attempts < 90) {
      await new Promise(r => setTimeout(r, 2000));
      attempts++;
      try {
        const prog = await axios.get(dlRes.data.progress_url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 8000
        });
        if (prog.data?.success === 1 && prog.data?.download_url) {
          downloadUrl = prog.data.download_url;
          break;
        }
      } catch (_) {}
    }

    if (!downloadUrl) throw new Error("انتهت مهلة التحويل");
  } catch (e) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(
      `${HEADER}\n\n❌ فشل التحميل: ${e.message}`,
      threadID, messageID
    );
  }

  // ── 4. تحميل الملف محلياً وإرساله ──────────────────────────
  try {
    const cacheDir = path.join(process.cwd(), "cache");
    fs.ensureDirSync(cacheDir);
    const filePath = path.join(cacheDir, `yt_${Date.now()}.mp4`);

    const videoStream = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream",
      timeout: 300000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const MAX_SIZE = 80 * 1024 * 1024; // 80 MB
    let downloaded = 0;
    const writer = fs.createWriteStream(filePath);

    await new Promise((resolve, reject) => {
      videoStream.data.on("data", chunk => {
        downloaded += chunk.length;
        if (downloaded > MAX_SIZE) {
          videoStream.data.destroy();
          writer.destroy();
          fs.unlink(filePath).catch(() => {});
          reject(new Error("الفيديو كبير جداً (تجاوز 80 ميجابايت)"));
        }
      });
      videoStream.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
      videoStream.data.on("error", reject);
    });

    const sizeInMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);

    await api.sendMessage(
      {
        body: `${HEADER}\n\n🎬 ${videoInfo.title}\n⏱️ ${videoInfo.timestamp || "غير محدد"} · 📦 ${sizeInMB} MB`,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => { try { fs.unlinkSync(filePath); } catch (_) {} },
      messageID
    );

    api.setMessageReaction("✅", messageID, () => {}, true);

  } catch (e) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(
      `${HEADER}\n\n❌ ${e.message}`,
      threadID, messageID
    );
  }
};