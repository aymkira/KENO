// ══════════════════════════════════════════════════════════════
//   نزل — تنزيل فيديو من كل مواقع التواصل عبر @X0X0BOT
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");
const fs             = require("fs-extra");
const path           = require("path");
const axios          = require("axios");

module.exports.config = {
  name: "نزل",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "تنزيل فيديو من كل مواقع التواصل الاجتماعي",
  commandCategory: "media",
  usages: "نزل [رابط]",
  cooldowns: 15
};

const BOT     = "X0X0BOT";
const WAIT_MS = 120000;

// ── إرسال رابط للبوت وانتظار الفيديو ──
async function sendAndWait(client, botId, url) {
  return new Promise(async (resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("انتهت مهلة الانتظار — البوت لم يرد"));
    }, WAIT_MS);

    const handler = async (ev) => {
      const msg = ev.message;
      if (msg.peerId?.userId?.toString() !== botId) return;

      // تجاهل رسائل الانتظار القصيرة
      const isWaiting = msg.message && msg.message.length < 30 &&
        !msg.video && !msg.document;
      if (isWaiting) return;

      // تحقق من وجود فيديو أو ملف
      const hasVideo = msg.video || msg.document?.mimeType?.includes("video") ||
        (msg.document?.attributes || []).some(a => a.className === "DocumentAttributeVideo");

      // أو رابط تنزيل في النص
      const hasLink = msg.message?.match(/https?:\/\/[^\s]+\.(mp4|webm|mov)/i);

      if (!hasVideo && !hasLink) return;

      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({}));
      resolve(msg);
    };

    client.addEventHandler(handler, new NewMessage({ fromUsers: [BOT] }));

    // إرسال الرابط للبوت
    try {
      await client.sendMessage(BOT, { message: url });
    } catch(e) {
      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("فشل إرسال الرابط: " + e.message));
    }
  });
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  // استخراج الرابط
  const url = args.join(" ").trim() ||
    event.messageReply?.body?.match(/https?:\/\/[^\s]+/)?.[0];

  if (!url || !url.startsWith("http")) {
    return api.sendMessage(
      "⬇️ تنزيل فيديو من كل المواقع\n\n" +
      "الاستخدام:\n" +
      "نزل [رابط]\n\n" +
      "المواقع المدعومة:\n" +
      "🎬 YouTube\n" +
      "🎵 TikTok\n" +
      "📸 Instagram\n" +
      "👥 Facebook\n" +
      "🐦 Twitter/X\n" +
      "▶️ وغيرها...",
      threadID, messageID
    );
  }

  if (typeof global.getTgClient !== "function") {
    return api.sendMessage(
      "❌ سجّل دخول تيليجرام أولاً:\n.tglogin +964XXXXXXXXXX",
      threadID, messageID
    );
  }

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);
  api.sendMessage("⬇️ جاري التنزيل...\n⏳ انتظر لحظة", threadID, messageID);

  let videoPath = null;

  try {
    const client    = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId     = botEntity.id.toString();

    // إرسال الرابط وانتظار الرد
    const resultMsg = await sendAndWait(client, botId, url);

    await fs.ensureDir(path.join(process.cwd(), "tmp"));

    // إذا البوت رد بفيديو مباشر
    if (resultMsg.video || resultMsg.document?.mimeType?.includes("video")) {
      videoPath = path.join(process.cwd(), "tmp", "vid_" + Date.now() + ".mp4");
      await client.downloadMedia(resultMsg, { outputFile: videoPath });

      const sizeMB = ((await fs.stat(videoPath)).size / 1024 / 1024).toFixed(2);

      await api.sendMessage(
        {
          body: "✅ تم التنزيل!\n📦 الحجم: " + sizeMB + " MB",
          attachment: require("fs").createReadStream(videoPath)
        },
        threadID,
        () => { fs.remove(videoPath).catch(() => {}); },
        messageID
      );

    } else {
      // البوت رد برابط تنزيل
      const linkMatch = resultMsg.message?.match(/https?:\/\/[^\s]+/);
      if (!linkMatch) throw new Error("البوت لم يرسل فيديو أو رابط تنزيل");

      const dlUrl = linkMatch[0];
      videoPath   = path.join(process.cwd(), "tmp", "vid_" + Date.now() + ".mp4");

      const res = await axios.get(dlUrl, {
        responseType: "stream",
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      await new Promise((res2, rej) => {
        const w = fs.createWriteStream(videoPath);
        res.data.pipe(w);
        w.on("finish", res2);
        w.on("error", rej);
      });

      const sizeMB = ((await fs.stat(videoPath)).size / 1024 / 1024).toFixed(2);

      await api.sendMessage(
        {
          body: "✅ تم التنزيل!\n📦 الحجم: " + sizeMB + " MB",
          attachment: require("fs").createReadStream(videoPath)
        },
        threadID,
        () => { fs.remove(videoPath).catch(() => {}); },
        messageID
      );
    }

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    if (videoPath) fs.remove(videoPath).catch(() => {});
    console.error("❌ نزل:", e.message);
    api.sendMessage(
      "❌ فشل التنزيل\n\n" + e.message +
      "\n\n💡 تأكد من صحة الرابط",
      threadID, messageID
    );
  }
};
