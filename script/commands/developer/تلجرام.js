// ══════════════════════════════════════════════════════════════
//   MP3 — تحويل الفيديو لصوت عبر @abode20000_bot
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { TelegramClient } = require("telegram");
const { StringSession }  = require("telegram/sessions");
const { NewMessage }     = require("telegram/events");
const fs                 = require("fs-extra");
const path               = require("path");
const axios              = require("axios");

module.exports.config = {
  name: "mp3",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "تحويل فيديو يوتيوب أو فيديو مرفق إلى mp3 عبر تيليجرام",
  commandCategory: "media",
  usages: "mp3 [رابط يوتيوب] أو أرفق فيديو",
  cooldowns: 30
};

// ══════════════════════════════════════════
//   إعدادات تيليجرام — غيّر هنا فقط
// ══════════════════════════════════════════
const TG_CONFIG = {
  apiId:    38886989,
  apiHash:  "d29c090337bce1e1015c766493edab71",
  // بعد أول تشغيل يُحفظ الـ session تلقائياً في session.txt
  // لا تحتاج رقم الهاتف مرة ثانية
  sessionPath: path.join(process.cwd(), "includes", "tg_session.txt"),
  botUsername: "abode20000_bot",
  timeoutMs: 120000  // انتظر 2 دقيقة لرد البوت
};

// ══════════════════════════════════════════
//   تحميل أو إنشاء الـ session
// ══════════════════════════════════════════
async function getSession() {
  try {
    if (await fs.pathExists(TG_CONFIG.sessionPath)) {
      const saved = await fs.readFile(TG_CONFIG.sessionPath, "utf8");
      return saved.trim();
    }
  } catch(e) {}
  return "";
}

async function saveSession(sessionStr) {
  await fs.ensureDir(path.dirname(TG_CONFIG.sessionPath));
  await fs.writeFile(TG_CONFIG.sessionPath, sessionStr, "utf8");
}

// ══════════════════════════════════════════
//   الكلاينت الرئيسي (singleton)
// ══════════════════════════════════════════
let tgClient = null;

async function getTgClient() {
  if (tgClient && tgClient.connected) return tgClient;

  const sessionStr = await getSession();
  const session    = new StringSession(sessionStr);

  tgClient = new TelegramClient(session, TG_CONFIG.apiId, TG_CONFIG.apiHash, {
    connectionRetries: 3,
    baseLogger: { levels: [], log: () => {} } // أخفي logs تيليجرام
  });

  await tgClient.start({
    phoneNumber:  async () => { throw new Error("SESSION_REQUIRED"); },
    phoneCode:    async () => { throw new Error("SESSION_REQUIRED"); },
    password:     async () => { throw new Error("SESSION_REQUIRED"); },
    onError:      (err) => console.error("TG Error:", err)
  });

  // حفظ الـ session الجديدة
  await saveSession(tgClient.session.save());
  return tgClient;
}

// ══════════════════════════════════════════
//   إرسال لبوت تيليجرام والانتظار للرد
// ══════════════════════════════════════════
async function sendAndWait(client, filePath) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("انتهت مهلة الانتظار — بوت التيليجرام لم يرد"));
    }, TG_CONFIG.timeoutMs);

    // مستمع للرد من البوت
    const handler = async (event) => {
      const msg = event.message;
      // تحقق أن الرد من البوت المطلوب وفيه ملف صوتي
      if (
        msg.peerId?.userId?.toString() === (await client.getEntity(TG_CONFIG.botUsername)).id.toString() &&
        (msg.audio || msg.document?.mimeType?.includes("audio") || msg.voice)
      ) {
        clearTimeout(timeout);
        client.removeEventHandler(handler, new NewMessage({}));

        try {
          // تنزيل الملف الصوتي
          const tmpAudio = path.join(process.cwd(), "tmp", `audio_${Date.now()}.mp3`);
          await fs.ensureDir(path.dirname(tmpAudio));
          await client.downloadMedia(msg, { outputFile: tmpAudio });
          resolve(tmpAudio);
        } catch(e) {
          reject(new Error("فشل تنزيل الملف الصوتي: " + e.message));
        }
      }
    };

    client.addEventHandler(handler, new NewMessage({ fromUsers: [TG_CONFIG.botUsername] }));

    // إرسال الفيديو للبوت
    try {
      await client.sendFile(TG_CONFIG.botUsername, {
        file: filePath,
        caption: "",
        forceDocument: false
      });
    } catch(e) {
      clearTimeout(timeout);
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("فشل إرسال الفيديو لتيليجرام: " + e.message));
    }
  });
}

// ══════════════════════════════════════════
//   RUN
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // ── التحقق من المدخل ──
  const hasAttachment = event.attachments?.some(a => a.type === "video");
  const url           = args[0]?.match(/https?:\/\/[^\s]+/)?.[0] ||
                        event.messageReply?.body?.match(/https?:\/\/[^\s]+/)?.[0];
  const isYoutube     = url && /youtube\.com|youtu\.be/i.test(url);

  if (!hasAttachment && !isYoutube) {
    return api.sendMessage(
      "🎵 أمر تحويل الفيديو لـ MP3\n\n" +
      "الاستخدام:\n" +
      "• أرسل فيديو مرفق + اكتب: mp3\n" +
      "• أو: mp3 [رابط يوتيوب]\n\n" +
      "مثال:\n" +
      "mp3 https://youtube.com/watch?v=...",
      threadID, messageID
    );
  }

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);
  api.sendMessage("🎵 جاري التحويل إلى MP3...\nقد يستغرق حتى دقيقتين ⏳", threadID, messageID);

  let videoPath = null;
  let audioPath = null;

  try {
    // ── تحضير ملف الفيديو ──
    await fs.ensureDir(path.join(process.cwd(), "tmp"));

    if (hasAttachment) {
      // تنزيل الفيديو المرفق من المسنجر
      const attachment = event.attachments.find(a => a.type === "video");
      videoPath = path.join(process.cwd(), "tmp", `vid_${Date.now()}.mp4`);

      const res = await axios.get(attachment.url, {
        responseType: "stream",
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024
      });

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(videoPath);
        res.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

    } else if (isYoutube) {
      // تنزيل من يوتيوب
      const ytdl = require("ytdl-core");
      videoPath  = path.join(process.cwd(), "tmp", `yt_${Date.now()}.mp4`);

      const info    = await ytdl.getInfo(url);
      const format  = ytdl.chooseFormat(info.formats, { quality: "lowestvideo" });

      await new Promise((resolve, reject) => {
        ytdl(url, { format })
          .pipe(fs.createWriteStream(videoPath))
          .on("finish", resolve)
          .on("error", reject);
      });
    }

    // ── الاتصال بتيليجرام وإرسال الفيديو ──
    const client = await getTgClient();
    audioPath    = await sendAndWait(client, videoPath);

    // ── إرسال الصوت للمستخدم في المسنجر ──
    const stat   = await fs.stat(audioPath);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(2);

    await api.sendMessage(
      {
        body: `🎵 تم التحويل بنجاح!\n📦 الحجم: ${sizeMB} MB`,
        attachment: fs.createReadStream(audioPath)
      },
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

    console.error("❌ MP3 Error:", e.message);

    // رسالة خطأ واضحة
    let errMsg = `❌ فشل التحويل\n\n${e.message}`;
    if (e.message.includes("SESSION_REQUIRED")) {
      errMsg = "❌ لم يتم تسجيل الدخول لتيليجرام بعد\n\n💡 شغّل أمر: tglogin\nلتسجيل حسابك الثاني";
    }

    api.sendMessage(errMsg, threadID, messageID);
  }
};
