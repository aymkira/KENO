// ══════════════════════════════════════════════════════════════
//   يوت v3
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
  name: "يوت",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "بحث يوتيوب وتنزيل فيديو",
  commandCategory: "media",
  usages: "يوت [اسم الفيديو]",
  cooldowns: 15
};

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬";
const BOT    = "C_5BOT";
global.يوتSessions = global.يوتSessions || {};

async function searchYouTube(query) {
  try {
    const res = await axios.get(
      "https://weeb-api.vercel.app/ytsearch?query=" + encodeURIComponent(query),
      { timeout: 10000 }
    );
    if (Array.isArray(res.data) && res.data.length > 0) return res.data.slice(0, 5);
  } catch(e) {}
  try {
    const yt = require("yt-search");
    const r  = await yt(query);
    return (r.videos || []).slice(0, 5).map(v => ({
      title: v.title, url: v.url,
      timestamp: v.timestamp, views: v.views,
      author: v.author?.name || ""
    }));
  } catch(e) { return []; }
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const query = args.join(" ").trim();
  if (!query) return api.sendMessage(HEADER + "\n\n🔍 اكتب اسم الفيديو", threadID, messageID);

  if (api.setMessageReaction) api.setMessageReaction("🔎", messageID, () => {}, true);

  try {
    const results = await searchYouTube(query);
    if (!results || results.length === 0) {
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(HEADER + "\n\n❌ لا نتائج", threadID, messageID);
    }

    let listText = "🔍 \"" + query + "\"\n\n";
    results.forEach((v, i) => {
      const t = v.title.length > 40 ? v.title.substring(0, 40) + "..." : v.title;
      listText += (i + 1) + ". " + t + (v.timestamp ? " (" + v.timestamp + ")" : "") + "\n";
    });
    listText += "\n↩️ رد برقم";

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

    api.sendMessage(listText, threadID, (err, info) => {
      if (err || !info) return;
      global.يوتSessions[info.messageID] = { results, senderID, listMsgID: info.messageID };
      global.client.handleReply.push({
        messageID: info.messageID, threadID, name: "يوت", author: senderID
      });
      setTimeout(() => {
        try { api.unsendMessage(info.messageID); } catch(e) {}
        delete global.يوتSessions[info.messageID];
        global.client.handleReply = global.client.handleReply.filter(h => h.messageID !== info.messageID);
      }, 60000);
    }, messageID);
  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(HEADER + "\n\n❌ فشل البحث\n" + e.message, threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID } = event;
  const sentMsgID = handleReply.messageID;
  const session = global.يوتSessions[sentMsgID];
  if (!session) return;

  const { results, listMsgID } = session;
  const choiceNum = parseInt(event.body?.trim());
  if (!choiceNum || choiceNum < 1 || choiceNum > results.length)
    return api.sendMessage("❌ اختر بين 1 و " + results.length, threadID, messageID);

  delete global.يوتSessions[sentMsgID];
  global.client.handleReply = global.client.handleReply.filter(h => h.messageID !== sentMsgID);
  try { api.unsendMessage(listMsgID); } catch(e) {}

  const selected = results[choiceNum - 1];
  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    if (typeof global.getTgClient !== "function") throw new Error("SESSION_REQUIRED");

    const client     = await global.getTgClient();
    const botEntity  = await client.getEntity(BOT);
    const botId      = botEntity.id.toString();

    await client.sendMessage(BOT, { message: selected.url });
    const btnsMsg = await waitForButtons(client, botId, 90000);
    const buttons = extractButtons(btnsMsg);

    const videoBtn = buttons.find(b =>
      b.text.includes("فيديو") || b.text.includes("video") || b.text.includes("مقطع")
    ) || buttons[0];

    if (!videoBtn) throw new Error("لم يتم إيجاد زر الفيديو");

    await clickBtn(client, botEntity, btnsMsg, videoBtn);
    const fileMsg = await waitForFile(client, botId, 60000);
    await downloadAndSend(api, client, fileMsg, threadID, messageID, selected.title.substring(0, 30));

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(e.message.includes("SESSION_REQUIRED")
      ? "❌ سجّل دخول: .tglogin +964XXXXXXXXXX"
      : "❌ فشل التنزيل\n" + e.message, threadID, messageID);
  }
};
