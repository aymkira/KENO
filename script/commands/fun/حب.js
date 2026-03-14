 const axios = require("axios");

module.exports.config = {
  name: "حب",
  version: "2.3.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "حساب نسبة الحب بالصور مع دعم الأيدي والرد",
  commandCategory: "fun",
  usages: "حب [@منشن/ID/رد]",
  cooldowns: 5
};

module.exports.handleEvent = async function({ api, event }) {
  const { messageID, reaction, messageReply } = event;
  if (reaction === "👍" && messageReply?.senderID === api.getCurrentUserID()) {
    return api.unsendMessage(messageReply.messageID);
  }
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;
  let targetID;

  if (Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];
  else if (type === "message_reply") targetID = messageReply.senderID;
  else if (args[0] && !isNaN(args[0])) targetID = args[0];

  if (!targetID) return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nعليك عمل منشن أو رد أو كتابة أيدي", threadID, messageID);

  try {
    const senderName = await Users.getNameUser(senderID);
    const targetName = await Users.getNameUser(targetID);
    const percentage = Math.floor(Math.random() * 101);
    
    // جلب صورة عشوائية للحب لضمان ظهور "ميديا" في الرسالة
    const imgRes = await axios.get(`https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "stream" });

    return api.sendMessage({
      body: `⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\n${senderName} 💘 ${targetName}\n\nنسبة الحب: ${percentage}%\nالحالة: ${percentage > 50 ? "حب قوي" : "يحتاج وقت"}`,
      attachment: imgRes.data
    }, threadID, messageID);

  } catch (e) {
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nخطأ في جلب البيانات", threadID, messageID);
  }
};
