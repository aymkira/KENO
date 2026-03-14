
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "سلاحي",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "مواجهة الزومبي واختيار سلاح عشوائي لك",
  commandCategory: "fun",
  usages: "سلاحي",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, senderID } = event;

  // إحصائيات المواجهة العشوائية
  const zombieCount = Math.floor(Math.random() * 101) + 1; // عدد الزومبي
  const bullets = Math.floor(Math.random() * 101); // عدد الرصاص
  const survivalRate = Math.floor(Math.random() * 101); // نسبة البقاء
  const name = (await Users.getData(senderID)).name;

  // قائمة الأسلحة المدمجة (التي طلبتها والجديدة)
  const links = [
    "https://choq.fm/wp-content/uploads/2020/03/1585152608_370_%D8%A3%D9%81%D8%B6%D9%84-12-%D8%B3%D9%84%D8%A7%D8%AD-%D9%84%D9%80-Call-of-Duty-Warzone.jpg",
    "https://choq.fm/wp-content/uploads/2020/03/1585152608_73_%D8%A3%D9%81%D8%B6%D9%84-12-%D8%B3%D9%84%D8%A7%D8%AD-%D9%84%D9%80-Call-of-Duty-Warzone.jpg",
    "https://choq.fm/wp-content/uploads/2020/03/1585152607_81_%D8%A3%D9%81%D8%B6%D9%84-12-%D8%B3%D9%84%D8%A7%D8%AD-%D9%84%D9%80-Call-of-Duty-Warzone.jpg",
    "https://choq.fm/wp-content/uploads/2020/03/1585152607_207_%D8%A3%D9%81%D8%B6%D9%84-12-%D8%B3%D9%84%D8%A7%D8%AD-%D9%84%D9%80-Call-of-Duty-Warzone.jpg",
    "https://choq.fm/wp-content/uploads/2020/03/1585152607_48_%D8%A3%D9%81%D8%B6%D9%84-12-%D8%B3%D9%84%D8%A7%D8%AD-%D9%84%D9%80-Call-of-Duty-Warzone.jpg",
    "https://static1-arabia.millenium.gg/articles/7/14/37/@/8163-68712-1188612-m4a1-orig-1-orig-2-amp_main_img-1.png",
    "https://static1-us.millenium.gg/articles/6/68/76/@/71442-alpha-article_m-2.jpg",
    "https://cdni.rt.com/media/pics/2013.12/orig/670358.jpg",
    "https://pubgarabia.com/wp-content/uploads/2018/10/pubg_weapon_m416_1-1024x517.jpg",
    "https://png.pngtree.com/png-vector/20210313/ourlarge/pngtree-shoes-rubber-flip-flops-daily-necessities-household-png-image_3052390.jpg",
    "https://www.oqily.com/image/cache/catalog/Product-2019/Shoes/%D9%86%D8%B9%D8%A7%D9%84-sl-0079-3-1000x1000.jpg",
    "https://ae01.alicdn.com/kf/HTB19ztVcXuWBuNjSspnq6x1NVXav/1-MP4-CS.jpg_640x640.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/41Wf7mmaxFL.jpg",
    "https://m.media-amazon.com/images/I/31-kXCquEoL._AC_SY1000_.jpg",
    "https://images.yaoota.com/r_Gzm0FV_71ts1apagy_uuAu7Hs=/trim/yaootaweb-production/media/crawledproductimages/491ac34c87f7157eee4a951daf4ed9d09b98dc65.jpg"
  ];

  const randomWeaponUrl = links[Math.floor(Math.random() * links.length)];
  const cachePath = path.join(__dirname, "cache", `weapon_${senderID}.jpg`);

  try {
    // تحميل الصورة وحفظها في الكاش
    const response = await axios.get(randomWeaponUrl, { responseType: "arraybuffer" });
    fs.ensureDirSync(path.join(__dirname, "cache"));
    fs.writeFileSync(cachePath, Buffer.from(response.data));

    const msg = {
      body: `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗭𝗢𝗠𝗕𝗜𝗘 ━━ ⌬\n\n` +
            `👤 المحارب: ${name}\n` +
            `🧟 عدد الزومبي: ${zombieCount}\n` +
            `🔫 الرصاص المتوفر: ${bullets}\n` +
            `📈 نسبة بقائك حياً: ${survivalRate}%\n\n` +
            `⚔️ سلاحك المختار هو الموضح في الصورة.. حظاً موفقاً!`,
      attachment: fs.createReadStream(cachePath)
    };

    return api.sendMessage(msg, threadID, () => {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n❌ حدث خطأ أثناء تجهيز السلاح، يبدو أن الزومبي قطعوا الطريق!", threadID, messageID);
  }
};
