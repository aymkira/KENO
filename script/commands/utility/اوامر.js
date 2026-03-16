// ══════════════════════════════════════════════════════════════
//   اوامر — قائمة الأوامر بنظام الرد
//   by Ayman
// ══════════════════════════════════════════════════════════════

module.exports.config = {
  name: "اوامر",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "قائمة الأوامر بنظام الرد المباشر",
  commandCategory: "utility",
  usages: "اوامر",
  cooldowns: 3
};

const HEADER = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 ━━ ⌬";

const CATEGORIES = {
  "1": { id: "fun",       name: "🎭 الترفيه"      },
  "2": { id: "admin",     name: "🛡️ الإدارة"      },
  "3": { id: "developer", name: "⚙️ المطور"       },
  "4": { id: "games",     name: "🎮 الألعاب"      },
  "5": { id: "media",     name: "🎬 الوسائط"      },
  "6": { id: "pic",       name: "🖼️ الصور"        },
  "7": { id: "utility",   name: "🔧 الخدمات"      },
  "8": { id: "عام",       name: "📦 عام"           }
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // حساب عدد الأوامر في كل فئة
  const getCategoryCount = (catId) =>
    Array.from(global.client.commands.values())
      .filter(cmd => cmd.config?.commandCategory?.toLowerCase() === catId.toLowerCase())
      .length;

  let menu = HEADER + "\n\n";
  menu += "📋 اختر رقم الفئة:\n\n";

  for (const [num, cat] of Object.entries(CATEGORIES)) {
    const count = getCategoryCount(cat.id);
    if (count > 0) menu += `${num} ≻ ${cat.name} (${count})\n`;
  }

  menu += "\n↩️ رد برقم الفئة\n";
  menu += HEADER;

  return api.sendMessage(menu, threadID, (err, info) => {
    if (err || !info) return;
    global.client.handleReply.push({
      name: "اوامر",
      messageID: info.messageID,
      author: senderID
    });
  }, messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event;

  // تحقق من صاحب الرد
  if (String(senderID) !== String(handleReply.author)) return;

  const input = body.trim();

  // رجوع للقائمة الرئيسية
  if (input === "رجوع" || input === "0") {
    api.unsendMessage(handleReply.messageID);
    return module.exports.run({ api, event });
  }

  const choice = CATEGORIES[input];
  if (!choice) return api.sendMessage(
    HEADER + "\n\n❌ اختر رقماً من 1 إلى 8\n" + HEADER,
    threadID, messageID
  );

  // جلب أوامر الفئة
  const cmds = Array.from(global.client.commands.values())
    .filter(cmd => cmd.config?.commandCategory?.toLowerCase() === choice.id.toLowerCase())
    .map(cmd => cmd.config.name);

  api.unsendMessage(handleReply.messageID);

  if (cmds.length === 0) {
    return api.sendMessage(
      HEADER + "\n\n⚠️ لا توجد أوامر في فئة [ " + choice.name + " ]\n" + HEADER,
      threadID, messageID
    );
  }

  // تقسيم الأوامر لصفوف
  let cmdList = "";
  for (let i = 0; i < cmds.length; i += 5) {
    cmdList += "⪼ " + cmds.slice(i, i + 5).join(" • ") + "\n";
  }

  const msg =
    HEADER + "\n" +
    "      " + choice.name + "\n" +
    HEADER + "\n\n" +
    cmdList + "\n" +
    "💠 عدد الأوامر: " + cmds.length + "\n" +
    "↩️ رجوع ← أرسل: 0\n" +
    HEADER;

  return api.sendMessage(msg, threadID, (err, info) => {
    if (err || !info) return;
    global.client.handleReply.push({
      name: "اوامر",
      messageID: info.messageID,
      author: senderID
    });
  }, messageID);
};
