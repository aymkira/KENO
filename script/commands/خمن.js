module.exports.config = {
  name: "خمن",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ChatGPT + عشقي اليمن",
  description: "لعبة تخمين شخصية أنمي عبر الإيموجيات والفائز يحصل على 100$",
  commandCategory: "🎮 الألعاب",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Currencies }) {
  const characters = [
    { name: "ناروتو", emoji: "🧑‍⚡🍥🍜" },
    { name: "لوفي", emoji: "👒🧢🦜🏴‍☠️" },
    { name: "إيتاشي", emoji: "🖤🐦👁️🔥" },
    { name: "تانجيرو", emoji: "🗡️🌊👃🎴" },
    { name: "غوكو", emoji: "🟠💥🐉🍚" },
    { name: "لايت", emoji: "📓🍎💀🖊️" },
    { name: "زورو", emoji: "🗡️🗡️🗡️🧭" },
    { name: "ليفاي", emoji: "⚔️🧼🧹👊" },
    { name: "كاكاشي", emoji: "📖👁️‍🗨️🎭💨" },
    { name: "ريوك", emoji: "🍎💀👹📓" }
  ];

  const random = characters[Math.floor(Math.random() * characters.length)];
  const answer = random.name;
  const emoji = random.emoji;

  api.sendMessage(
    `🧠 من هو شخصية الأنمي المقصودة؟\n\n${emoji}\n\n⏳ لديك 20 ثانية للرد الصحيح!`,
    event.threadID,
    async (err, info) => {
      if (err) return;

      // انتظر الرد لمدة 20 ثانية
      const timeout = setTimeout(() => {
        api.sendMessage(`❌ انتهى الوقت! الإجابة الصحيحة كانت: ${answer}`, event.threadID, info.messageID);
      }, 20000);

      // مستمع للردود
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        answer,
        timeout
      });
    }
  );
};

module.exports.handleReply = async function({ api, event, handleReply, Currencies }) {
  const userAnswer = event.body.trim().toLowerCase();
  const correctAnswer = handleReply.answer.toLowerCase();

  if (userAnswer === correctAnswer) {
    clearTimeout(handleReply.timeout);

    // إضافة 100$ إلى الرصيد
    await Currencies.increaseMoney(event.senderID, 100);

    return api.sendMessage(
      `✅ إجابة صحيحة!\nتمت إضافة 100$ إلى رصيدك 💰`,
      event.threadID,
      event.messageID
    );
  }
};
