module.exports.config = {
  name: "ترامب",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "مقولات مضحكة على لسان ترامب",
  commandCategory: "🎮 الألعاب",
  usages: "",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const quotes = [
    "أنا الوحيد اللي يقدر يحل مشكلة اليمن... وأنا مشغول بتغريداتي 🐦",
    "لو كنت رئيس في العالم العربي، كنت عملت الجدران بين كل الدول 😂",
    "سأجعل الإنترنت مدفوع في الصومال، لأنهم يسبقونا في السرعة! 😤",
    "أنا أذكى من الذكاء الاصطناعي، بس ما أبغى أحرجهم 🤖",
    "في عهدي، كانت الكيبوردات تغرد لحالها من كثر التغريد! 🐤",
    "لو ترشحت في الأنمي، كنت فزت بدون منافس 💥",
    "ببساطة... أنا الأفضل. اسألوا تويتر، حذفوني لأنهم غيرانين 😎",
    "لو كنت روبوت... كنت كتبت الكود بدون أخطاء، على عكس البعض 💻😂"
  ];

  // اختيار عشوائي
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  return api.sendMessage(`📢 ترامب قال:\n\n"${quote}"`, event.threadID, event.messageID);
};
