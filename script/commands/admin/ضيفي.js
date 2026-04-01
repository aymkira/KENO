const path = require("path");
const fs   = require("fs");

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "config.json"), "utf8")); }
  catch { return {}; }
}

async function getUID(url, api) {
  const regexName = new RegExp(/"title":"(.*?)"/s);
  if (!url.includes("facebook.com") && !url.includes("fb.com"))
    return ["⚠️ رابط غير صالح", null, true];
  try {
    if (!url.startsWith("http")) url = "https://" + url;
    let data = await api.httpGet(url);
    const redirect = /for \(;;\);{"redirect":"(.*?)"}/.exec(data);
    if (data.includes('"ajaxify":"'))
      data = await api.httpGet(redirect[1].replace(/\\/g, "").replace(/(?<=\?\s*)(.*)/, "").slice(0, -31 || undefined));
    const uid  = /"userID":"(\d+)"/.exec(data);
    const name = JSON.parse('{"name"' + data.match(regexName)[1] + '"}').name || null;
    return [+uid[1], name, false];
  } catch {
    return [null, null, true];
  }
}

module.exports.config = {
  name:            "ضيفي",
  version:         "2.0.0",
  hasPermssion:    0,
  credits:         "Ayman",
  description:     "إضافة عضو عبر المعرف أو الرابط أو المنشن أو الرد",
  commandCategory: "admin",
  usages:          "ضيفي @منشن | ضيفي [ID] | ضيفي [رابط] | رد على رسالة",
  cooldowns:       3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const cfg      = loadConfig();
  const BOTNAME  = cfg.BOTNAME  || "البوت";
  const ADMINBOT = cfg.ADMINBOT || [];

  const H = `⌬ ━━ ${BOTNAME} ADMIN ━━ ⌬`;
  const F =  "⌬ ━━━━━━━━━━━━━━━ ⌬";
  const out = (msg) => api.sendMessage(`${H}\n${msg}\n${F}`, threadID, messageID);

  let { participantIDs, approvalMode, adminIDs } = await api.getThreadInfo(threadID);
  participantIDs = participantIDs.map((e) => parseInt(e));
  const botID = parseInt(api.getCurrentUserID());

  // رد على رسالة (بدون منشن وبدون args)
  if (event.messageReply && !args[0] && Object.keys(event.mentions).length === 0) {
    return addUser(parseInt(event.messageReply.senderID), undefined);
  }

  // منشن — يضيف كل المذكورين
  const mentions = Object.keys(event.mentions);
  if (mentions.length > 0) {
    for (const uid of mentions)
      await addUser(parseInt(uid), event.mentions[uid]?.replace(/@/g, "") || undefined);
    return;
  }

  // args: ID أو رابط
  if (!args[0]) return out("⚠️ أدخل معرف، رابط، منشن، أو رد على رسالة.");
  if (!isNaN(args[0])) return addUser(parseInt(args[0]), undefined);

  try {
    const [id, name, fail] = await getUID(args[0], api);
    if (fail && id !== null) return out(id);
    if (fail) return out("❗ لم يُعثر على المعرف.");
    return addUser(id, name || undefined);
  } catch (e) {
    return out(`❌ ${e.message}`);
  }

  async function addUser(id, name) {
    id = parseInt(id);
    const label = name || "العضو";
    if (participantIDs.includes(id)) return out(`⚠️ ${label} موجود بالفعل.`);
    const admins = adminIDs.map((e) => parseInt(e.id));
    try { await api.addUserToGroup(id, threadID); }
    catch { return out(`🚫 تعذّر إضافة ${label}.`); }
    if (approvalMode && !admins.includes(botID)) return out(`✅ ${label} أُضيف لقائمة الموافقة.`);
    return out(`✅ تمت إضافة ${label}.`);
  }
};
