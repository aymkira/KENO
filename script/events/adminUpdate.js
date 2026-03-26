const fs   = require("fs");
const path = require("path");

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}

const CFG      = loadConfig();
const BOT_NAME = CFG.BOTNAME || 'BOT';
const HEADER   = `⌬ ━━ ${BOT_NAME} GROUP ━━ ⌬`;

module.exports.config = {
  name:        "adminUpdate",
  eventType:   [
    "log:thread-admins", "log:thread-name", "log:user-nickname",
    "log:thread-call",   "log:thread-icon", "log:thread-color",
    "log:link-status",   "log:magic-words", "log:thread-approval-mode",
    "log:thread-poll",
  ],
  version:     "3.0.0",
  credits:     "ayman",
  description: "تحديث معلومات المجموعة تلقائياً",
  envConfig: {
    autoUnsend:   true,
    sendNoti:     true,
    timeToUnsend: 5,       // ← سريع: 5 ثواني بدل 10
  },
};

// ── مسار الأيقونات ─────────────────────────────────────────────
const iconPath = path.join(__dirname, "emoji.json");
if (!fs.existsSync(iconPath)) fs.writeFileSync(iconPath, "{}");

// ── helper: إرسال مع unsend سريع ──────────────────────────────
async function sendAuto(api, threadID, msg, attachments = null) {
  const cfg   = global.configModule?.adminUpdate || module.exports.config.envConfig;
  if (cfg.sendNoti === false) return;

  const payload = attachments ? { body: msg, attachment: attachments } : msg;

  api.sendMessage(payload, threadID, async (err, info) => {
    if (err || !info) return;
    if (cfg.autoUnsend !== false) {
      const delay = (cfg.timeToUnsend || 5) * 1000;
      setTimeout(() => api.unsendMessage(info.messageID), delay);
    }
  });
}

// ── تحويل الثواني ──────────────────────────────────────────────
function formatDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

