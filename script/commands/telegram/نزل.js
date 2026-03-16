// ══════════════════════════════════════════════════════════════
//   نزل v3 — ذكي مع أزرار الاختيار
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");
const { Raw }        = require("telegram/events");
const fs             = require("fs-extra");
const path           = require("path");
const axios          = require("axios");

module.exports.config = {
  name: "نزل",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "تنزيل فيديو من كل مواقع التواصل",
  commandCategory: "media",
  usages: "نزل [رابط]",
  cooldowns: 15
};

global.نزلSessions = global.نزلSessions || {};

const BOT     = "C_5BOT";
const WAIT_MS = 90000;

// ── استخراج أزرار الاختيار ──
function extractChoiceButtons(msg) {
  const rows = msg.replyMarkup?.rows || [];
  const buttons = [];
  for (const row of rows) {
    for (const btn of (row.buttons || [])) {
      const text = btn.text?.trim();
      if (!text || text.length < 2) continue;
      buttons.push(text);
    }
  }
  return buttons;
}

// ── انتظار رد البوت (نص أو أزرار أو ملف) ──
function waitForBotMsg(client, botId, timeout = WAIT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      reject(new Error("انتهت مهلة الانتظار"));
    }, timeout);

    let resolved = false;

    const finish = (msg) => {
      if (resolved) return;

      // تجاهل رسائل الانتظار القصيرة جداً
      const hasMedia = msg.video || msg.document || msg.audio;
      const hasButtons = (msg.replyMarkup?.rows?.length || 0) > 0;
      const hasText = msg.message && msg.message.length > 10;

      if (!hasMedia && !hasButtons && !hasText) return;

      // تجاهل رسائل "جاري" فقط إذا مافيها أزرار أو ميديا
      if (!hasMedia && !hasButtons) {
        const lower = msg.message?.toLowerCase() || "";
        if (lower.includes("...") && msg.message.length < 20) return;
      }

      resolved = true;
      clearTimeout(timer);
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      resolve(msg);
    };

    const onNew = async (ev) => {
      const msg = ev.message;
      if (!msg || msg.peerId?.userId?.toString() !== botId) return;
      finish(msg);
    };

    const onRaw = async (update) => {
      try {
        if (!(update.className || "").includes("Edit")) return;
        const msg = update.message;
        if (!msg) return;
        const sid = msg.peerId?.userId?.toString() || msg.fromId?.userId?.toString();
        if (sid !== botId) return;
        finish(msg);
      } catch(e) {}
    };

    client.addEventHandler(onNew, new NewMessage({ fromUsers: [BOT] }));
    client.addEventHandler(onRaw, new Raw({}));
  });
}

// ── تنزيل ملف من تيليجرام وإرساله ──
async function downloadAndSend(api, client, msg, threadID, messageID, label) {
  const tmpPath = path.join(process.cwd(), "tmp", "dl_" + Date.now());
  await fs.ensureDir(path.dirname(tmpPath));

  const ext = msg.audio ? ".mp3" :
              msg.document?.mimeType?.includes("audio") ? ".mp3" :
              msg.video ? ".mp4" :
              msg.document?.mimeType?.includes("video") ? ".mp4" : ".mp4";

  const filePath = tmpPath + ext;
  await client.downloadMedia(msg, { outputFile: filePath });

  const sizeMB = ((await fs.stat(filePath)).size / 1024 / 1024).toFixed(2);

  await api.sendMessage(
    {
      body: (label || "✅") + " | " + sizeMB + " MB",
      attachment: require("fs").createReadStream(filePath)
    },
    threadID,
    () => { fs.remove(filePath).catch(() => {}); },
    messageID
  );
}

