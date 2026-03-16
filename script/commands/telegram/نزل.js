// ══════════════════════════════════════════════════════════════
//   يوت v2 — مصلح مع فيديو+أزرار
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");
const { Raw }        = require("telegram/events");
const axios          = require("axios");
const fs             = require("fs-extra");
const path           = require("path");

module.exports.config = {
  name: "يوت",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "بحث يوتيوب وتنزيل فيديو أو صوت",
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

// ══ انتظار رد البوت ══
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

// ══ استخراج الأزرار ══
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

// ══ تنزيل وإرسال ملف ══
async function downloadAndSend(api, client, msg, threadID, messageID, label) {
  const ext  = msg.audio || msg.document?.mimeType?.includes("audio") ? ".mp3" : ".mp4";
  const file = path.join(process.cwd(), "tmp", "yt_" + Date.now() + ext);
  await fs.ensureDir(path.dirname(file));
  await client.downloadMedia(msg, { outputFile: file });
  const sizeMB = ((await fs.stat(file)).size / 1024 / 1024).toFixed(2);
  await api.sendMessage(
    { body: (label || "✅") + " | " + sizeMB + " MB", attachment: fs.createReadStream(file) },
    threadID, () => { fs.remove(file).catch(() => {}); }, messageID
  );
}

// ══ معالجة رد البوت ══
async function processBotMsg(api, client, botId, msg, threadID, messageID, senderID, title) {
  await fs.ensureDir(path.join(process.cwd(), "tmp"));

  const hasVideo   = msg.video || msg.document?.mimeType?.includes("video") ||
    (msg.document?.attributes || []).some(a => a.className === "DocumentAttributeVideo");
  const buttons    = extractButtons(msg);
  const hasButtons = buttons.length > 0;

  // ── فيديو + أزرار أو أزرار فقط → أعرض قائمة للمستخدم ──
  if (hasButtons) {
    let listText = HEADER + "\n\n⬇️ اختر نوع التنزيل:\n\n";
    buttons.forEach((b, i) => { listText += (i + 1) + ". " + b + "\n"; });
    listText += "\n↩️ رد برقم اختيارك";

    api.sendMessage(listText, threadID, (err, info) => {
      if (err || !info) return;
      // حفظ الرسالة الأصلية مع الأزرار
      global.يوتSessions[info.messageID] = {
        msg, buttons, client, botId,
        hasVideo, title
      };
      global.client.handleReply.push({
        messageID: info.messageID,
        threadID,
        name: "يوت",
        author: senderID
      });
    }, messageID);
    return;
  }

  // ── فيديو مباشر ──
  if (hasVideo) {
    await downloadAndSend(api, client, msg, threadID, messageID, title || "✅");
    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
    return;
  }

  // ── رابط في النص ──
  const linkMatch = msg.message?.match(/https?:\/\/[^\s]+/);
  if (linkMatch) {
    const file = path.join(process.cwd(), "tmp", "yt_" + Date.now() + ".mp4");
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
      { body: (title || "✅") + " | " + sizeMB + " MB", attachment: fs.createReadStream(file) },
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
      return api.sendMessage(HEADER + "\n\n❌ لم يتم العثور على نتائج", threadID, messageID);
    }

    let listText = HEADER + "\n\n🔍 نتائج: \"" + query + "\"\n\n";
    results.forEach((v, i) => {
      listText += (i + 1) + ". " + v.title + "\n";
      if (v.timestamp) listText += "   ⏱️ " + v.timestamp;
      if (v.views)     listText += " | 👁️ " + (typeof v.views === "number" ? v.views.toLocaleString() : v.views);
      if (v.author)    listText += " | 🎤 " + v.author;
      listText += "\n\n";
    });
    listText += "↩️ رد برقم الفيديو";

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

    api.sendMessage(listText, threadID, (err, info) => {
      if (err || !info) return;
      global.يوتSessions[info.messageID] = { results, senderID, step: "search" };
      global.client.handleReply.push({
        messageID: info.messageID,
        threadID,
        name: "يوت",
        author: senderID
      });
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
  if (!session) return api.sendMessage("❌ انتهت الجلسة، ابحث مجدداً", threadID, messageID);

  // ── المرحلة 1: اختيار الفيديو من نتائج البحث ──
  if (session.step === "search") {
    const { results } = session;
    const choiceNum = parseInt(event.body?.trim());

    if (!choiceNum || choiceNum < 1 || choiceNum > results.length) {
      return api.sendMessage("❌ اختر رقماً بين 1 و " + results.length, threadID, messageID);
    }

    delete global.يوتSessions[sentMsgID];
    global.client.handleReply = global.client.handleReply.filter(h => h.messageID !== sentMsgID);

    const selected = results[choiceNum - 1];
    if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage(HEADER + "\n\n⬇️ جاري جلب:\n" + selected.title + "\n⏳ انتظر...", threadID, messageID);

    try {
      if (typeof global.getTgClient !== "function") throw new Error("SESSION_REQUIRED");

      const client    = await global.getTgClient();
      const botEntity = await client.getEntity(BOT);
      const botId     = botEntity.id.toString();

      await client.sendMessage(BOT, { message: selected.url });
      const resultMsg = await waitForBotMsg(client, botId, WAIT_MS);

      await processBotMsg(api, client, botId, resultMsg, threadID, messageID, senderID, selected.title);

    } catch(e) {
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(
        e.message.includes("SESSION_REQUIRED")
          ? "❌ سجّل دخول تيليجرام أولاً:\n.tglogin +964XXXXXXXXXX"
          : HEADER + "\n\n❌ فشل التنزيل\n" + e.message,
        threadID, messageID
      );
    }
    return;
  }

  // ── المرحلة 2: اختيار نوع التنزيل (فيديو/صوت) ──
  const { msg, buttons, client, botId, hasVideo, title } = session;
  const choiceNum = parseInt(event.body?.trim());

  if (!choiceNum || choiceNum < 1 || choiceNum > buttons.length) {
    return api.sendMessage("❌ اختر رقماً بين 1 و " + buttons.length, threadID, messageID);
  }

  delete global.يوتSessions[sentMsgID];
  global.client.handleReply = global.client.handleReply.filter(h => h.messageID !== sentMsgID);

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);

  const selectedBtn = buttons[choiceNum - 1];

  try {
    await fs.ensureDir(path.join(process.cwd(), "tmp"));

    // إذا الفيديو موجود في الرسالة الأصلية وهو أول خيار
    if (hasVideo && (selectedBtn.includes("فيديو") || selectedBtn.includes("video") || selectedBtn.includes("مقطع"))) {
      await downloadAndSend(api, client, msg, threadID, messageID, selectedBtn);
    } else {
      // ضغط الزر وانتظار الرد
      await msg.click({ text: selectedBtn });
      const fileMsg = await waitForBotMsg(client, botId, 60000);

      const hasMedia = fileMsg.video || fileMsg.audio ||
        fileMsg.document?.mimeType?.includes("video") ||
        fileMsg.document?.mimeType?.includes("audio");

      if (hasMedia) {
        await downloadAndSend(api, client, fileMsg, threadID, messageID, selectedBtn);
      } else {
        const linkMatch = fileMsg.message?.match(/https?:\/\/[^\s]+/);
        if (!linkMatch) throw new Error("البوت لم يرسل الملف");
        const ext  = selectedBtn.includes("صوت") ? ".mp3" : ".mp4";
        const file = path.join(process.cwd(), "tmp", "yt_" + Date.now() + ext);
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
    console.error("❌ يوت handleReply:", e.message);
    api.sendMessage(HEADER + "\n\n❌ فشل التنزيل\n" + e.message, threadID, messageID);
  }
};
