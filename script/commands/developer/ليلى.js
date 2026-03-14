
const axios = require("axios");
const path = require("path");

module.exports.config = {
  name: "ليلى",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "تشغيل الأغاني",
  commandCategory: "developer",
  usages: "ليلى [اسم الأغنية]",
  cooldowns: 5
};

const BASE_URL = "https://raw.githubusercontent.com/aymkira/data/main/song/";

const songs = [
  { id: 1, name: "اني منيح", file: "اني منيح.mp3" },
  { id: 2, name: "رومان",    file: "رومان.mp3"    },
  { id: 3, name: "سوسن",    file: "سوسن.mp3"     }
];

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  // جلب الأدمن من config.json
  const config = require(path.join(process.cwd(), "config.json"));
  const adminList = config.ADMINBOT || [];

  if (!adminList.includes(String(senderID))) {
    return api.sendMessage("هذا الامر لايمن فقط اكتب سبوتي (اسم الأغنية)", threadID, messageID);
  }

  // بدون args → عرض كل الأغاني
  if (!args[0]) {
    const list = songs.map(s => `${s.id}. 🎵 ${s.name}`).join("\n");
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n🎶 قائمة الأغاني:\n\n${list}\n\n✦ اكتب: ليلى [اسم الأغنية]`,
      threadID, messageID
    );
  }

  // البحث بالاسم
  const query = args.join(" ").trim();
  const song = songs.find(s =>
    s.name.includes(query) || query.includes(s.name)
  );

  if (!song) {
    return api.sendMessage(
      `⚠️ لم أجد الأغنية، اكتب "ليلى" لعرض القائمة.`,
      threadID, messageID
    );
  }

  try {
    api.sendMessage(`⏳ جاري تحميل: 🎵 ${song.name}...`, threadID);

    const url = BASE_URL + encodeURIComponent(song.file);
    const response = await axios.get(url, {
      responseType: "stream",
      timeout: 30000
    });

    return api.sendMessage(
      {
        body: `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n🎵 ${song.name}`,
        attachment: response.data
      },
      threadID, messageID
    );

  } catch (e) {
    console.error("خطأ في تحميل الأغنية:", e);
    return api.sendMessage(
      `❌ فشل تحميل الأغنية، حاول لاحقاً.`,
      threadID, messageID
    );
  }
};
