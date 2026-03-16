// ══════════════════════════════════════════════════════════════
//   STEMS — عزل الأغنية عن الصوت عبر @Musici7o_bot
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");
const fs             = require("fs-extra");
const path           = require("path");
const axios          = require("axios");

module.exports.config = {
  name: "stems",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "عزل الأغنية عن الصوت — موسيقى نقية بدون صوت",
  commandCategory: "media",
  usages: "stems — أرفق ملف mp3 واكتب stems",
  cooldowns: 60
};

const BOT     = "Musici7o_bot";
const WAIT_MS = 180000; // 3 دقائق — العزل يأخذ وقت

// ── إرسال mp3 للبوت وانتظار الرد ──
async function sendAndWait(client, audioPath) {
  return new Promise(async (resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("انتهت مهلة الانتظار — البوت لم يرد خلال 3 دقائق"));
    }, WAIT_MS);

    let botId;
    try {
      botId = (await client.getEntity(BOT)).id.toString();
    } catch(e) {
      clearTimeout(timer);
      return reject(new Error("تعذر الوصول للبوت @" + BOT));
    }

    const results = [];

    const handler = async (ev) => {
      const msg = ev.message;
      if (msg.peerId?.userId?.toString() !== botId) return;

      // استقبل كل الملفات الصوتية التي يردها البوت
      const hasAudio = msg.audio || msg.voice ||
        msg.document?.mimeType?.includes("audio");

      if (!hasAudio && !msg.message) return;

      // إذا كان نصاً فقط (رسالة حالة) تجاهله
      if (!hasAudio && msg.message) return;

      try {
        const tmpFile = path.join(
          process.cwd(), "tmp",
          "stem_" + Date.now() + "_" + results.length + ".mp3"
        );
        await fs.ensureDir(path.dirname(tmpFile));
        await client.downloadMedia(msg, { outputFile: tmpFile });
        results.push({ path: tmpFile, caption: msg.message || "" });
      } catch(e) {}

      // إذا استقبلنا ملفين على الأقل (موسيقى + صوت) أو انتظرنا كافياً
      if (results.length >= 2) {
        clearTimeout(timer);
        client.removeEventHandler(handler, new NewMessage({}));
        resolve(results);
      }
    };

    client.addEventHandler(handler, new NewMessage({ fromUsers: [BOT] }));

    // إرسال ملف mp3 للبوت
    try {
      await client.sendFile(BOT, {
        file: audioPath,
        caption: "",
        forceDocument: false
      });
    } catch(e) {
      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("فشل إرسال الملف: " + e.message));
    }
  });
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  // التحقق من وجود مرفق صوتي
  const hasAudio = event.attachments?.some(a =>
    a.type === "audio" || a.type === "file" ||
    (a.filename || "").match(/\.(mp3|m4a|ogg|wav|flac)$/i)
  );

  const replyHasAudio = event.messageReply?.attachments?.some(a =>
    a.type === "audio" || a.type === "file" ||
    (a.filename || "").match(/\.(mp3|m4a|ogg|wav|flac)$/i)
  );

  if (!hasAudio && !replyHasAudio) {
    return api.sendMessage(
      "🎵 عزل الأغنية عن الصوت\n\n" +
      "الاستخدام:\n" +
      "• أرفق ملف mp3 واكتب: stems\n" +
      "• أو رد على رسالة فيها mp3 واكتب: stems\n\n" +
      "⏳ العملية قد تستغرق حتى 3 دقائق\n" +
      "📤 ستحصل على ملفين:\n" +
      "  🎸 الموسيقى (بدون صوت)\n" +
      "  🎤 الصوت (بدون موسيقى)",
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
  api.sendMessage(
    "🎵 جاري عزل الصوت...\n⏳ قد يستغرق حتى 3 دقائق، انتظر...",
    threadID, messageID
  );

  let audioPath = null;
  const resultFiles = [];

  try {
    await fs.ensureDir(path.join(process.cwd(), "tmp"));

    // تنزيل الملف الصوتي المرفق
    const att = (event.attachments || []).find(a =>
      a.type === "audio" || a.type === "file" ||
      (a.filename || "").match(/\.(mp3|m4a|ogg|wav|flac)$/i)
    ) || (event.messageReply?.attachments || []).find(a =>
      a.type === "audio" || a.type === "file" ||
      (a.filename || "").match(/\.(mp3|m4a|ogg|wav|flac)$/i)
    );

    if (!att?.url) throw new Error("لم يتم العثور على رابط الملف الصوتي");

    audioPath = path.join(process.cwd(), "tmp", "input_" + Date.now() + ".mp3");
    const res = await axios.get(att.url, {
      responseType: "stream",
      timeout: 60000,
      maxContentLength: 50 * 1024 * 1024
    });

    await new Promise((res2, rej) => {
      const w = fs.createWriteStream(audioPath);
      res.data.pipe(w);
      w.on("finish", res2);
      w.on("error", rej);
    });

    // إرسال للبوت وانتظار النتائج
    const client  = await global.getTgClient();
    const results = await sendAndWait(client, audioPath);

    // إرسال الملفات للمستخدم
    const labels = ["🎸 الموسيقى (بدون صوت)", "🎤 الصوت (بدون موسيقى)"];

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      resultFiles.push(r.path);

      await api.sendMessage(
        {
          body: labels[i] || "🎵 ملف " + (i + 1),
          attachment: fs.createReadStream(r.path)
        },
        threadID,
        () => { fs.remove(r.path).catch(() => {}); },
        messageID
      );

      // تأخير بسيط بين الملفات
      if (i < results.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    if (audioPath) fs.remove(audioPath).catch(() => {});
    for (const f of resultFiles) fs.remove(f).catch(() => {});

    console.error("❌ STEMS:", e.message);
    api.sendMessage(
      "❌ فشل عزل الصوت\n\n" + e.message,
      threadID, messageID
    );
  }
};