// ══ RUN ══
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  const url = args.join(" ").trim() ||
    event.messageReply?.body?.match(/https?:\/\/[^\s]+/)?.[0];

  if (!url || !url.startsWith("http")) {
    return api.sendMessage(
      "⬇️ تنزيل فيديو من كل المواقع\n\n" +
      "الاستخدام:\n" +
      "نزل [رابط]\n\n" +
      "🎬 YouTube | 🎵 TikTok\n" +
      "📸 Instagram | 👥 Facebook\n" +
      "🐦 Twitter/X وغيرها",
      threadID, messageID
    );
  }

  if (typeof global.getTgClient !== "function") {
    return api.sendMessage(
      "❌ سجّل دخول تيليجرام أولاً:\n.tglogin +964XXXXXXXXXX",
      threadID, messageID
    );
  }

  // تفاعل فوري
  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);

  let videoPath = null;

  try {
    const client    = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId     = botEntity.id.toString();

    // إرسال الرابط وانتظار الرد
    await client.sendMessage(BOT, { message: url });
    const resultMsg = await waitForBotMsg(client, botId, WAIT_MS);

    await fs.ensureDir(path.join(process.cwd(), "tmp"));

    // ── الحالة 1: البوت رد بأزرار اختيار ──
    const buttons = extractChoiceButtons(resultMsg);
    if (buttons.length > 0) {
      // بناء قائمة للمستخدم
      let listText = "⬇️ اختر نوع التنزيل:\n\n";
      buttons.forEach((btn, i) => { listText += (i + 1) + ". " + btn + "\n"; });
      listText += "\n↩️ رد برقم اختيارك";

      api.sendMessage(listText, threadID, (err, info) => {
        if (err || !info) return;

        // حفظ الجلسة
        global.نزلSessions[info.messageID] = {
          resultMsg, buttons, client, botId
        };

        // تسجيل handleReply
        global.client.handleReply.push({
          messageID: info.messageID,
          threadID,
          name: "نزل",
          author: event.senderID
        });

      }, messageID);

      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
      return;
    }

    // ── الحالة 2: البوت رد بفيديو مباشر ──
    const hasVideo = resultMsg.video ||
      resultMsg.document?.mimeType?.includes("video") ||
      (resultMsg.document?.attributes || []).some(a => a.className === "DocumentAttributeVideo");

    if (hasVideo) {
      await downloadAndSend(api, client, resultMsg, threadID, messageID, "✅");
      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
      return;
    }

    // ── الحالة 3: البوت رد برابط ──
    const linkMatch = resultMsg.message?.match(/https?:\/\/[^\s]+/);
    if (linkMatch) {
      videoPath = path.join(process.cwd(), "tmp", "vid_" + Date.now() + ".mp4");
      const res = await axios.get(linkMatch[0], {
        responseType: "stream", timeout: 60000,
        maxContentLength: 50 * 1024 * 1024,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      await new Promise((r, j) => {
        const w = fs.createWriteStream(videoPath);
        res.data.pipe(w);
        w.on("finish", r); w.on("error", j);
      });
      const sizeMB = ((await fs.stat(videoPath)).size / 1024 / 1024).toFixed(2);
      await api.sendMessage(
        { body: "✅ " + sizeMB + " MB", attachment: require("fs").createReadStream(videoPath) },
        threadID, () => { fs.remove(videoPath).catch(() => {}); }, messageID
      );
      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
      return;
    }

    throw new Error("البوت لم يرسل ملفاً أو رابطاً");

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    if (videoPath) fs.remove(videoPath).catch(() => {});
    console.error("❌ نزل:", e.message);
    api.sendMessage("❌ فشل التنزيل\n\n" + e.message, threadID, messageID);
  }
};

// ══ HANDLE REPLY ══
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID } = event;
  const sentMsgID = handleReply.messageID;

  const session = global.نزلSessions[sentMsgID];
  if (!session) {
    return api.sendMessage("❌ انتهت الجلسة، حاول مجدداً", threadID, messageID);
  }

  const { resultMsg, buttons, client, botId } = session;
  const choiceNum = parseInt(event.body?.trim());

  if (!choiceNum || choiceNum < 1 || choiceNum > buttons.length) {
    return api.sendMessage(
      "❌ اختر رقماً بين 1 و " + buttons.length,
      threadID, messageID
    );
  }

  // حذف الجلسة
  delete global.نزلSessions[sentMsgID];
  global.client.handleReply = global.client.handleReply.filter(h => h.messageID !== sentMsgID);

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);

  const selectedBtn = buttons[choiceNum - 1];

  try {
    // ضغط الزر
    await resultMsg.click({ text: selectedBtn });

    // انتظار الملف
    const fileMsg = await waitForBotMsg(client, botId, 60000);

    await fs.ensureDir(path.join(process.cwd(), "tmp"));

    const hasMedia = fileMsg.video || fileMsg.audio ||
      fileMsg.document?.mimeType?.includes("video") ||
      fileMsg.document?.mimeType?.includes("audio");

    if (hasMedia) {
      await downloadAndSend(api, client, fileMsg, threadID, messageID, selectedBtn);
    } else {
      const linkMatch = fileMsg.message?.match(/https?:\/\/[^\s]+/);
      if (!linkMatch) throw new Error("البوت لم يرسل الملف");

      const ext = selectedBtn.includes("صوت") ? ".mp3" : ".mp4";
      const filePath = path.join(process.cwd(), "tmp", "dl_" + Date.now() + ext);

      const res = await axios.get(linkMatch[0], {
        responseType: "stream", timeout: 60000,
        maxContentLength: 50 * 1024 * 1024,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      await new Promise((r, j) => {
        const w = fs.createWriteStream(filePath);
        res.data.pipe(w);
        w.on("finish", r); w.on("error", j);
      });
      const sizeMB = ((await fs.stat(filePath)).size / 1024 / 1024).toFixed(2);
      await api.sendMessage(
        { body: selectedBtn + " | " + sizeMB + " MB", attachment: require("fs").createReadStream(filePath) },
        threadID, () => { fs.remove(filePath).catch(() => {}); }, messageID
      );
    }

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("❌ نزل handleReply:", e.message);
    api.sendMessage("❌ فشل التنزيل\n\n" + e.message, threadID, messageID);
  }
};
