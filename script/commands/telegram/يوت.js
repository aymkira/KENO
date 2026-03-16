// ══════════════════════════════════════════════════════════════
//   يوت v3 — ينزل فيديو مباشرة + قائمة مختصرة تحذف تلقائياً
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");
const { Raw }        = require("telegram/events");
const axios          = require("axios");
const fs             = require("fs-extra");
const path           = require("path");

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

const HEADER  = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬";
const BOT     = "C_5BOT";
const WAIT_MS = 90000;

global.يوتSessions = global.يوتSessions || {};

// ══ بحث يوتيوب ══
async function searchYouTube(query) {
  try {
    const res = await axios.get(
      "https://weeb-api.vercel.app/ytsearch?query=" + encodeURIComponent(query),
      { timeout: 10000 }
    );
    if (Array.isArray(res.data) && res.data.length > 0)
      return res.data.slice(0, 5);
  } catch(e) {}
  try {
    const yt = require("yt-search");
    const r  = await yt(query);
    return (r.videos || []).slice(0, 5).map(v => ({
      title:     v.title,
      url:       v.url,
      timestamp: v.timestamp,
      views:     v.views,
      author:    v.author?.name || ""
    }));
  } catch(e) { return []; }
}

// ══ انتظار رسالة فيها أزرار فقط ══
function waitForButtons(client, botId, timeout = WAIT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { client.removeEventHandler(onNew, new NewMessage({})); } catch(e) {}
      try { client.removeEventHandler(onRaw, new Raw({})); } catch(e) {}
      reject(new Error("انتهت مهلة الانتظار"));
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

// ══ استخراج أزرار ══
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

// ══ تنزيل وإرسال ملف ══
async function downloadAndSend(api, client, msg, threadID, messageID, label) {
  const isAudio = msg.audio || (msg.document?.mimeType || "").includes("audio");
  const ext     = isAudio ? ".mp3" : ".mp4";
  const file    = path.join(process.cwd(), "tmp", "yt_" + Date.now() + ext);
  await fs.ensureDir(path.dirname(file));
  await client.downloadMedia(msg, { outputFile: file });
  const sizeMB = ((await fs.stat(file)).size / 1024 / 1024).toFixed(2);
  await api.sendMessage(
    { body: (label || "✅") + " | " + sizeMB + " MB", attachment: fs.createReadStream(file) },
    threadID, () => { fs.remove(file).catch(() => {}); }, messageID
  );
}

// ══ RUN ══
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const query = args.join(" ").trim();
  if (!query) {
    return api.sendMessage(
      HEADER + "\n\n🔍 اكتب اسم الفيديو\n\nمثال:\nيوت moonlight xxxtentacion",
      threadID, messageID
    );
  }

  if (api.setMessageReaction) api.setMessageReaction("🔎", messageID, () => {}, true);

  try {
    const results = await searchYouTube(query);
    if (!results || results.length === 0) {
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(HEADER + "\n\n❌ لا نتائج", threadID, messageID);
    }

    // قائمة مختصرة
    let listText = "🔍 \"" + query + "\"\n\n";
    results.forEach((v, i) => {
      listText += (i + 1) + ". " + v.title.substring(0, 40) + (v.title.length > 40 ? "..." : "");
      if (v.timestamp) listText += " (" + v.timestamp + ")";
      listText += "\n";
    });
    listText += "\n↩️ رد برقم";

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

    api.sendMessage(listText, threadID, (err, info) => {
      if (err || !info) return;

      global.يوتSessions[info.messageID] = {
        results, senderID, step: "search",
        listMsgID: info.messageID
      };

      global.client.handleReply.push({
        messageID: info.messageID,
        threadID,
        name: "يوت",
        author: senderID
      });

      // حذف القائمة بعد 60 ثانية تلقائياً
      setTimeout(() => {
        try { api.unsendMessage(info.messageID); } catch(e) {}
        delete global.يوتSessions[info.messageID];
        global.client.handleReply = global.client.handleReply.filter(
          h => h.messageID !== info.messageID
        );
      }, 60000);

    }, messageID);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(HEADER + "\n\n❌ فشل البحث\n" + e.message, threadID, messageID);
  }
};

// ══ HANDLE REPLY ══
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID } = event;
  const sentMsgID = handleReply.messageID;

  const session = global.يوتSessions[sentMsgID];
  if (!session) return;

  // ── المرحلة 1: اختيار الفيديو ──
  if (session.step === "search") {
    const { results, listMsgID } = session;
    const choiceNum = parseInt(event.body?.trim());

    if (!choiceNum || choiceNum < 1 || choiceNum > results.length) {
      return api.sendMessage("❌ اختر بين 1 و " + results.length, threadID, messageID);
    }

    // حذف الجلسة والقائمة فوراً
    delete global.يوتSessions[sentMsgID];
    global.client.handleReply = global.client.handleReply.filter(h => h.messageID !== sentMsgID);
    try { api.unsendMessage(listMsgID); } catch(e) {}

    const selected = results[choiceNum - 1];
    if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
      if (typeof global.getTgClient !== "function") throw new Error("SESSION_REQUIRED");

      const client    = await global.getTgClient();
      const botEntity = await client.getEntity(BOT);
      const botId     = botEntity.id.toString();

      // إرسال الرابط وانتظار الأزرار
      await client.sendMessage(BOT, { message: selected.url });
      const btnsMsg = await waitForButtons(client, botId, WAIT_MS);

      const buttons = extractButtons(btnsMsg);

      // إيجاد زر الفيديو وضغطه مباشرة
      const videoBtn = buttons.find(b =>
        b.includes("فيديو") || b.includes("video") || b.includes("مقطع")
      ) || buttons[0];

      if (!videoBtn) throw new Error("لم يتم إيجاد زر الفيديو");

      await btnsMsg.click({ text: videoBtn });

      // انتظار الملف
      const fileMsg = await waitForFile(client, botId, 60000);
      await downloadAndSend(api, client, fileMsg, threadID, messageID, selected.title.substring(0, 30));

      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

    } catch(e) {
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(
        e.message.includes("SESSION_REQUIRED")
          ? "❌ سجّل دخول تيليجرام أولاً:\n.tglogin +964XXXXXXXXXX"
          : "❌ فشل التنزيل\n" + e.message,
        threadID, messageID
      );
    }
    return;
  }
};
