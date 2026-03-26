"use strict";
const path = require("path");

module.exports.config = {
  name: "رصيدي",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "عرض الرصيد بدون صور",
  commandCategory: "games",
  usages: "رصيدي [@منشن/رد]",
  cooldowns: 3
};

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); } catch { return null; }
}

function formatNum(n) {
  n = Math.floor(Number(n) || 0);
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9)  return (n / 1e9).toFixed(2)  + "B";
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + "M";
  if (n >= 1e3)  return (n / 1e3).toFixed(2)  + "K";
  return n.toLocaleString();
}

module.exports.run = async function ({ api, event, Users }) {
  const { threadID, messageID, senderID, type, messageReply, mentions } = event;

  let targetID = senderID;
  if (type === "message_reply" && messageReply?.senderID) targetID = messageReply.senderID;
  else if (Object.keys(mentions || {}).length > 0) targetID = Object.keys(mentions)[0];

  const db = getDB();
  if (!db) return api.sendMessage("❌ نظام البيانات غير متاح", threadID, messageID);

  const [wallet, userRecord] = await Promise.all([
    db.getWallet(targetID).catch(() => ({})),
    db.getUser(targetID).catch(() => ({}))
  ]);

  const name = await Users.getNameUser(targetID).catch(() => targetID);

  const money = wallet.money  ?? 0;
  const bank  = wallet.bank   ?? 0;
  const exp   = wallet.exp    ?? 0;
  const level = wallet.level  ?? 1;
  const rank  = wallet.rank   || "مبتدئ";
  const emoji = wallet.rankEmoji || "🔰";
  const msg   = userRecord?.messageCount ?? 0;

  const expForNext = level * 100;
  const expInLevel = exp % expForNext;
  const progress   = Math.min(Math.floor((expInLevel / expForNext) * 100), 100);
  const bar        = "█".repeat(Math.floor(progress / 10)) + "░".repeat(10 - Math.floor(progress / 10));

  const txt =
    `⌬ ━━ 𝗞𝗜𝗥𝗔 BANK ━━ ⌬\n\n` +
    `👤 ${name}\n` +
    `🪙 الرصيد : ${formatNum(money)} $\n` +
    `🏦 البنك  : ${formatNum(bank)} $\n` +
    `💰 المجموع: ${formatNum(money + bank)} $\n\n` +
    `${emoji} الرتبة : ${rank}\n` +
    `⭐ المستوى: ${level}\n` +
    `✨ الخبرة : ${formatNum(exp)} XP\n` +
    `[${bar}] ${progress}%\n\n` +
    `💬 الرسائل: ${formatNum(msg)}`;

  return api.sendMessage(txt, threadID, messageID);
};
