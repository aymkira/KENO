// ══════════════════════════════════════════════════════════════
//   autoDownload v3 — مع eventType صحيح
//   script/events/autoDownload.js
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");
const { Raw }        = require("telegram/events");
const fs             = require("fs-extra");
const path           = require("path");
const axios          = require("axios");

module.exports.config = {
  name: "autoDownload",
  version: "3.0.0",
  credits: "Ayman",
  description: "تنزيل تلقائي عند مشاركة رابط فيديو",
  eventType: ["message", "message_reply"]  // ← مهم جداً
};

const BOT     = "C_5BOT";
const WAIT_MS = 90000;

const VIDEO_REGEX = /https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/|tiktok\.com\/@[^\/]+\/video|instagram\.com\/(reel|p|tv)\/|facebook\.com\/(watch|reel|videos)|fb\.watch\/|twitter\.com\/[^\/]+\/status|x\.com\/[^\/]+\/status)[^\s]*/i;

function waitForBotMsg(client, botId, timeout = WAIT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      reject(new Error("timeout"));
    }, timeout);

    let resolved = false;

    const finish = (msg) => {
      if (resolved) return;
      // قبول الرسالة إذا فيها فيديو أو أزرار أو نص كافٍ
      const hasMedia   = msg.video || msg.document || msg.audio;
      const hasButtons = (msg.replyMarkup?.rows?.length || 0) > 0;
      const hasText    = msg.message && msg.message.length > 10;
      if (!hasMedia && !hasButtons && !hasText) return;
      if (!hasMedia && !hasButtons) {
        if ((msg.message || "").length < 20) return;
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

async function handleMsg(api, client, botId, msg, threadID, messageID) {
  await fs.ensureDir(path.join(process.cwd(), "tmp"));

  // ── إذا في أزرار — اضغط زر الفيديو تلقائياً ──
  const rows = msg.replyMarkup?.rows || [];
  let finalMsg = msg;

  if (rows.length > 0) {
    const allBtns = [];
    for (const row of rows) {
      for (const btn of (row.buttons || [])) {
        if (btn.text?.trim()) allBtns.push(btn.text.trim());
      }
    }

    // اضغط زر الفيديو أو أول زر
    const videoBtn = allBtns.find(b =>
      b.includes("فيديو") || b.includes("video") || b.includes("مقطع")
    ) || allBtns[0];

    if (videoBtn) {
      try {
        await msg.click({ text: videoBtn });
        // انتظر الرسالة التالية بعد الضغط
        finalMsg = await waitForBotMsg(client, botId, 60000);
      } catch(e) {
        finalMsg = msg; // استخدم الرسالة الأصلية إذا فشل الضغط
      }
    }
  }

  // ── تنزيل الملف ──
  const hasMedia = finalMsg.video || finalMsg.audio ||
    finalMsg.document?.mimeType?.includes("video") ||
    finalMsg.document?.mimeType?.includes("audio");

  let filePath = null;

  if (hasMedia) {
    const ext = finalMsg.audio || finalMsg.document?.mimeType?.includes("audio") ? ".mp3" : ".mp4";
    filePath = path.join(process.cwd(), "tmp", "auto_" + Date.now() + ext);
    await client.downloadMedia(finalMsg, { outputFile: filePath });
  } else {
    const linkMatch = finalMsg.message?.match(/https?:\/\/[^\s]+/);
    if (!linkMatch) throw new Error("لم يتم إيجاد رابط");
    filePath = path.join(process.cwd(), "tmp", "auto_" + Date.now() + ".mp4");
    const res = await axios.get(linkMatch[0], {
      responseType: "stream", timeout: 90000,
      maxContentLength: 50 * 1024 * 1024,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    await new Promise((r, j) => {
      const w = fs.createWriteStream(filePath);
      res.data.pipe(w); w.on("finish", r); w.on("error", j);
    });
  }

  const sizeMB = ((await fs.stat(filePath)).size / 1024 / 1024).toFixed(2);
  await api.sendMessage(
    { body: "✅ " + sizeMB + " MB", attachment: fs.createReadStream(filePath) },
    threadID,
    () => { fs.remove(filePath).catch(() => {}); },
    messageID
  );
}

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, body } = event;
  if (!body) return;

  const match = body.match(VIDEO_REGEX);
  if (!match) return;
  if (typeof global.getTgClient !== "function") return;

  const url = match[0];

  try {
    if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);
  } catch(e) {}

  try {
    const client    = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId     = botEntity.id.toString();

    await client.sendMessage(BOT, { message: url });
    const resultMsg = await waitForBotMsg(client, botId, WAIT_MS);

    await handleMsg(api, client, botId, resultMsg, threadID, messageID);

    try {
      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
    } catch(e) {}

  } catch(e) {
    try {
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    } catch(err) {}
    console.error("❌ autoDownload:", e.message);
  }
};
