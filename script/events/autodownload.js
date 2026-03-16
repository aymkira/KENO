// ══════════════════════════════════════════════════════════════
//   autoDownload v4 — يضغط زر الفيديو تلقائياً
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
  version: "4.0.0",
  credits: "Ayman",
  description: "تنزيل تلقائي عند مشاركة رابط فيديو",
  eventType: ["message", "message_reply"]
};

const BOT     = "C_5BOT";
const WAIT_MS = 90000;

const VIDEO_REGEX = /https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/|tiktok\.com\/@[^\/]+\/video|instagram\.com\/(reel|p|tv)\/|facebook\.com\/(watch|reel|videos)|fb\.watch\/|twitter\.com\/[^\/]+\/status|x\.com\/[^\/]+\/status)[^\s]*/i;

// ── انتظر رسالة فيها أزرار فقط ──
function waitForButtons(client, botId, timeout = WAIT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      reject(new Error("timeout"));
    }, timeout);

    let resolved = false;

    const finish = (msg) => {
      if (resolved) return;
      if ((msg.replyMarkup?.rows?.length || 0) === 0) return;
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

// ── انتظر ملف حقيقي (فيديو أو صوت) ──
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
      const hasVideo = msg.video || (msg.document?.mimeType || "").includes("video");
      const hasAudio = msg.audio || (msg.document?.mimeType || "").includes("audio");
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

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, body, attachments } = event;
  if (typeof global.getTgClient !== "function") return;

  // ── البحث عن رابط في النص ──
  let url = body ? (body.match(VIDEO_REGEX) || [])[0] : null;

  // ── إذا ما في رابط، فحص المرفقات (مشاركة ريلز/فيديو مباشر) ──
  if (!url && attachments && attachments.length > 0) {
    const videoAtt = attachments.find(a =>
      a.type === "share" || a.type === "video" ||
      (a.url && VIDEO_REGEX.test(a.url))
    );
    if (videoAtt) {
      url = videoAtt.url || videoAtt.playable_url || videoAtt.playable_url_quality_hd;
    }
  }

  if (!url) return;

  // تفاعل ⏳ فوري
  try { if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e) {}

  let filePath = null;

  try {
    const client    = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId     = botEntity.id.toString();

    // إرسال الرابط وانتظار الرسالة التي فيها أزرار
    await client.sendMessage(BOT, { message: url });
    const btnsMsg = await waitForButtons(client, botId, WAIT_MS);

    // استخراج الأزرار وإيجاد زر الفيديو
    const rows   = btnsMsg.replyMarkup?.rows || [];
    const allBtns = [];
    for (const row of rows) {
      for (const btn of (row.buttons || [])) {
        if (btn.text?.trim()) allBtns.push(btn.text.trim());
      }
    }

    const videoBtn = allBtns.find(b =>
      b.includes("فيديو") || b.includes("video") || b.includes("مقطع")
    ) || allBtns[0];

    if (!videoBtn) throw new Error("لم يتم إيجاد زر الفيديو");

    // ضغط زر الفيديو تلقائياً
    await btnsMsg.click({ text: videoBtn });

    // انتظار الملف الحقيقي
    const fileMsg = await waitForFile(client, botId, 60000);

    await fs.ensureDir(path.join(process.cwd(), "tmp"));

    const isAudio = fileMsg.audio || (fileMsg.document?.mimeType || "").includes("audio");
    const ext     = isAudio ? ".mp3" : ".mp4";
    filePath      = path.join(process.cwd(), "tmp", "auto_" + Date.now() + ext);

    await client.downloadMedia(fileMsg, { outputFile: filePath });

    const sizeMB = ((await fs.stat(filePath)).size / 1024 / 1024).toFixed(2);

    await api.sendMessage(
      { body: "✅ " + sizeMB + " MB", attachment: fs.createReadStream(filePath) },
      threadID,
      () => { fs.remove(filePath).catch(() => {}); },
      messageID
    );

    try { if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true); } catch(e) {}

  } catch(e) {
    try { if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true); } catch(err) {}
    if (filePath) fs.remove(filePath).catch(() => {});
    console.error("❌ autoDownload:", e.message);
  }
};
