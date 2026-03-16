// ══════════════════════════════════════════════════════════════
//   يوت — بحث يوتيوب وتنزيل فيديو
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage } = require("telegram/events");
const { Raw }        = require("telegram/events");
const axios          = require("axios");
const fs             = require("fs-extra");
const path           = require("path");

module.exports.config = {
  name: "يوت",
  version: "1.0.0",
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
    return [];
  } catch(e) {
    // fallback: yt-search
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
    } catch(e2) { return []; }
  }
}

// ══ انتظار رد بوت تيليجرام ══
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
      if (!hasMedia && !hasButtons) {
        const lower = msg.message?.toLowerCase() || "";
        if (lower.includes("...") && msg.message.length < 20) return;
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

// ══ استخراج أزرار الاختيار ══
function extractChoiceButtons(msg) {
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

// ══ تنزيل ملف وإرساله ══
async function downloadAndSend(api, client, msg, threadID, messageID, label) {
  const ext      = msg.audio || msg.document?.mimeType?.includes("audio") ? ".mp3" : ".mp4";
  const filePath = path.join(process.cwd(), "tmp", "yt_" + Date.now() + ext);
  await fs.ensureDir(path.dirname(filePath));
  await client.downloadMedia(msg, { outputFile: filePath });
  const sizeMB = ((await fs.stat(filePath)).size / 1024 / 1024).toFixed(2);
  await api.sendMessage(
    { body: (label || "✅") + " | " + sizeMB + " MB", attachment: fs.createReadStream(filePath) },
    threadID,
    () => { fs.remove(filePath).catch(() => {}); },
    messageID
  );
}

// ══ RUN ══
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const query = args.join(" ").trim();
  if (!query) {
    return api.sendMessage(
      HEADER + "\n\n🔍 اكتب اسم الفيديو أو الأغنية\n\nمثال:\nيوت moonlight xxxtentacion\nيوت فيديو كليب فلانة",
      threadID, messageID
    );
  }

  if (api.setMessageReaction) api.setMessageReaction("🔎", messageID, () => {}, true);

  try {
    // ══ بحث ══
    const results = await searchYouTube(query);

    if (!results || results.length === 0) {
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(HEADER + "\n\n❌ لم يتم العثور على نتائج", threadID, messageID);
    }

    // ══ بناء القائمة ══
    let listText = HEADER + "\n\n🔍 نتائج البحث عن:\n\"" + query + "\"\n\n";
    results.forEach((v, i) => {
      listText += (i + 1) + ". " + v.title + "\n";
      if (v.timestamp) listText += "   ⏱️ " + v.timestamp;
      if (v.views)     listText += " | 👁️ " + (typeof v.views === "number" ? v.views.toLocaleString() : v.views);
      if (v.author)    listText += " | 🎤 " + v.author;
      listText += "\n\n";
    });
    listText += "↩️ رد برقم الفيديو الذي تريده";

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

    // ══ إرسال القائمة وتسجيل handleReply ══
    api.sendMessage(listText, threadID, (err, info) => {
      if (err || !info) return;

      global.يوتSessions[info.messageID] = { results, senderID };

      global.client.handleReply.push({
        messageID: info.messageID,
        threadID,
        name: "يوت",
        author: senderID
      });
    }, messageID);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("❌ يوت:", e.message);
    api.sendMessage(HEADER + "\n\n❌ فشل البحث\n" + e.message, threadID, messageID);
  }
};

// ══ HANDLE REPLY ══
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID } = event;
  const sentMsgID = handleReply.messageID;

  const session = global.يوتSessions[sentMsgID];
  if (!session) {
    return api.sendMessage("❌ انتهت الجلسة، ابحث مجدداً", threadID, messageID);
  }

  const { results } = session;
  const input       = event.body?.trim() || "";
  const choiceNum   = parseInt(input);

  if (!choiceNum || choiceNum < 1 || choiceNum > results.length) {
    return api.sendMessage(
      "❌ اختر رقماً بين 1 و " + results.length,
      threadID, messageID
    );
  }

  // حذف الجلسة
  delete global.يوتSessions[sentMsgID];
  global.client.handleReply = global.client.handleReply.filter(h => h.messageID !== sentMsgID);

  const selected = results[choiceNum - 1];
  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);
  api.sendMessage(
    HEADER + "\n\n⬇️ جاري تنزيل:\n" + selected.title + "\n⏳ انتظر...",
    threadID, messageID
  );

  let filePath = null;

  try {
    if (typeof global.getTgClient !== "function") throw new Error("SESSION_REQUIRED");

    const client    = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId     = botEntity.id.toString();

    // إرسال رابط اليوتيوب لبوت تيليجرام
    await client.sendMessage(BOT, { message: selected.url });
    const resultMsg = await waitForBotMsg(client, botId, WAIT_MS);

    await fs.ensureDir(path.join(process.cwd(), "tmp"));

    // إذا في أزرار — اضغط زر الفيديو
    const btns = extractChoiceButtons(resultMsg);
    let finalMsg = resultMsg;

    if (btns.length > 0) {
      const videoBtn = btns.find(b =>
        b.includes("فيديو") || b.includes("video") || b.includes("مقطع")
      ) || btns[0];

      await resultMsg.click({ text: videoBtn });
      finalMsg = await waitForBotMsg(client, botId, 60000);
    }

    // تنزيل وإرسال
    const hasMedia = finalMsg.video || finalMsg.audio ||
      finalMsg.document?.mimeType?.includes("video") ||
      finalMsg.document?.mimeType?.includes("audio");

    if (hasMedia) {
      await downloadAndSend(api, client, finalMsg, threadID, messageID, selected.title);
    } else {
      const linkMatch = finalMsg.message?.match(/https?:\/\/[^\s]+/);
      if (!linkMatch) throw new Error("البوت لم يرسل رابط التنزيل");

      const ext = ".mp4";
      filePath  = path.join(process.cwd(), "tmp", "yt_" + Date.now() + ext);
      const res = await axios.get(linkMatch[0], {
        responseType: "stream", timeout: 90000,
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
        { body: selected.title + "\n📦 " + sizeMB + " MB", attachment: fs.createReadStream(filePath) },
        threadID,
        () => { fs.remove(filePath).catch(() => {}); },
        messageID
      );
    }

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    if (filePath) fs.remove(filePath).catch(() => {});
    console.error("❌ يوت handleReply:", e.message);
    api.sendMessage(
      e.message.includes("SESSION_REQUIRED")
        ? "❌ سجّل دخول تيليجرام أولاً:\n.tglogin +964XXXXXXXXXX"
        : HEADER + "\n\n❌ فشل التنزيل\n" + e.message,
      threadID, messageID
    );
  }
};
