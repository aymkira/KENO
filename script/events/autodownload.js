// ══════════════════════════════════════════════════════════════
//   autoDownload — تنزيل تلقائي عند إرسال رابط
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
  version: "2.0.0",
  credits: "Ayman",
  description: "تنزيل تلقائي عند مشاركة رابط فيديو"
};

const BOT     = "C_5BOT";
const WAIT_MS = 90000;

const VIDEO_REGEX = /https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/|tiktok\.com\/@[^\/]+\/video|instagram\.com\/(reel|p|tv)\/|facebook\.com\/(watch|reel|videos)|fb\.watch\/|twitter\.com\/[^\/]+\/status|x\.com\/[^\/]+\/status)[^\s]*/i;

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
      const hasMedia   = msg.video || msg.document || msg.audio;
      const hasButtons = (msg.replyMarkup?.rows?.length || 0) > 0;
      const hasText    = msg.message && msg.message.length > 10;
      if (!hasMedia && !hasButtons && !hasText) return;
      if (!hasMedia && !hasButtons) {
        if ((msg.message?.toLowerCase() || "").includes("...") && msg.message.length < 20) return;
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

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, body } = event;

  if (!body) return;
  const match = body.match(VIDEO_REGEX);
  if (!match) return;
  if (typeof global.getTgClient !== "function") return;

  const url = match[0];

  // تفاعل فوري
  try {
    if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);
  } catch(e) {}

  let filePath = null;

  try {
    const client    = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId     = botEntity.id.toString();

    await client.sendMessage(BOT, { message: url });
    const resultMsg = await waitForBotMsg(client, botId, WAIT_MS);

    await fs.ensureDir(path.join(process.cwd(), "tmp"));

    // إذا في أزرار — اضغط أول زر فيديو تلقائياً
    const buttons = extractChoiceButtons(resultMsg);
    let finalMsg  = resultMsg;

    if (buttons.length > 0) {
      // اضغط أول زر يحتوي على "فيديو" أو أول زر
      const videoBtn = buttons.find(b =>
        b.includes("فيديو") || b.includes("video") || b.includes("مقطع")
      ) || buttons[0];

      await resultMsg.click({ text: videoBtn });
      finalMsg = await waitForBotMsg(client, botId, 60000);
    }

    // تنزيل وإرسال
    const hasMedia = finalMsg.video || finalMsg.audio ||
      finalMsg.document?.mimeType?.includes("video") ||
      finalMsg.document?.mimeType?.includes("audio");

    if (hasMedia) {
      const ext = finalMsg.audio || finalMsg.document?.mimeType?.includes("audio") ? ".mp3" : ".mp4";
      filePath = path.join(process.cwd(), "tmp", "auto_" + Date.now() + ext);
      await client.downloadMedia(finalMsg, { outputFile: filePath });
      const sizeMB = ((await fs.stat(filePath)).size / 1024 / 1024).toFixed(2);
      await api.sendMessage(
        { body: "✅ " + sizeMB + " MB", attachment: require("fs").createReadStream(filePath) },
        threadID, () => { fs.remove(filePath).catch(() => {}); }, messageID
      );
    } else {
      const linkMatch = finalMsg.message?.match(/https?:\/\/[^\s]+/);
      if (!linkMatch) throw new Error("no link");
      filePath = path.join(process.cwd(), "tmp", "auto_" + Date.now() + ".mp4");
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
        { body: "✅ " + sizeMB + " MB", attachment: require("fs").createReadStream(filePath) },
        threadID, () => { fs.remove(filePath).catch(() => {}); }, messageID
      );
    }

    try {
      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
    } catch(e) {}

  } catch(e) {
    try {
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    } catch(err) {}
    if (filePath) fs.remove(filePath).catch(() => {});
    console.error("❌ autoDownload:", e.message);
  }
};
