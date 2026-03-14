const path = require("path");

module.exports.config = {
  name: "تجميع",
  version: "1.8.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "لعبة تجميع الحروف مع جوائز مالية",
  commandCategory: "games",
  usages: "تجميع",
  cooldowns: 5
};

const questions = [
  { question: "ا ل ظ ل ا م", answer: "الظلام" },
  { question: "ا ل س ع ا د ة", answer: "السعادة" },
  { question: "ا ل ح ر ا ر ة", answer: "الحرارة" },
  { question: "ا ل م س ت ق ب ل", answer: "المستقبل" },
  { question: "ا ل ش ج ا ع ة", answer: "الشجاعة" },
  { question: "ا ل ص د ا ق ة", answer: "الصداقة" },
  { question: "ا ل ك ه ر ب ا ء", answer: "الكهرباء" },
  { question: "ا ل ب ر ت ق ا ل", answer: "البرتقال" },
  { question: "ا ل م د ر س ة", answer: "المدرسة" },
  { question: "ا ل ت ك ن و ل و ج ي ا", answer: "التكنولوجيا" },
  { question: "ا ل ج غ ر ا ف ي ا", answer: "الجغرافيا" },
  { question: "ا ل م و س ي ق ى", answer: "الموسيقى" },
  { question: "ا ل ط ي ا ر ة", answer: "الطيارة" },
  { question: "ا ل ك م ب ي و ت ر", answer: "الكمبيوتر" },
  { question: "ا ل ج ز ا ئ ر", answer: "الجزائر" },
  { question: "ا ل م غ ر ب", answer: "المغرب" },
  { question: "ا ل ف ل س ط ي ن", answer: "فلسطين" },
  { question: "ا ل ع ر ا ق", answer: "العراق" },
  { question: "ا ل س ع و د ي ة", answer: "السعودية" },
  { question: "ا ل ك ي م ي ا ء", answer: "الكيمياء" },
  { question: "ا ل م خ ت ب ر", answer: "المختبر" },
  { question: "ا ل ت ل ف ا ز", answer: "التلفاز" },
  { question: "ا ل م ج ر ا ت", answer: "المجرات" },
  { question: "ا ل ب ر م ج ة", answer: "البرمجة" },
  { question: "ا ل ا ن س ت ق ر ا م", answer: "انستقرام" }
];

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { body, senderID, threadID, messageID } = event;
  if (handleReply.name !== "تجميع") return;

  const mongodb = require(path.join(process.cwd(), "includes", "mongodb.js"));
  const userAnswer = body.trim();
  const correctAnswer = handleReply.correctAnswer;

  if (userAnswer === correctAnswer) {
      await mongodb.addMoney(senderID, 50);
      api.unsendMessage(handleReply.messageID); 
      api.setMessageReaction("✅", messageID, () => {}, true);

      return api.sendMessage(`✅ أحـسـنـت، إجـابـة صـحـيـحـة!\n⪼ الـكـلـمـة: [ ${correctAnswer} ]\n⪼ الـجـائـزة: 50$ تـمـت إضـافـتـهـا.`, threadID, messageID);
  } else {
      api.setMessageReaction("❌", messageID, () => {}, true);
  }
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const header = `⌬ ━━━━━━━━━━━━ ⌬\n      🧩 تـحـدي الـتـجـمـيـع\n⌬ ━━━━━━━━━━━━ ⌬`;

  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
  const msg = `${header}\n\n⪼ أسرع شخص يجمع الكلمة:\n👉 [ ${randomQuestion.question} ]\n\n💰 الـجـائـزة: 50$\n\n⌬ ━━━━━━━━━━━━ ⌬\n📩 رد عـلـى الـرسـالـة بـالـحـل!`;

  return api.sendMessage(msg, threadID, (error, info) => {
      global.client.handleReply.push({
          name: "تجميع",
          messageID: info.messageID,
          author: event.senderID,
          correctAnswer: randomQuestion.answer
      });
  }, messageID);
};
