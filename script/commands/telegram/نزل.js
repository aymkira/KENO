// ══════════════════════════════════════════════════════════════
//   نزل v7 — تنزيل فيديو مع أزرار اختيار
//   by Ayman
// ══════════════════════════════════════════════════════════════


const { NewMessage } = require("telegram/events");
const { Raw }        = require("telegram/events");
const fs             = require("fs-extra");
const path           = require("path");
const axios          = require("axios");

// ══ انتظار رسالة فيها أزرار فقط ══
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
      if (t && t.length > 0) btns.push(t);
    }
  }
  return btns;
}

// ══ تنزيل وإرسال الملف ══
async function downloadAndSend(api, client, msg, threadID, messageID, label) {
  const isAudio = msg.audio || (msg.document?.mimeType || "").includes("audio");
  const ext     = isAudio ? ".mp3" : ".mp4";
  const tmpDir  = path.join(process.cwd(), "tmp");
  const file    = path.join(tmpDir, "dl_" + Date.now() + ext);
  await fs.ensureDir(tmpDir);

  // ── تنزيل من تيليجرام ──
  await client.downloadMedia(msg, { outputFile: file });

  // تحقق من الملف
  const stat = await fs.stat(file).catch(() => null);
  if (!stat || stat.size === 0) {
    await fs.remove(file).catch(() => {});
    throw new Error("فشل التنزيل — الملف فارغ");
  }

  const sizeMB = (stat.size / 1024 / 1024).toFixed(2);

  // ── إرسال للمسنجر ──
  await new Promise((resolve, reject) => {
    api.sendMessage(
      { body: (label || "✅") + " | " + sizeMB + " MB", attachment: require("fs").createReadStream(file) },
      threadID,
      (err, info) => {
        fs.remove(file).catch(() => {});
        if (err) reject(err);
        else resolve(info);
      },
      messageID
    );
  });
}


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

const BOT = "C_5BOT";
global.نزلSessions = global.نزلSessions || {};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const url = args.join(" ").trim() ||
    event.messageReply?.body?.match(/https?:\/\/[^\s]+/)?.[0];

  if (!url || !url.startsWith("http")) {
    return api.sendMessage(
      "⬇️ تنزيل فيديو\n\nالاستخدام: نزل [رابط]\n\n🎬 YouTube | 🎵 TikTok\n📸 Instagram | 👥 Facebook",
      threadID, messageID
    );
  }

  if (typeof global.getTgClient !== "function") {
    return api.sendMessage("❌ سجّل دخول تيليجرام:\n.tglogin +964XXXXXXXXXX", threadID, messageID);
  }

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    const client    = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId     = botEntity.id.toString();

    await client.sendMessage(BOT, { message: url });
    const btnsMsg = await waitForButtons(client, botId, 90000);
    const buttons = extractButtons(btnsMsg);

    let listText = "⬇️ اختر نوع التنزيل:\n\n";
    buttons.forEach((b, i) => { listText += (i + 1) + ". " + b + "\n"; });
    listText += "\n↩️ رد برقم اختيارك";

    api.sendMessage(listText, threadID, (err, info) => {
      if (err || !info) return;
      global.نزلSessions[info.messageID] = { btnsMsg, buttons, client, botId };
      global.client.handleReply.push({
        messageID: info.messageID, threadID,
        name: "نزل", author: senderID
      });
    }, messageID);

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("❌ فشل التنزيل\n\n" + e.message, threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID } = event;
  const sentMsgID = handleReply.messageID;

  const session = global.نزلSessions[sentMsgID];
  if (!session) return api.sendMessage("❌ انتهت الجلسة", threadID, messageID);

  const { btnsMsg, buttons, client, botId } = session;
  const choiceNum = parseInt(event.body?.trim());

  if (!choiceNum || choiceNum < 1 || choiceNum > buttons.length) {
    return api.sendMessage("❌ اختر بين 1 و " + buttons.length, threadID, messageID);
  }

  delete global.نزلSessions[sentMsgID];
  global.client.handleReply = global.client.handleReply.filter(h => h.messageID !== sentMsgID);

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);

  const selectedBtn = buttons[choiceNum - 1];

  try {
    await btnsMsg.click({ text: selectedBtn });
    const fileMsg = await waitForFile(client, botId, 60000);
    await downloadAndSend(api, client, fileMsg, threadID, messageID, selectedBtn);
    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("❌ فشل التنزيل\n\n" + e.message, threadID, messageID);
  }
};
