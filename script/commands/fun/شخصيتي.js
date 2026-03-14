const fs = require("fs-extra");
const axios = require("axios");
const request = require("request");
const path = require("path");

module.exports.config = {
  name: "شخصيتي",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "عمر",
  description: "لو كنت شخصية انمي شو هتكون (بالزخارف)",
  commandCategory: "fun",
  usages: ".شخصيتي",
  cooldowns: 5
};

module.exports.run = async ({ api, event, Users, Currencies }) => {
  const { threadID, messageID, senderID } = event;
  const cachePath = path.join(__dirname, "cache", `char_${senderID}.jpg`);
  
  try {
    const userName = await Users.getNameUser(senderID);
    const userData = await Currencies.getData(senderID);
    const money = userData.money;

    if (money < 500) {
      return api.sendMessage("◈ ───『 𝑲𝑰𝑹𝑨 𝑺𝒀𝑺𝑻𝑬𝑴 』─── ◈\n\n⚠️ ادفع 500 دولار لتشغيل الأمر!", threadID, messageID);
    }

    await Currencies.decreaseMoney(senderID, 500);

    const links = [
       "https://i.imgur.com/RRnddBS.jpg", "https://i.imgur.com/4av6OnG.jpg", "https://i.imgur.com/bID48JU.jpg",
       "https://i.imgur.com/Kkc5CZs.jpg", "https://i.imgur.com/T9WwPxL.jpg", "https://i.imgur.com/R7trNF3.jpg",
       "https://i.imgur.com/pp3L51v.jpg", "https://i.imgur.com/nmTpfIV.jpg", "https://i.imgur.com/G7Cmlm5.jpg",
       "https://i.imgur.com/gyk1KTE.jpg", "https://i.imgur.com/0C40VMA.jpg", "https://i.imgur.com/b0YCfBO.jpg",
       "https://i.imgur.com/EF63R6y.jpg", "https://i.imgur.com/uaBmGDh.jpg", "https://i.imgur.com/J68g1dP.jpg",
       "https://i.imgur.com/co4wnOI.jpg", "https://i.imgur.com/rcXzlbD.jpg", "https://i.imgur.com/4K2Lx2E.jpg",
       "https://i.imgur.com/d9KlCjt.jpg", "https://i.imgur.com/KriNOKQ.jpg", "https://i.imgur.com/phrVQXt.jpg",
       "https://i.imgur.com/5j3cTq5.jpg", "https://i.imgur.com/Ot3QVTg.jpg", "https://i.imgur.com/QHZN13e.jpg",
       "https://i.imgur.com/SdO0pM9.jpg", "https://i.imgur.com/ci4PEdV.jpg", "https://i.imgur.com/wJ8Xf7y.jpg",
       "https://i.imgur.com/tWAcRGP.jpg", "https://i.imgur.com/BAydztZ.jpg", "https://i.imgur.com/vMNBrY3.jpg",
       "https://i.imgur.com/h2bGRek.jpg", "https://i.imgur.com/Sg3Ai4Y.jpg", "https://i.imgur.com/KFdJypu.jpg",
       "https://i.imgur.com/PChQ6Ea.jpg", "https://i.imgur.com/pekp4LZ.jpg", "https://i.imgur.com/uKmiejK.jpg",
       "https://i.imgur.com/pXUtKtB.jpg", "https://i.imgur.com/Foi1zGB.jpg", "https://i.imgur.com/iQ3DWx5.jpg",
       "https://i.imgur.com/r8yrFRw.jpg", "https://i.imgur.com/4PqzyWP.jpg"
    ];

    const randomLink = links[Math.floor(Math.random() * links.length)];
    fs.ensureDirSync(path.join(__dirname, "cache"));

    const callback = () => {
      api.sendMessage({
        body: `◈ ───『 𝑨𝑵𝑰𝑴𝑬 𝑪𝑯𝑨𝑹 』─── ◈\n\nلو كان 【 ${userName} 】 شخصية انمي سيكون:`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);
    };

    return request(encodeURI(randomLink)).pipe(fs.createWriteStream(cachePath)).on("close", callback);

  } catch (error) {
    api.sendMessage(`❌ حدث خطأ: ${error.message}`, threadID, messageID);
  }
};
