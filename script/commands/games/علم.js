const fs = require('fs-extra');
const axios = require('axios');
const path = require("path");

module.exports.config = {
  name: "اعلام",
  version: "1.2.5",
  hasPermssion: 0,
  credits: "أيمن",
  description: "تحدي احزر العلم - ستايل صافي",
  commandCategory: "games",
  usages: "اعلام",
  cooldowns: 5
};

const header = `⌬ ━━━━━━━━━━━━ ⌬\n     🚩 تـحـدي الأعلام\n⌬ ━━━━━━━━━━━━ ⌬`;

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (senderID !== handleReply.author) return;

  const mongodb = require(path.join(process.cwd(), "includes", "mongodb.js"));
  const userAnswer = body.trim();
  const correctAnswer = handleReply.correctAnswer;

  // حذف رسالة السؤال القديمة فوراً
  api.unsendMessage(handleReply.messageID);

  if (userAnswer === correctAnswer) {
      const moneyGain = 50; 
      await mongodb.addMoney(senderID, moneyGain);

      return api.sendMessage(`${header}\n\n✅ أحسنت! الإجابة صحيحة.\n⪼ الجائزة: ${moneyGain}$`, threadID, (err, info) => {
          setTimeout(() => api.unsendMessage(info.messageID), 5000);
      }, messageID);
  } else {
      return api.sendMessage(`${header}\n\n❌ للأسف، الإجابة خطأ.\n⪼ الإجابة هي: ${correctAnswer}`, threadID, (err, info) => {
          setTimeout(() => api.unsendMessage(info.messageID), 4000);
      }, messageID);
  }
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
  
  const tempPath = path.join(cacheDir, `flag_${senderID}_${Date.now()}.jpg`);

  const questions = [
      { image: "https://i.pinimg.com/originals/6f/a0/39/6fa0398e640e5545d94106c2c42d2ff8.jpg", answer: "العراق" },
      { image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Flag_of_Brazil.svg/256px-Flag_of_Brazil.svg.png", answer: "البرازيل" },
      { image: "https://i.pinimg.com/originals/66/38/a1/6638a104725f4fc592c1b832644182cc.jpg", answer: "فلسطين" },
      { image: "https://i.pinimg.com/originals/f9/47/0e/f9470ea33ff6fbf794b0b8bb00a5ccb4.jpg", answer: "المغرب" },
      { image: "https://i.pinimg.com/originals/2d/a2/6e/2da26e58efd5f32fe2e33b9654907ab5.gif", answer: "الصومال" },
      { image: "https://i.pinimg.com/originals/0e/10/d2/0e10d2240dd28af2eff27ce0fa8b5b8d.jpg", answer: "اليابان" },
      { image: "https://i.pinimg.com/originals/e8/8e/e7/e88ee7f3ba7ff9181aabdd9520bdfa64.jpg", answer: "الجزائر" },
      { image: "https://i.pinimg.com/564x/21/47/ba/2147ba2a3780fb5b9395af5a0eb30deb.jpg", answer: "سوريا" },
      { image: "https://i.pinimg.com/564x/a9/e9/c3/a9e9c3a54aa9fbe2400cc85c8dc45dc3.jpg", answer: "ليبيا" },
      { image: "https://i.pinimg.com/564x/72/d7/d9/72d7d9586177d3cd05adbd0d9f494b20.jpg", answer: "السعودية" },
      { image: "https://i.pinimg.com/564x/e1/2d/13/e12d13ee06067dc324086ac1cf699a4f.jpg", answer: "تونس" },
      { image: "https://i.pinimg.com/564x/03/d1/24/03d1245ce41669d15ab285c31e1b2b4c.jpg", answer: "موريتانيا" },
      { image: "https://i.pinimg.com/564x/69/b2/0a/69b20a2431b0f6105661f1d4d5d7509c.jpg", answer: "كوريا" },
      { image: "https://i.pinimg.com/236x/53/76/b4/5376b4793712faa060cabb4fe8e85b20.jpg", answer: "الصين" },
      { image: "https://i.pinimg.com/564x/8a/40/f6/8a40f62eadc052d92641ec1f32f67053.jpg", answer: "الارجنتين" },
      { image: "https://i.pinimg.com/236x/c8/aa/36/c8aa36dadd87d63233ef72e84aebe694.jpg", answer: "كندا" },
      { image: "https://i.pinimg.com/564x/d3/28/0f/d3280f4c8423cb190eebadd0acc6c88e.jpg", answer: "فرنسا" },
      { image: "https://i.pinimg.com/236x/8f/ef/24/8fef241778c6e4c6bfcdab543567adff.jpg", answer: "امريكا" },
      { image: "https://i.pinimg.com/236x/41/cf/c8/41cfc821d08adfdee59d6a3503ba0c0b.jpg", answer: "لبنان" },
      { image: "https://i.pinimg.com/564x/95/49/47/9549475724c609dae42415c7d5e5d099.jpg", answer: "تركيا" },
      { image: "https://i.pinimg.com/236x/17/cc/ec/17ccecec86eb5fe2d0c75c7c85bc7b5d.jpg", answer: "السويد" }
  ];

  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

  try {
      const response = await axios.get(randomQuestion.image, { responseType: "arraybuffer" });
      fs.writeFileSync(tempPath, Buffer.from(response.data));

      return api.sendMessage({
          body: `${header}\n\n⪼ مـا اسـم عـلـم هـذه الـدولة؟`,
          attachment: fs.createReadStream(tempPath)
      }, threadID, (err, info) => {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          global.client.handleReply.push({
              name: this.config.name,
              messageID: info.messageID,
              author: senderID,
              correctAnswer: randomQuestion.answer
          });
      }, messageID);
  } catch (error) {
      return api.sendMessage("⪼ حـدث خـطأ فـي جـلـب الـصورة.", threadID, messageID);
  }
};
