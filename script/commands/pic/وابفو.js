const axios = require('axios');

module.exports.config = {
  name: "وايفو",
  version: "3.5",
  hasPermssion: 0,
  credits: "  أيمن",
  description: "إرسال صور أنمي متنوعة (حضن، قبلة، رقص، إلخ)",
  commandCategory: "pic",
  usages: "<النوع>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const typesMap = {
    "وايفو": "waifu", "نيكو": "neko", "شينوبو": "shinobu", "ميغومين": "megumin",
    "مزاح": "bully", "حضن": "cuddle", "بكاء": "cry", "قبلة": "kiss",
    "عناق": "hug", "ربت": "pat", "خجل": "blush", "ابتسامة": "smile",
    "رقصة": "dance", "صفعة": "slap", "قتل": "kill", "ركلة": "kick",
    "أكل": "nom", "عضة": "bite", "غمزة": "wink", "نغز": "poke"
  };

  const name = args.join(" ").trim();

  // 1. عرض القائمة إذا لم يتم اختيار نوع
  if (!name) {
    let keys = Object.keys(typesMap);
    let list = "⌬ ━━━ 𝗞𝗜𝗥𝗔 𝗔𝗡𝗜𝗠𝗘 ━━━ ⌬\n\n";
    list += "✨ الأنواع المتاحة:\n";
    list += "│ " + keys.join(" ، ") + "\n\n";
    list += "💡 اكتب: [ وايفو حضن ]\n";
    list += "⌬ ━━━━━━━━━━━━━━ ⌬";
    return api.sendMessage(list, threadID, messageID);
  }

  const engName = typesMap[name];
  if (!engName) {
    return api.sendMessage("⚠️ | هذا النوع غير متوفر في قائمة كيرا.", threadID, messageID);
  }

  try {
    api.sendMessage("⏳ جاري جلب لقطة الأنمي...", threadID, messageID);

    // 2. جلب الصورة من الـ API
    const res = await axios.get(`https://api.waifu.pics/sfw/${engName}`);
    const imgUrl = res.data.url;
    const imgRes = await axios.get(imgUrl, { responseType: 'stream' });

    // 3. إرسال الصورة
    const msg = {
      body: `⌬ ━━━ 𝗞𝗜𝗥𝗔 𝗪𝗔𝗜𝗙𝗨 ━━━ ⌬\n\n🖼️ النوع: ${name}\n✨ المصدر: Waifu.pics\n\n⌬ ━━━━━━━━━━━━━━ ⌬`,
      attachment: imgRes.data
    };

    return api.sendMessage(msg, threadID, (err, info) => {
        // نظام التفاعلات في كيرا/ميراي
        if(global.client.handleReaction) {
            global.client.handleReaction.push({
                name: "وايفو",
                messageID: info.messageID,
                author: senderID,
                engName: engName,
                typeName: name
            });
        }
    }, messageID);

  } catch (e) {
    return api.sendMessage("✖ | حدث خطأ في الاتصال بالخادم.", threadID, messageID);
  }
};

// 4. معالج التفاعلات (عند الضغط على 👍 يتم إرسال صورة جديدة)
module.exports.handleReaction = async function ({ api, event, handleReaction }) {
  if (event.userID != handleReaction.author) return;
  if (event.reaction != "👍") return;

  try {
    const res = await axios.get(`https://api.waifu.pics/sfw/${handleReaction.engName}`);
    const imgRes = await axios.get(res.data.url, { responseType: 'stream' });

    return api.sendMessage({
      body: `⌬ ━━━ 𝗞𝗜𝗥𝗔 𝗪𝗔𝗜𝗙𝗨 ━━━ ⌬\n\n🔄 صورة جديدة من نوع: ${handleReaction.typeName}`,
      attachment: imgRes.data
    }, event.threadID);
  } catch (e) {
    api.sendMessage("✖ | تعذر جلب صورة جديدة.", event.threadID);
  }
};
