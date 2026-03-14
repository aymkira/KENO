const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "مجموعتي",
  version: "1.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "معلومات عن المجموعة",
  commandCategory: "📊 معلومات",
  usages: "",
  cooldowns: 5,
};

module.exports.run = async function({ api, event }) {
  const threadInfo = await api.getThreadInfo(event.threadID);
  const userInfo = threadInfo.userInfo;

  let male = 0, female = 0;
  for (let user of userInfo) {
    if (user.gender === 1) female++;
    else if (user.gender === 2) male++;
  }

  const total = threadInfo.participantIDs.length;
  const adminCount = threadInfo.adminIDs.length;

  let imageUrl = threadInfo.imageSrc;
  let imagePath = __dirname + "/cache/group.jpg";

  if (imageUrl) {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(imagePath, Buffer.from(response.data, "utf-8"));
  }

  const message = `📍 معلومات المجموعة:
🧑‍🤝‍🧑 الأعضاء: ${total}
🛡️ الأدمن: ${adminCount}
👨 الذكور: ${male}
👩 الإناث: ${female}`;

  const messageData = imageUrl
    ? { body: message, attachment: fs.createReadStream(imagePath) }
    : { body: message };

  return api.sendMessage(messageData, event.threadID, () => {
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  });
};
