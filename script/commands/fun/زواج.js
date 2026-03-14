const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "زواج",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "زواج بمنشن، أيدي، أو رد (حذف بالتفاعل مفعّل)",
  commandCategory: "fun",
  usages: "زواج [@منشن/ID/رد]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "jimp": ""
  }
};

module.exports.handleEvent = async function({ api, event }) {
  const { messageID, reaction, messageReply } = event;
  // حذف الرسالة عند تفاعل أي شخص بـ 👍 على رد البوت
  if (reaction === "👍" && messageReply?.senderID === api.getCurrentUserID()) {
    return api.unsendMessage(messageReply.messageID);
  }
};

async function circle(image) {
  const img = await jimp.read(image);
  img.circle();
  return await img.getBufferAsync("image/png");
}

module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;
  const cacheDir = path.join(__dirname, "cache", "canvas");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  let targetID;
  if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else if (type === "message_reply") {
    targetID = messageReply.senderID;
  } else if (args[0] && !isNaN(args[0])) {
    targetID = args[0];
  }

  if (!targetID) {
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nعليك عمل منشن، أو رد، أو كتابة الأيدي لمن تريد الزواج به", threadID, messageID);
  }

  const pathImg = path.join(cacheDir, `marry_${senderID}_${targetID}.png`);
  const avatarOnePath = path.join(cacheDir, `avt_${senderID}.png`);
  const avatarTwoPath = path.join(cacheDir, `avt_${targetID}.png`);
  const backgroundPath = path.join(cacheDir, "marry_bg.png");

  try {
    const [senderName, targetName] = await Promise.all([
      Users.getNameUser(senderID),
      Users.getNameUser(targetID)
    ]);

    // جلب الخلفية
    if (!fs.existsSync(backgroundPath)) {
      const bgRes = await axios.get("https://i.ibb.co/9ZZCSzR/ba6abadae46b5bdaa29cf6a64d762874.jpg", { responseType: "arraybuffer" });
      fs.writeFileSync(backgroundPath, Buffer.from(bgRes.data, "utf-8"));
    }

    const getAvt = async (uid, savePath) => {
      const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(savePath, Buffer.from(res.data, "utf-8"));
      return savePath;
    };

    await Promise.all([getAvt(senderID, avatarOnePath), getAvt(targetID, avatarTwoPath)]);

    const baseImage = await jimp.read(backgroundPath);
    const circleOne = await jimp.read(await circle(avatarOnePath));
    const circleTwo = await jimp.read(await circle(avatarTwoPath));

    // ضبط إحداثيات الزواج بناءً على القالب المرفق
    baseImage.composite(circleOne.resize(130, 130), 200, 70)
              .composite(circleTwo.resize(130, 130), 350, 150);

    const buffer = await baseImage.getBufferAsync("image/png");
    fs.writeFileSync(pathImg, buffer);

    return api.sendMessage({
      body: `⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nألف مبروك الزواج لـ ${senderName} و ${targetName} 💍`,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => {
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
      if (fs.existsSync(avatarOnePath)) fs.unlinkSync(avatarOnePath);
      if (fs.existsSync(avatarTwoPath)) fs.unlinkSync(avatarTwoPath);
    }, messageID);

  } catch (error) {
    if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\nحدث خطأ في إتمام مراسم الزواج!`, threadID, messageID);
  }
};
