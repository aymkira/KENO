const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "بنترست",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SOMI",
  description: "يجلب 10 صور حسب بحث المستخدم بدون تكرار",
  commandCategory: "صور",
  usages: "صور [كلمة البحث]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const keyword = args.join(" ");
    if (!keyword)
      return api.sendMessage("اكتب كلمة للبحث عن الصور 🔍", event.threadID);

    api.sendMessage("⏳ جارِ جلب الصور…", event.threadID);

    // رابط بدون API
    const url = `https://source.unsplash.com/1600x900/?${encodeURIComponent(keyword)}`;

    // نحمل 10 صور مختلفة
    let images = [];
    for (let i = 0; i < 10; i++) {
      const img = await axios.get(url, {
        responseType: "arraybuffer",
        headers: { "Cache-Control": "no-cache" },
      });

      const path = __dirname + `/cache/img_${i}.jpg`;
      fs.writeFileSync(path, Buffer.from(img.data, "utf-8"));
      images.push(fs.createReadStream(path));
    }

    // إرسال الصور دفعة واحدة
    api.sendMessage(
      {
        body: `🔍 نتائج البحث عن: ${keyword}\nعدد الصور: 10`,
        attachment: images,
      },
      event.threadID,
      () => {
        // حذف الصور بعد الإرسال
        for (let i = 0; i < 10; i++) {
          const path = __dirname + `/cache/img_${i}.jpg`;
          if (fs.existsSync(path)) fs.unlinkSync(path);
        }
      }
    );
  } catch (err) {
    console.log(err);
    api.sendMessage("⚠️ حدث خطأ في جلب الصور", event.threadID);
  }
};
