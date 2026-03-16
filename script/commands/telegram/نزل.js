// ══════════════════════════════════════════════════════════════
//   نزل v4 — يتعامل مع الفيديو+أزرار في نفس الرسالة
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");
const { Raw }        = require("telegram/events");
const fs             = require("fs-extra");
const path           = require("path");
const axios          = require("axios");

module.exports.config = {
  name: "نزل",
  version: "4.0.0",
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
      const hasMedia   = msg.video || msg.document || msg.audio;
      const hasButtons = (msg.replyMarkup?.rows?.length || 0) > 0;
      const hasText    = msg.message && msg.message.length > 10;
      if (!hasMedia && !hasButtons && !hasText) return;
      if (!hasMedia && !hasButtons && (msg.message || "").length < 20) return;
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

// ── استخراج أزرار الاختيار ──
function extractButtons(msg) {
  const rows = msg.replyMarkup?.rows || [];
  const btns = [];
  for (const row of rows) {
    for (const btn of (row.buttons || [])) {
      const t = btn.text?.trim();
      if (t && t.length > 1) btns.push(t);
    }
  }
  return btns;
}

// ── تنزيل ملف من تيليجرام وإرساله ──
async function downloadAndSend(api, client, msg, threadID, messageID, label) {
  const ext  = msg.audio || msg.document?.mimeType?.includes("audio") ? ".mp3" : ".mp4";
  const file = path.join(process.cwd(), "tmp", "dl_" + Date.now() + ext);
  await fs.ensureDir(path.dirname(file));
  await client.downloadMedia(msg, { outputFile: file });
  const sizeMB = ((await fs.stat(file)).size / 1024 / 1024).toFixed(2);
  await api.sendMessage(
    { body: (label || "✅") + " | " + sizeMB + " MB", attachment: fs.createReadStream(file) },
    threadID, () => { fs.remove(file).catch(() => {}); }, messageID
  );
}

// ── معالجة رسالة البوت (فيها فيديو + أزرار) ──
async function processMsg(api, client, botId, msg, threadID, messageID, senderID) {
  await fs.ensureDir(path.join(process.cwd(), "tmp"));

  const hasVideo   = msg.video || msg.document?.mimeType?.includes("video") ||
    (msg.document?.attributes || []).some(a => a.className === "DocumentAttributeVideo");
  const hasButtons = extractButtons(msg).length > 0;

  // ── الحالة: فيديو + أزرار في نفس الرسالة ──
  if (hasVideo && hasButtons) {
    const buttons = extractButtons(msg);
    let listText = "⬇️ اختر نوع التنزيل:\n\n";
    buttons.forEach((b, i) => { listText += (i + 1) + ". " + b + "\n"; });
    listText += "\n↩️ رد برقم اختيارك";

    api.sendMessage(listText, threadID, (err, info) => {
      if (err || !info) return;
      global.نزلSessions[info.messageID] = { msg, buttons, client, botId };
      global.client.handleReply.push({
        messageID: info.messageID,
        threadID,
        name: "نزل",
        author: senderID
      });
    }, messageID);
    return;
  }

  // ── الحالة: أزرار فقط بدون فيديو ──
  if (!hasVideo && hasButtons) {
    const buttons = extractButtons(msg);
    let listText = "⬇️ اختر نوع التنزيل:\n\n";
    buttons.forEach((b, i) => { listText += (i + 1) + ". " + b + "\n"; });
    listText += "\n↩️ رد برقم اختيارك";

    api.sendMessage(listText, threadID, (err, info) => {
      if (err || !info) return;
      global.نزلSessions[info.messageID] = { msg, buttons, client, botId };
      global.client.handleReply.push({
        messageID: info.messageID,
        threadID,
        name: "نزل",
        author: senderID
      });
    }, messageID);
    return;
  }

  // ── الحالة: فيديو مباشر ──
  if (hasVideo) {
    await downloadAndSend(api, client, msg, threadID, messageID, "✅");
    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
    return;
  }

  // ── الحالة: رابط في النص ──
  const linkMatch = msg.message?.match(/https?:\/\/[^\s]+/);
  if (linkMatch) {
    const file = path.join(process.cwd(), "tmp", "dl_" + Date.now() + ".mp4");
    const res  = await axios.get(linkMatch[0], {
      responseType: "stream", timeout: 90000,
      maxContentLength: 50 * 1024 * 1024,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    await new Promise((r, j) => {
      const w = fs.createWriteStream(file);
      res.data.pipe(w); w.on("finish", r); w.on("error", j);
    });
    const sizeMB = ((await fs.stat(file)).size / 1024 / 1024).toFixed(2);
    await api.sendMessage(
      { body: "✅ " + sizeMB + " MB", attachment: fs.createReadStream(file) },
      threadID, () => { fs.remove(file).catch(() => {}); }, messageID
    );
    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
    return;
  }

  throw new Error("البوت لم يرسل فيديو أو رابط");
}

// ══ RUN ══
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

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

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    const client    = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId     = botEntity.id.toString();

    await client.sendMessage(BOT, { message: url });
    const resultMsg = await waitForBotMsg(client, botId, WAIT_MS);

    await processMsg(api, client, botId, resultMsg, threadID, messageID, senderID);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("❌ نزل:", e.message);
    api.sendMessage("❌ فشل التنزيل\n\n" + e.message, threadID, messageID);
  }
};

// ══ HANDLE REPLY ══
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID } = event;
  const sentMsgID = handleReply.messageID;

  const session = global.نزلSessions[sentMsgID];
  if (!session) return api.sendMessage("❌ انتهت الجلسة، حاول مجدداً", threadID, messageID);

  const { msg, buttons, client, botId } = session;
  const choiceNum = parseInt(event.body?.trim());

  if (!choiceNum || choiceNum < 1 || choiceNum > buttons.length) {
    return api.sendMessage("❌ اختر رقماً بين 1 و " + buttons.length, threadID, messageID);
  }

  delete global.نزلSessions[sentMsgID];
  global.client.handleReply = global.client.handleReply.filter(h => h.messageID !== sentMsgID);

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);

  const selectedBtn = buttons[choiceNum - 1];

  try {
    await fs.ensureDir(path.join(process.cwd(), "tmp"));

    // ── إذا اختار من رسالة فيها فيديو+أزرار — ينزل الفيديو الموجود ──
    const hasVideo = msg.video || msg.document?.mimeType?.includes("video") ||
      (msg.document?.attributes || []).some(a => a.className === "DocumentAttributeVideo");

    if (hasVideo && choiceNum === 1) {
      // أول خيار = الفيديو الموجود أصلاً
      await downloadAndSend(api, client, msg, threadID, messageID, selectedBtn);
    } else {
      // ضغط الزر وانتظار الرد
      await msg.click({ text: selectedBtn });
      const fileMsg = await waitForBotMsg(client, botId, 60000);

      const hasMedia2 = fileMsg.video || fileMsg.audio ||
        fileMsg.document?.mimeType?.includes("video") ||
        fileMsg.document?.mimeType?.includes("audio");

      if (hasMedia2) {
        await downloadAndSend(api, client, fileMsg, threadID, messageID, selectedBtn);
      } else {
        const linkMatch = fileMsg.message?.match(/https?:\/\/[^\s]+/);
        if (!linkMatch) throw new Error("البوت لم يرسل الملف");
        const ext  = selectedBtn.includes("صوت") ? ".mp3" : ".mp4";
        const file = path.join(process.cwd(), "tmp", "dl_" + Date.now() + ext);
        const res  = await axios.get(linkMatch[0], {
          responseType: "stream", timeout: 90000,
          maxContentLength: 50 * 1024 * 1024,
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        await new Promise((r, j) => {
          const w = fs.createWriteStream(file);
          res.data.pipe(w); w.on("finish", r); w.on("error", j);
        });
        const sizeMB = ((await fs.stat(file)).size / 1024 / 1024).toFixed(2);
        await api.sendMessage(
          { body: selectedBtn + " | " + sizeMB + " MB", attachment: fs.createReadStream(file) },
          threadID, () => { fs.remove(file).catch(() => {}); }, messageID
        );
      }
    }

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("❌ نزل handleReply:", e.message);
    api.sendMessage("❌ فشل التنزيل\n\n" + e.message, threadID, messageID);
  }
};
