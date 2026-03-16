// ══════════════════════════════════════════════════════════════
//   autoDownload v4
//   script/events/autoDownload.js
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");
const { Raw }        = require("telegram/events");
const { Api }        = require("telegram");
const fs             = require("fs-extra");
const path           = require("path");
const axios          = require("axios");

// ══ انتظار رسالة فيها أزرار ══
function waitForButtons(client, botId, timeout) {
  timeout = timeout || 90000;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      reject(new Error("البوت لم يرد بأزرار"));
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

// ══ انتظار ملف حقيقي ══
function waitForFile(client, botId, timeout) {
  timeout = timeout || 60000;
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

// ══ استخراج الأزرار ══
function extractButtons(msg) {
  const rows = msg.replyMarkup?.rows || [];
  const btns = [];
  for (const row of rows) {
    for (const btn of (row.buttons || [])) {
      const t = btn.text?.trim();
      if (t && t.length > 0) btns.push({ text: t, data: btn.data });
    }
  }
  return btns;
}

// ══ ضغط زر عبر invoke مباشرة ══
async function clickBtn(client, botEntity, msg, btn) {
  try {
    await client.invoke(new Api.messages.GetBotCallbackAnswer({
      peer:   botEntity,
      msgId:  msg.id,
      data:   btn.data || Buffer.from(btn.text)
    }));
  } catch(e) {
    // fallback: msg.click
    try { await msg.click({ text: btn.text }); } catch(e2) {}
  }
}

// ══ تنزيل وإرسال الملف ══
async function downloadAndSend(api, client, msg, threadID, messageID, label) {
  const isAudio = msg.audio || (msg.document?.mimeType || "").includes("audio");
  const ext     = isAudio ? ".mp3" : ".mp4";
  const tmpDir  = path.join(process.cwd(), "tmp");
  const file    = path.join(tmpDir, "dl_" + Date.now() + ext);
  await fs.ensureDir(tmpDir);

  await client.downloadMedia(msg, { outputFile: file });

  const stat = await fs.stat(file).catch(() => null);
  if (!stat || stat.size === 0) {
    await fs.remove(file).catch(() => {});
    throw new Error("الملف فارغ — فشل التنزيل من تيليجرام");
  }

  const sizeMB = (stat.size / 1024 / 1024).toFixed(2);

  await new Promise((resolve, reject) => {
    api.sendMessage(
      { body: (label || "✅") + " | " + sizeMB + " MB",
        attachment: require("fs").createReadStream(file) },
      threadID,
      (err, info) => {
        fs.remove(file).catch(() => {});
        if (err) reject(new Error("فشل إرسال الملف للمسنجر: " + err));
        else resolve(info);
      },
      messageID
    );
  });
}


module.exports.config = {
  name: "autoDownload",
  version: "4.0.0",
  credits: "Ayman",
  description: "تنزيل تلقائي عند مشاركة رابط فيديو",
  eventType: ["message", "message_reply"]
};

const BOT = "C_5BOT";
const VIDEO_REGEX = /https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/|tiktok\.com\/@[^\/]+\/video|instagram\.com\/(reel|p|tv)\/|facebook\.com\/(watch|reel|videos)|fb\.watch\/|twitter\.com\/[^\/]+\/status|x\.com\/[^\/]+\/status)[^\s]*/i;

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, body, attachments } = event;
  if (typeof global.getTgClient !== "function") return;

  let url = body ? (body.match(VIDEO_REGEX) || [])[0] : null;

  if (!url && attachments && attachments.length > 0) {
    const att = attachments.find(a =>
      a.type === "share" || a.type === "video" ||
      (a.url && VIDEO_REGEX.test(a.url))
    );
    if (att) url = att.url || att.playable_url || att.playable_url_quality_hd;
  }

  if (!url) return;

  try { if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e) {}

  try {
    const client    = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId     = botEntity.id.toString();

    await client.sendMessage(BOT, { message: url });
    const btnsMsg = await waitForButtons(client, botId, 90000);
    const buttons = extractButtons(btnsMsg);

    const videoBtn = buttons.find(b =>
      b.text.includes("فيديو") || b.text.includes("video") || b.text.includes("مقطع")
    ) || buttons[0];

    if (!videoBtn) throw new Error("لم يتم إيجاد زر الفيديو");

    await clickBtn(client, botEntity, btnsMsg, videoBtn);
    const fileMsg = await waitForFile(client, botId, 60000);
    await downloadAndSend(api, client, fileMsg, threadID, messageID, "✅");

    try { if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true); } catch(e) {}
  } catch(e) {
    try { if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true); } catch(err) {}
    console.error("❌ autoDownload:", e.message);
  }
};
