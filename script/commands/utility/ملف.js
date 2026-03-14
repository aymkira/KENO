const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ملف",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "عرض معلومات ملف المستخدم الشخصي",
  commandCategory: "utility",
  usages: "[@منشن] أو رد على رسالة",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, mentions, messageReply, senderID } = event;

  try {
    let targetID = senderID;
    let targetName;

    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    targetName = await Users.getNameUser(targetID);

    const userInfo = await api.getUserInfo(targetID);
    const user = userInfo[targetID];

    if (!user) {
      return api.sendMessage(
        "⌬ ━━ 𝗞𝗜𝗥𝗔 UTILITY ━━ ⌬\n\n❌ فشل الحصول على معلومات المستخدم",
        threadID,
        messageID
      );
    }

    const profilePicUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    
    const response = await axios.get(profilePicUrl, { responseType: "arraybuffer" });
    const cachePath = path.join(__dirname, "cache", `profile_${targetID}.jpg`);
    
    if (!fs.existsSync(path.join(__dirname, "cache"))) {
      fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
    }

    fs.writeFileSync(cachePath, response.data);

    const infoText = `⌬ ━━ 𝗞𝗜𝗥𝗔 UTILITY ━━ ⌬\n\n👤 الاسم: ${user.name}\n🔗 الرابط: https://www.facebook.com/${targetID}\n🆔 المعرف: ${targetID}\n👥 الأصدقاء: ${user.isFriend ? "نعم" : "لا"}`;

    await api.sendMessage(
      {
        body: infoText,
        attachment: fs.createReadStream(cachePath)
      },
      threadID,
      () => fs.unlinkSync(cachePath),
      messageID
    );

  } catch (error) {
    console.error("ملف - خطأ:", error);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 UTILITY ━━ ⌬\n\n❌ حدث خطأ أثناء جلب المعلومات\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};
