const fs = require('fs-extra');
const axios = require('axios');

module.exports.config = {
  name: "شخصيات",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "احزر اسم الشخصيه من الصوره",
  commandCategory: "games",
  usages: "شخصيات",
  cooldowns: 5
};

module.exports.handleReply = async function({ api, event, handleReply, Users, Threads, Currencies, models }) {
  const { body, threadID, messageID, senderID } = event;
  const { correctAnswer, path } = handleReply;

  const userAnswer = body.trim().toLowerCase();
  const userName = await Users.getNameUser(senderID);

  if (userAnswer === correctAnswer.toLowerCase()) {
    await Currencies.increaseMoney(senderID, 50);
    api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 GAMES ━━ ⌬\n\nتهانينا ${userName} لقد عرفت الشخصية وحصلت على 50 دولار`, threadID, messageID);
    api.unsendMessage(handleReply.messageID);
  } else {
    api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 GAMES ━━ ⌬\n\nخطأ، حاول مرة أخرى`, threadID, messageID);
  }

  if (fs.existsSync(path)) fs.unlinkSync(path);
};

module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
  const { threadID, messageID, senderID } = event;

  const questions = [
    { image: "https://i.imgur.com/yrEx6fs.jpg", answer: "كورومي" },
    { image: "https://i.imgur.com/cAFukZB.jpg", answer: "الينا" },
    { image: "https://i.pinimg.com/236x/63/c7/47/63c7474adaab4e36525611da528a20bd.jpg", answer: "فوليت" },
    { image: "https://i.pinimg.com/236x/b3/cd/6a/b3cd6a25d9e3451d68628b75da6b2d9e.jpg", answer: "ليفاي" },
    { image: "https://i.pinimg.com/236x/eb/a1/c6/eba1c6ed1611c3332655649ef405490a.jpg", answer: "مايكي" },
    { image: "https://i.pinimg.com/236x/34/81/ba/3481ba915d12d27c1b2a094cb3369b4c.jpg", answer: "كاكاشي" },
    { image: "https://i.pinimg.com/236x/3a/df/87/3adf878c1b6ef2a90ed32abf674b780c.jpg", answer: "ميدوريا" },
    { image: "https://i.pinimg.com/564x/d2/c0/42/d2c042eeb8a92713b3f6e0a6dba2c353.jpg", answer: "وين" },
    { image: "https://i.pinimg.com/236x/f6/85/2b/f6852bfa6a09474771a17aca9018852e.jpg", answer: "نينم" },
    { image: "https://i.pinimg.com/236x/b6/0e/36/b60e36d13d8c11731c85b73e89f63189.jpg", answer: "هانكو" },
    { image: "https://i.pinimg.com/236x/bd/9d/5a/bd9d5a5040e872d4ec9e9607561e22da.jpg", answer: "زيرو تو" },
    { image: "https://i.pinimg.com/236x/5f/e8/f3/5fe8f3b46a33de8ce98927e95e804988.jpg", answer: "ايروين" },
    { image: "https://i.pinimg.com/474x/ab/3f/5e/ab3f5ec03eb6b18d2812f8c13c62bb92.jpg", answer: "تودروكي" },
    { image: "https://i.pinimg.com/236x/26/6e/8d/266e8d8e9ea0a9d474a8316b9ed54207.jpg", answer: "غوجو" },
    { image: "https://i.pinimg.com/474x/e5/2f/a3/e52fa34886b53184b767b04c70ce0885.jpg", answer: "دازاي" },
    { image: "https://i.pinimg.com/236x/03/af/3e/03af3e2769811b62eb75f1a8e63affe5.jpg", answer: "فوتوبا" },
    { image: "https://i.pinimg.com/236x/7f/38/6c/7f386c4afed64d0055205452091a313e.jpg", answer: "سيستا" },
    { image: "https://i.pinimg.com/236x/96/88/1e/96881ef27cbfce1071ff135b5a7e1fc7.jpg", answer: "نيزكو" },
    { image: "https://i.pinimg.com/236x/8a/c8/f9/8ac8f98dd946fefdae4e66020073e5ee.jpg", answer: "كيلوا" },
    { image: "https://i.pinimg.com/236x/e1/6a/5c/e16a5c5f91190ebf407ff3736135cb5a.jpg", answer: "كايل" },
    { image: "https://i.pinimg.com/564x/36/43/fc/3643fc4d86d3a7e8e60d14e71f8050a0.jpg", answer: "نيرو" },
    { image: "https://i.pinimg.com/236x/3b/b5/ef/3bb5efac247e16fe3fc30c9a7478cc07.jpg", answer: "ريوك" },
    { image: "https://i.pinimg.com/236x/79/9b/66/799b66006bc650a03fa264936ce254c7.jpg", answer: "تاكت" }
  ];

  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
  const path = __dirname + `/cache/char_${senderID}.jpg`;

  const imageResponse = await axios.get(randomQuestion.image, { responseType: "arraybuffer" });
  fs.writeFileSync(path, Buffer.from(imageResponse.data, "binary"));

  return api.sendMessage({ 
    body: `⌬ ━━ 𝗞𝗜𝗥𝗔 GAMES ━━ ⌬\n\nما اسم هذه الشخصية ؟`, 
    attachment: fs.createReadStream(path) 
  }, threadID, (error, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      correctAnswer: randomQuestion.answer,
      path: path
    });
  }, messageID);
};
