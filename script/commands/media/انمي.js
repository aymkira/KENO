
const axios = require('axios');
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "انمي",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "بحث عن أنمي أو اقتراحات حسب الفئة",
  commandCategory: "أفلام",
  usages: "انمي [اسم] أو [فئة]",
  cooldowns: 5
};

const categories = {
  "دراما":    ["Clannad: After Story", "Your Lie in April", "Violet Evergarden", "A Silent Voice", "Anohana", "March Comes in Like a Lion", "Grave of the Fireflies", "Orange", "Erased", "To Your Eternity", "Fruits Basket", "Plastic Memories", "I Want to Eat Your Pancreas", "Wolf Children", "Great Teacher Onizuka", "ReLIFE", "The Wind Rises", "Rainbow"],
  "اكشن":    ["Attack on Titan", "One Piece", "Naruto Shippuden", "Hunter x Hunter", "Jujutsu Kaisen", "Demon Slayer", "Bleach", "Fullmetal Alchemist: Brotherhood", "One Punch Man", "My Hero Academia", "Vinland Saga", "Chainsaw Man", "Solo Leveling", "Fate/Zero", "Black Clover", "Hellsing Ultimate", "Akame ga Kill!", "Mob Psycho 100"],
  "رعب":     ["Death Note", "Monster", "Berserk", "Another", "Parasyte: The Maxim", "When They Cry", "The Promised Neverland", "Devilman Crybaby", "Shiki", "Elfen Lied", "Perfect Blue", "Ajin", "Hell Girl", "Terror in Resonance", "Angels of Death", "Serial Experiments Lain", "Ghost Hunt"],
  "رومانسي": ["Kaguya-sama: Love is War", "Toradora!", "Horimiya", "My Dress-Up Darling", "Your Name", "Maid Sama!", "Golden Time", "Blue Spring Ride", "Snow White with the Red Hair", "Wotakoi", "Weathering with You", "5 Centimeters per Second", "Rascal Does Not Dream of Bunny Girl Senpai", "Tomo-chan Is a Girl!"],
  "كوميديا": ["Gintama", "Konosuba", "Grand Blue", "The Disastrous Life of Saiki K.", "Nichijou", "Asobi Asobase", "Spy x Family", "Hinamatsuri", "Daily Lives of High School Boys", "Devil is a Part-Timer", "Barakamon", "Ouran High School Host Club"],
  "خيال":    ["Steins;Gate", "No Game No Life", "Re:Zero", "That Time I Got Reincarnated as a Slime", "Overlord", "Mushoku Tensei", "Made in Abyss", "Psycho-Pass", "Code Geass", "Neon Genesis Evangelion", "Cyberpunk: Edgerunners", "Dr. Stone"]
};

const categoryEmoji = {
  "دراما": "😢", "اكشن": "🔥", "رعب": "👻",
  "رومانسي": "❤️", "كوميديا": "😂", "خيال": "🚀"
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  const query = args.join(" ").trim();

  if (!query) {
    const list = Object.keys(categories).map(c => `${categoryEmoji[c]} انمي ${c}`).join("\n");
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n🌸 اختر فئة أو ابحث عن أنمي:\n\n${list}\n\n💡 مثال: انمي اكشن | انمي Naruto`,
      threadID, messageID
    );
  }

  let targetAnime = query;
  let isCategory = false;

  if (categories[query]) {
    targetAnime = categories[query][Math.floor(Math.random() * categories[query].length)];
    isCategory = true;
    if (api.setMessageReaction) api.setMessageReaction(categoryEmoji[query] || "🌸", messageID, () => {}, true);
  } else {
    if (api.setMessageReaction) api.setMessageReaction("🔍", messageID, () => {}, true);
  }

  api.sendMessage(
    isCategory
      ? `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n🎲 اقتراح من فئة (${query}):\n🌸 ${targetAnime}`
      : `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n🔍 جاري البحث عن: ${targetAnime}...`,
    threadID
  );

  try {
    const res = await axios.get(
      `https://api.popcat.xyz/imdb?q=${encodeURIComponent(targetAnime)}`,
      { timeout: 15000 }
    );
    const data = res.data;

    if (data.error) {
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n❌ لم أجد نتائج لـ "${targetAnime}"`,
        threadID, messageID
      );
    }

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
      `🌸 ${data.title}\n` +
      `📅 السنة: ${data.year}\n` +
      `⭐ التقييم: ${data.rating}/10\n` +
      `🎭 التصنيف: ${genresAr}\n\n` +
      `📖 القصة:\n${plotAr}`;

    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const imgPath = path.join(cacheDir, `anime_${Date.now()}.jpg`);

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
      api.sendMessage(body, threadID, messageID);
    }

  } catch (err) {
    console.error("خطأ في أمر انمي:", err);
    return api.sendMessage(
      "⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n❌ حدث خطأ، حاول مجدداً.",
      threadID, messageID
    );
  }
};
