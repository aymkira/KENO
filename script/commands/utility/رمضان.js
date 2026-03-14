module.exports.config = {
  name: "رمضان",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "العد التنازلي لشهر رمضان المبارك",
  commandCategory: "utility",
  usages: "رمضان",
  cooldowns: 5
};

module.exports.handleEvent = async function({ api, event, Users, Threads, Currencies, models }) {
  if (!event.body) return;
  const input = event.body.toLowerCase();

  if (input.includes("رمضان") || input === "متى الرمضان") {
    return this.run({ api, event, Users, Threads, Currencies, models });
  }
};

module.exports.run = async function({ api, event, Users, Threads, Currencies, models }) {
  const { threadID, messageID } = event;
  
  const ramadanDate = new Date("February 18, 2026 00:00:00").getTime();
  const now = new Date().getTime();
  const t = ramadanDate - now;
  
  if (t <= 0) {
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 UTILITY ━━ ⌬\n\n` +
      `مبارك عليكم الشهر\n` +
      `نحن الآن في رحاب شهر رمضان المبارك\n` +
      `تقبل الله منا ومنكم صالح الأعمال`,
      threadID,
      messageID
    );
  }

  const seconds = Math.floor((t / 1000) % 60);
  const minutes = Math.floor((t / 1000 / 60) % 60);
  const hours = Math.floor((t / (1000 * 60 * 60)) % 24);
  const days = Math.floor(t / (1000 * 60 * 60 * 24));

  const response = `⌬ ━━ 𝗞𝗜𝗥𝗔 UTILITY ━━ ⌬\n\n` +
                   `الوقت المتبقي لشهر رمضان 2026:\n\n` +
                   `${days} يوم\n` +
                   `${hours} ساعة\n` +
                   `${minutes} دقيقة\n` +
                   `${seconds} ثانية\n\n` +
                   `اللهم بلغنا رمضان لا فاقدين ولا مفقودين`;

  return api.sendMessage(response, threadID, messageID);
};
