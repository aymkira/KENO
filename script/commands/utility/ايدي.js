const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "ايدي",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "جلب معرف المستخدم (UID) مع الصورة",
  commandCategory: "utility",
  usages: "ايدي | ايدي @منشن | بالرد",
  cooldowns: 3
};

module.exports.run = async function ({ api, event }) {
  const { senderID, threadID, messageID, type, messageReply, mentions } = event;

  try {
    let uid;

    // تحديد الـ UID بناءً على (رد، منشن، أو المستخدم نفسه)
    if (type === "message_reply") {
      uid = messageReply.senderID;
    } else if (mentions && Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else {
      uid = senderID;
    }

    const cachePath = path.join(__dirname, "cache", `uid_${uid}.jpg`);
    if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));

    // جلب صورة البروفايل بأعلى جودة
    const imgUrl = `https://graph.facebook.com/${uid}/picture?width=1500&height=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(cachePath, Buffer.from(res.data));

    // إرسال الأيدي مع رمز السهم
    return api.sendMessage({
      body: `⪼ ${uid}`,
      attachment: fs.createReadStream(cachePath)
    }, threadID, () => {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }, messageID);

  } catch (err) {
    return api.sendMessage("⪼ عذراً، تعذر جلب البيانات.", threadID, messageID);
  }
};
