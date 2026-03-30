const axios = require('axios');

module.exports.config = {
  name: "gpt",
  aliases: ["ai", "ذكاء"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ST",
  description: "تحدث مع الذكاء الاصطناعي GPT",
  commandCategory: "AI",
  usages: "<رسالتك>",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "🤖 مرحباً! أنا GPT\nكيف أقدر أساعدك؟\n\nاستخدم: .gpt <رسالتك>",
      threadID, messageID
    );
  }

  const userMessage = args.join(" ");

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    const response = await axios.post("https://api.manusai.watch/api/chat", {
      agent: 1,
      context: [{ role: "user", content: userMessage }],
      message: userMessage
    }, {
      headers: {
        "User-Agent": "Masiha%20AI/1 CFNetwork/3860.100.1 Darwin/25.0.0",
        "Content-Type": "application/json",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (response.data?.status && response.data?.data) {
      const reply = response.data.data;
      api.setMessageReaction("✅", messageID, () => {}, true);

      api.sendMessage(reply, threadID, (err, info) => {
        if (!err && info) {
          global.Mirai.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
            author: senderID,
            type: "chat",
            messageID: info.messageID
          });
        }
      }, messageID);
    } else {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("❌ لا يوجد رد من الذكاء الاصطناعي.", threadID, messageID);
    }
  } catch (err) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(`❌ خطأ: ${err.message}`, threadID, messageID);
  }
};

module.exports.onReply = async function ({ api, event, handleReply }) {
  if (handleReply.author !== event.senderID) return;
  const { threadID, messageID, senderID, body } = event;

  if (!body || body === "/r") return;

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    const response = await axios.post("https://api.manusai.watch/api/chat", {
      agent: 1,
      context: [{ role: "user", content: body }],
      message: body
    }, {
      headers: {
        "User-Agent": "Masiha%20AI/1 CFNetwork/3860.100.1 Darwin/25.0.0",
        "Content-Type": "application/json",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (response.data?.status && response.data?.data) {
      const reply = response.data.data;
      api.setMessageReaction("✅", messageID, () => {}, true);

      api.sendMessage(reply, threadID, (err, info) => {
        if (!err && info) {
          global.Mirai.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
            author: senderID,
            type: "chat",
            messageID: info.messageID
          });
        }
      }, messageID);
    } else {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("❌ لا يوجد رد.", threadID, messageID);
    }
  } catch (err) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(`❌ خطأ: ${err.message}`, threadID, messageID);
  }
};
