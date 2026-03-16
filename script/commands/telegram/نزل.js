// ══════════════════════════════════════════════════════════════
//   نزل v7 — ينتظر فقط الرسالة التي فيها أزرار
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");
const { Raw }        = require("telegram/events");
const fs             = require("fs-extra");
const path           = require("path");
const axios          = require("axios");

module.exports.config = {
  name: "نزل",
  version: "7.0.0",
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

// ── انتظر فقط الرسالة التي فيها أزرار ──
function waitForButtons(client, botId, timeout = WAIT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      reject(new Error("البوت لم يرد بأزرار"));
    }, timeout);

    let resolved = false;

    const finish = (msg) => {
      if (resolved) return;
      // نقبل فقط الرسالة التي فيها أزرار
      const hasButtons = (msg.replyMarkup?.rows?.length || 0) > 0;
      if (!hasButtons) return; // تجاهل أي رسالة بدون أزرار
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

// ── انتظر الملف بعد ضغط الزر ──
function waitForFile(client, botId, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      reject(new Error("البوت لم يرسل الملف"));
    }, timeout);

    let resolved = false;

    const finish = (msg) => {
      if (resolved) return;
      // نقبل فقط رسالة فيها فيديو أو صوت حقيقي
      const hasVideo = msg.video ||
        (msg.document?.mimeType || "").includes("video");
      const hasAudio = msg.audio ||
        (msg.document?.mimeType || "").includes("audio");
      if (!hasVideo && !hasAudio) return;
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

// ── استخراج الأزرار ──
function extractButtons(msg) {
  const rows = msg.replyMarkup?.rows || [];
  const btns = [];
  for (const row of rows) {
    for (const btn of (row.buttons || [])) {
      const t = btn.text?.trim();
      if (t && t.length > 0) btns.push(t);
    }
  }
  return btns;
}

// ── تنزيل ملف من تيليجرام ──
async function downloadAndSend(api, client, msg, threadID, messageID, label) {
  const isAudio = msg.audio || (msg.document?.mimeType || "").includes("audio");
  const ext     = isAudio ? ".mp3" : ".mp4";
  const file    = path.join(process.cwd(), "tmp", "dl_" + Date.now() + ext);
  await fs.ensureDir(path.dirname(file));
  await client.downloadMedia(msg, { outputFile: file });
  const sizeMB = ((await fs.stat(file)).size / 1024 / 1024).toFixed(2);
  await api.sendMessage(
    { body: (label || "✅") + " | " + sizeMB + " MB", attachment: fs.createReadStream(file) },
    threadID,
    () => { fs.remove(file).catch(() => {}); },
    messageID
  );
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

    // إرسال الرابط وانتظار الرسالة التي فيها أزرار فقط
    await client.sendMessage(BOT, { message: url });
    const resultMsg = await waitForButtons(client, botId, WAIT_MS);

    const buttons = extractButtons(resultMsg);

    // عرض الأزرار للمستخدم
    let listText = "⬇️ اختر نوع التنزيل:\n\n";
    buttons.forEach((b, i) => { listText += (i + 1) + ". " + b + "\n"; });
    listText += "\n↩️ رد برقم اختيارك";

    api.sendMessage(listText, threadID, (err, info) => {
      if (err || !info) return;
      global.نزلSessions[info.messageID] = { resultMsg, buttons, client, botId };
      global.client.handleReply.push({
        messageID: info.messageID,
        threadID,
        name: "نزل",
        author: senderID
      });
    }, messageID);

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

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

  const { resultMsg, buttons, client, botId } = session;
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

    // ضغط الزر في تيليجرام
    await resultMsg.click({ text: selectedBtn });

    // انتظار الملف (فيديو أو صوت حقيقي)
    const fileMsg = await waitForFile(client, botId, 60000);

    await downloadAndSend(api, client, fileMsg, threadID, messageID, selectedBtn);

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("❌ نزل handleReply:", e.message);
    api.sendMessage("❌ فشل التنزيل\n\n" + e.message, threadID, messageID);
  }
};
