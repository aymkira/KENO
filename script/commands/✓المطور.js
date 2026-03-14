const fs = require('fs-extra');
const axios = require('axios');

module.exports.config = {
  name: 'المطور',
  version: '1.5.0',
  hasPermssion: 0,
  credits: 'ChatGPT تطوير وتنسيق',
  description: 'عرض معلومات المطور بشكل فخم وراقي',
  commandCategory: '〘 المجموعات 〙',
  usages: 'المطور',
  usePrefix: false,
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {

  // صـــــور فخــــمة للمطــــور
  const imageUrls = [
    "https://i.ibb.co/nsHdtqBx/18ca32294c3f.gif",
    "https://i.ibb.co/Q2BKRfZ/63f4b2bf747d.gif"
  ];

  const cachePath = __dirname + "/cache/dev_info.jpg";
  const selectedImage = imageUrls[Math.floor(Math.random() * imageUrls.length)];

  // ════════════════════
  // 💎 الرسالة الفخمة
  // ════════════════════

  const message = 
`⟣━━━━━━━『 👑 مـعـلـومــات الـمــطــور 👑 』━━━━━━━⟢

⚡️╎الاسم: 𝐀𝐍𝐀𝐒 𝐀𝐋𝐒𝐀𝐑𝐔𝐑𝐈
🔥╎العمر: 20 سنة
🌍╎البلد: اليمن 🇾🇪

🜲 ┈•┈•┈•❀•┈•┈•┈ 🜲

🧩╎رابط المطـور:
↳ m.me/61584059280197

📸╎انستقــرام:
↳ https://www.instagram.com/shblsd3829?igsh=MTY2YWdwY3I5MTZoZg==

🜲 ┈•┈•┈•❀•┈•┈•┈ 🜲

⚠️╎واجهت خــطأ؟
اكتب:  .تقرير

⟣━━━━━━━『 🔱  انس 🔱 』━━━━━━━⟢`;

  // ════════════════════
  // 📩 تحميل الصورة + إرسال الرسالة
  // ════════════════════

  axios.get(encodeURI(selectedImage), { responseType: "stream" })
    .then(res => {
      res.data.pipe(fs.createWriteStream(cachePath))
        .on("close", () => {
          api.sendMessage(
            {
              body: message,
              attachment: fs.createReadStream(cachePath)
            },
            event.threadID,
            () => fs.unlinkSync(cachePath)
          );
        });
    })
    .catch(() => {
      api.sendMessage("⚠️ حدث خطأ أثناء تحميل الصورة.", event.threadID);
    });
};
