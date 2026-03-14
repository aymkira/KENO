let developerKickCount = {}; // لحفظ عدد مرات الطلب من المطور

const DEVELOPER_ID = "61572167800906"; // ← معرف المطور

module.exports.config = {
  name: "اطرديني",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "عمر + ChatGPT",
  description: "تطردك من المجموعة",
  commandCategory: "خدمات",
  usages: "",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const senderID = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  // تحقق من أن البوت أدمن
  const info = await api.getThreadInfo(threadID);
  const botIsAdmin = info.adminIDs.some(item => item.id == api.getCurrentUserID());
  if (!botIsAdmin) return api.sendMessage('هات ادمن وتدلل ', threadID, messageID);

  // إذا المطور هو اللي قال "اطرديني"
  if (senderID === DEVELOPER_ID) {
    if (!developerKickCount[senderID]) {
      developerKickCount[senderID] = 1;
      return api.sendMessage("كيف اطردك وانت قلبي ومطوري العزيز 😘", threadID, messageID);
    } else if (developerKickCount[senderID] < 2) {
      developerKickCount[senderID]++;
      return api.sendMessage("كيف اطردك وانت قلبي ومطوري العزيز 😘", threadID, messageID);
    } else {
      return api.sendMessage("أمرك حب بس 🤍", threadID, messageID);
    }
  }

  // أي عضو ثاني قال "اطرديني"
  try {
    await api.removeUserFromGroup(senderID, threadID);
    await api.sendMessage("امرك ابلع", threadID);
    await api.sendMessage("ابلع ياشلح 🤡", threadID);
  } catch (error) {
    api.sendMessage("ما قدرت أطردك، شكلك فوق القانون 👀", threadID, messageID);
  }
};
