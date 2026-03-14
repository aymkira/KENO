
const axios = require('axios');
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "فلم",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "بحث واقتراحات أفلام",
  commandCategory: "أفلام",
  usages: "فلم [اسم] أو [فئة]",
  cooldowns: 5
};

const categories = {
  "اكشن":    ["John Wick", "Extraction", "Top Gun: Maverick", "Mad Max: Fury Road", "The Dark Knight", "Gladiator", "The Raid", "Inception", "Mission: Impossible", "The Equalizer", "Nobody", "Bullet Train", "Taken", "Tenet", "Dune", "Kill Bill", "The Batman", "Sicario", "Logan"],
  "دراما":   ["The Shawshank Redemption", "The Godfather", "Forrest Gump", "The Green Mile", "Parasite", "Joker", "The Prestige", "The Truman Show", "Braveheart", "Good Will Hunting", "The Intouchables", "Capernaum", "12 Angry Men", "Fight Club", "Se7en", "The Pianist", "Hacksaw Ridge", "Green Book"],
  "رعب":    ["The Conjuring", "The Exorcist", "The Shining", "It", "Hereditary", "Get Out", "A Quiet Place", "Insidious", "The Ring", "Don't Breathe", "Sinister", "Evil Dead Rise", "Barbarian", "Talk to Me", "Smile", "The Babadook"],
  "خيال":   ["Interstellar", "The Matrix", "Avatar", "Blade Runner 2049", "Arrival", "Edge of Tomorrow", "Star Wars", "District 9", "The Martian", "Gravity", "Ex Machina", "Everything Everywhere All at Once"],
  "كوميديا":["The Hangover", "Superbad", "Deadpool", "Free Guy", "Step Brothers", "21 Jump Street", "The Mask", "Home Alone", "Zombieland", "Game Night", "Rush Hour", "Ted", "Dumb and Dumber", "White Chicks"],
  "جريمة":  ["Pulp Fiction", "Goodfellas", "The Departed", "No Country for Old Men", "Heat", "The Usual Suspects", "Snatch", "American Psycho", "Scarface", "Casino", "Shutter Island", "Training Day"],
  "سيرة":   ["Oppenheimer", "The Wolf of Wall Street", "Bohemian Rhapsody", "The Social Network", "Schindler's List", "A Beautiful Mind", "The Imitation Game", "Elvis", "Ford v Ferrari", "Lincoln"],
  "كرتون":  ["Toy Story", "The Lion King", "Spider-Man: Into the Spider-Verse", "Finding Nemo", "Shrek", "How to Train Your Dragon", "Ratatouille", "Up", "The Incredibles", "Coco", "Frozen", "Inside Out", "Zootopia", "Kung Fu Panda"],
  "وثائقي": ["Our Planet", "The Last Dance", "Planet Earth", "Blackfish", "The Social Dilemma", "My Octopus Teacher", "Apollo 11", "Free Solo"]
};

const categoryEmoji = {
  "اكشن": "🔥", "دراما": "🎭", "رعب": "👻", "خيال": "🚀",
  "كوميديا": "😂", "جريمة": "🚔", "سيرة": "📜", "كرتون": "🤖", "وثائقي": "🎥"
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  const query = args.join(" ").trim();

  if (!query) {
    const list = Object.keys(categories).map(c => `${categoryEmoji[c]} فلم ${c}`).join("\n");
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n🎬 اختر فئة أو ابحث عن فلم:\n\n${list}\n\n💡 مثال: فلم اكشن | فلم Inception`,
      threadID, messageID
    );
  }

  let targetMovie = query;
  let isCategory = false;

  if (categories[query]) {
    targetMovie = categories[query][Math.floor(Math.random() * categories[query].length)];
    isCategory = true;
    if (api.setMessageReaction) api.setMessageReaction(categoryEmoji[query] || "🎬", messageID, () => {}, true);
  } else {
    if (api.setMessageReaction) api.setMessageReaction("🔍", messageID, () => {}, true);
  }

  api.sendMessage(
    isCategory
      ? `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n🎲 اقتراح من فئة (${query}):\n🏆 ${targetMovie}`
      : `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n🔍 جاري البحث عن: ${targetMovie}...`,
    threadID
  );

  try {
    const res = await axios.get(
      `https://api.popcat.xyz/imdb?q=${encodeURIComponent(targetMovie)}`,
      { timeout: 15000 }
    );
    const data = res.data;

    if (data.error) {
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n❌ لم أجد نتائج لـ "${targetMovie}"`,
        threadID, messageID
      );
    }

    // الترجمة
    const translate = async (text) => {
      if (!text) return "غير متوفر";
      try {
        const tRes = await axios.get(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ar&dt=t&q=${encodeURIComponent(text)}`,
          { timeout: 10000 }
        );
        return tRes.data[0].map(x => x[0]).join("");
      } catch (_) { return text; }
    };

    const [plotAr, genresAr] = await Promise.all([
      translate(data.plot),
      translate(data.genres)
    ]);

    const body =
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n` +
      `🎬 ${data.title}\n` +
      `📅 السنة: ${data.year}\n` +
      `⭐ التقييم: ${data.rating}/10\n` +
      `🎭 التصنيف: ${genresAr}\n\n` +
      `📖 القصة:\n${plotAr}`;

    // تحميل الصورة
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const imgPath = path.join(cacheDir, `movie_${Date.now()}.jpg`);

    try {
      const imgRes = await axios.get(encodeURI(data.poster), {
        responseType: "arraybuffer",
        timeout: 15000
      });
      fs.writeFileSync(imgPath, Buffer.from(imgRes.data));

      await new Promise((resolve, reject) => {
        api.sendMessage(
          { body, attachment: fs.createReadStream(imgPath) },
          threadID,
          (err) => { if (err) reject(err); else resolve(); },
          messageID
        );
      });

      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

    } catch (_) {
      // إرسال بدون صورة إذا فشل التحميل
      api.sendMessage(body, threadID, messageID);
    }

  } catch (err) {
    console.error("خطأ في أمر فلم:", err);
    return api.sendMessage(
      "⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n❌ حدث خطأ، حاول مجدداً.",
      threadID, messageID
    );
  }
};