// ── الحدث الرئيسي ──────────────────────────────────────────────
module.exports.run = async function ({ event, api, Threads, Users }) {
  const { author, threadID, logMessageType, logMessageData, logMessageBody } = event;
  const { setData, getData } = Threads;

  if (author == threadID) return;

  try {
    const threadRaw  = await getData(threadID);
    const dataThread = threadRaw?.threadInfo || {};

    switch (logMessageType) {

      // ── تغيير المسؤولين ──────────────────────────────────────
      case "log:thread-admins": {
        if (!dataThread.adminIDs) dataThread.adminIDs = [];

        if (logMessageData.ADMIN_EVENT === "add_admin") {
          const targetID = logMessageData.TARGET_ID;
          if (!dataThread.adminIDs.find(a => a.id == targetID))
            dataThread.adminIDs.push({ id: targetID });

          const name = await Users.getNameUser(targetID).catch(() => targetID);
          await sendAuto(api, threadID,
            `${HEADER}\n\n⬆️ ترقية مسؤول!\n👤 الاسم: ${name}\n🆔 ${targetID}`
          );
        }
        else if (logMessageData.ADMIN_EVENT === "remove_admin") {
          const targetID = logMessageData.TARGET_ID;
          dataThread.adminIDs = dataThread.adminIDs.filter(a => a.id != targetID);

          const name = await Users.getNameUser(targetID).catch(() => targetID);
          await sendAuto(api, threadID,
            `${HEADER}\n\n⬇️ إزالة مسؤول!\n👤 الاسم: ${name}\n🆔 ${targetID}`
          );
        }
        break;
      }

      // ── تغيير كنية العضو ─────────────────────────────────────
      case "log:user-nickname": {
        if (!dataThread.nicknames) dataThread.nicknames = {};
        const uid  = logMessageData.participant_id;
        const nick = logMessageData.nickname || "";
        dataThread.nicknames[uid] = nick;

        const name = await Users.getNameUser(uid).catch(() => uid);
        const msg  = nick.length
          ? `${HEADER}\n\n✏️ تغيير كنية!\n👤 ${name}\n📝 ${nick}`
          : `${HEADER}\n\n🗑️ حُذفت كنية!\n👤 ${name}`;
        await sendAuto(api, threadID, msg);
        break;
      }

      // ── تغيير اسم المجموعة ───────────────────────────────────
      case "log:thread-name": {
        const oldName = dataThread.threadName || "—";
        const newName = logMessageData.name || null;
        dataThread.threadName = newName;

        const msg = newName
          ? `${HEADER}\n\n📝 تغيير اسم المجموعة!\n⬅️ ${oldName}\n➡️ ${newName}`
          : `${HEADER}\n\n🗑️ تم حذف اسم المجموعة!\n⬅️ ${oldName}`;
        await sendAuto(api, threadID, msg);
        break;
      }

      // ── تغيير أيقونة المجموعة ────────────────────────────────
      case "log:thread-icon": {
        let icons = {};
        try { icons = JSON.parse(fs.readFileSync(iconPath, "utf8")); } catch(_) {}

        const prevIcon = icons[threadID] || "—";
        const newIcon  = logMessageData.thread_icon || "👍";
        dataThread.threadIcon = newIcon;

        const cfg = global.configModule?.adminUpdate || module.exports.config.envConfig;
        if (cfg.sendNoti !== false) {
          api.sendMessage(
            `${HEADER}\n\n🎭 تغيير أيقونة المجموعة!\n⬅️ ${prevIcon}  →  ${newIcon}`,
            threadID,
            (err, info) => {
              icons[threadID] = newIcon;
              fs.writeFileSync(iconPath, JSON.stringify(icons, null, 2));
              if (!err && info && cfg.autoUnsend !== false) {
                const delay = (cfg.timeToUnsend || 5) * 1000;
                setTimeout(() => api.unsendMessage(info.messageID), delay);
              }
            }
          );
        }
        break;
      }

      // ── تغيير لون المجموعة ───────────────────────────────────
      case "log:thread-color": {
        const newColor = logMessageData.thread_color || null;
        const oldColor = dataThread.threadColor || "—";
        dataThread.threadColor = newColor;
        await sendAuto(api, threadID,
          `${HEADER}\n\n🎨 تغيير لون المجموعة!\n⬅️ ${oldColor}  →  ${newColor || "—"}`
        );
        break;
      }

      // ── مكالمة ───────────────────────────────────────────────
      case "log:thread-call": {
        if (logMessageData.event === "group_call_started") {
          const name = await Users.getNameUser(logMessageData.caller_id).catch(() => logMessageData.caller_id);
          const type = logMessageData.video ? "فيديو 📹" : "صوت 🎙️";
          await sendAuto(api, threadID, `${HEADER}\n\n📞 ${name} بدأ مكالمة ${type}`);
        }
        else if (logMessageData.event === "group_call_ended") {
          const duration = formatDuration(logMessageData.call_duration || 0);
          const type     = logMessageData.video ? "الفيديو 📹" : "الصوتية 🎙️";
          await sendAuto(api, threadID, `${HEADER}\n\n📵 انتهت المكالمة ${type}\n⏱️ المدة: ${duration}`);
        }
        else if (logMessageData.joining_user) {
          const name = await Users.getNameUser(logMessageData.joining_user).catch(() => logMessageData.joining_user);
          const type = logMessageData.group_call_type === "1" ? "فيديو 📹" : "صوتية 🎙️";
          await sendAuto(api, threadID, `${HEADER}\n\n📞 ${name} انضم للمكالمة ${type}`);
        }
        break;
      }

      // ── كلمات سحرية ──────────────────────────────────────────
      case "log:magic-words": {
        const word  = logMessageData.magic_word    || "—";
        const theme = logMessageData.theme_name    || "—";
        const emoji = logMessageData.emoji_effect  || "لا يوجد";
        const count = logMessageData.new_magic_word_count || 0;
        await sendAuto(api, threadID,
          `${HEADER}\n\n✨ كلمة سحرية جديدة!\n💬 ${word} → ${theme}\n😀 ${emoji}\n📊 المجموع: ${count}`
        );
        break;
      }

      // ── تصويت ────────────────────────────────────────────────
      case "log:thread-poll": {
        if (logMessageBody)
          await sendAuto(api, threadID, `${HEADER}\n\n📊 ${logMessageBody}`);
        break;
      }

      // ── وضع الموافقة على الطلبات ─────────────────────────────
      case "log:thread-approval-mode": {
        if (logMessageBody)
          await sendAuto(api, threadID, `${HEADER}\n\n🔒 ${logMessageBody}`);
        break;
      }

      // ── وضع الرابط ───────────────────────────────────────────
      case "log:link-status": {
        if (logMessageBody)
          await sendAuto(api, threadID, `${HEADER}\n\n🔗 ${logMessageBody}`);
        break;
      }
    }

    // حفظ التحديثات
    await setData(threadID, { threadInfo: dataThread });

  } catch(e) {
    console.error(`[${BOT_NAME} adminUpdate]`, e.message);
  }
};
