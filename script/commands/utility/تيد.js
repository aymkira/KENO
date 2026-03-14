module.exports.config = {
  name: "تيد",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "معرفة آيدي المجموعة أو المستخدم",
  commandCategory: "utility",
  usages: "تيد",
  cooldowns: 2
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID, type, messageReply } = event;

  // إذا قمت بالرد على شخص، سيعطيك الآيدي الخاص به، وإذا لم ترد سيعطيك آيدي المجموعة
  if (type === "message_reply") {
    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n🆔 آيدي المستخدم: ${messageReply.senderID}`, threadID, messageID);
  } else {
    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n🆔 آيدي المجموعة: ${threadID}`, threadID, messageID);
  }
};

