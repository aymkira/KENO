module.exports.config = {
  name: "طوكيو",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "صور شخصيات أنمي طوكيو ريفينجرز ✨",
  commandCategory: "pic",
  usages: "طوكيو",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");
  const { threadID, messageID } = event;

  // تفاعل الانتظار
  api.setMessageReaction("⏳", messageID, () => {}, true);

  const links = [
    "https://i.imgur.com/ho235f3.jpg",
    "https://i.imgur.com/79gtJRN.jpeg",
    "https://i.imgur.com/rNGNE2z.jpeg",
    "https://i.imgur.com/fRsfqi1.jpeg",
    "https://i.imgur.com/zbpxrME.jpeg",
    "https://i.imgur.com/Uuaslo8.jpeg",
    "https://i.imgur.com/gCn31eH.jpeg",
    "https://i.imgur.com/1Mf7gN8.jpeg",
    "https://i.imgur.com/Eacbowm.jpeg",
    "https://i.imgur.com/ElbhzDg.jpeg",
    "https://i.imgur.com/ZbBMmzr.png",
    "https://i.imgur.com/WC20Ko8.jpeg",
    "https://i.imgur.com/PU6FLZR.jpeg",
    "https://i.imgur.com/Kkgy2EW.jpeg",
    "https://i.imgur.com/lZDwumq.png",
    "https://i.imgur.com/DUvurgk.png",
    "https://i.imgur.com/zdKILzU.jpeg",
    "https://i.imgur.com/z2iVuwC.jpeg",
    "https://i.imgur.com/aqS5AjN.jpeg",
    "https://i.imgur.com/KBDGUMM.jpeg",
    "https://i.imgur.com/XSsEGQl.jpeg",
    "https://i.imgur.com/nujMCoy.jpeg",
    "https://i.imgur.com/UQMD9SC.jpeg",
    "https://i.imgur.com/JpBFjfQ.jpeg",
    "https://i.imgur.com/WhTye56.jpeg",
    "https://i.imgur.com/ESDmvUn.jpeg",
    "https://i.imgur.com/eMBfwgo.jpeg",
    "https://i.imgur.com/2xtvsur.jpeg",
    "https://i.imgur.com/th8WNHT.jpeg",
    "https://i.imgur.com/Nruo2nh.jpeg",
    "https://i.imgur.com/ei7zFjf.jpeg",
    "https://i.imgur.com/1TgOpJB.jpeg",
    "https://i.imgur.com/LWZIALy.jpeg",
    "https://i.imgur.com/yIeGgrW.jpeg",
    "https://i.imgur.com/FEy8S16.jpeg",
    "https://i.imgur.com/o5QnRbx.jpeg",
    "https://i.imgur.com/9NqRfBe.jpeg",
    "https://i.imgur.com/U3i741w.jpeg",
    "https://i.imgur.com/teF7vuY.jpeg",
    "https://i.imgur.com/0qCKrsx.jpeg",
    "https://i.imgur.com/p3NOmIL.jpeg",
    "https://i.imgur.com/B8Itg5d.jpeg",
    "https://i.imgur.com/D9SebFJ.jpeg",
    "https://i.imgur.com/y4BvtRS.png",
    "https://i.imgur.com/Me0nrmK.jpeg",
    "https://i.imgur.com/y5StmTj.jpeg",
    "https://i.imgur.com/jExqqu0.jpeg",
    "https://i.imgur.com/6J0tQGf.jpeg",
    "https://i.imgur.com/TlHTeN7.jpg",
    "https://i.imgur.com/eZRFmSz.jpeg",
    "https://i.imgur.com/rcOTulF.jpeg",
    "https://i.imgur.com/QOBWQGO.jpeg",
    "https://i.imgur.com/HBk0U8M.jpeg",
    "https://i.imgur.com/uH6JUVW.jpeg",
    "https://i.imgur.com/PCd0ogv.jpeg",
    "https://i.imgur.com/pIZNKAa.jpeg",
    "https://i.imgur.com/79gtJRN.jpeg",
    "https://i.imgur.com/0tgOmcm.jpg"
  ];

  const randomImg = links[Math.floor(Math.random() * links.length)];
  const cachePath = path.join(__dirname, "cache", `tokyo_${Date.now()}.jpg`);

  try {
    // تحميل الصورة
    const response = await axios.get(randomImg, { responseType: "arraybuffer" });
    fs.ensureDirSync(path.join(__dirname, "cache"));
    fs.writeFileSync(cachePath, Buffer.from(response.data));

    api.setMessageReaction("✅", messageID, () => {}, true);

    return api.sendMessage(
      {
        body: `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗧𝗢𝗞𝗬𝗢 ━━ ⌬\n\n✨ عدد الصور المتاحة: ${links.length}\n🔥 استمتع بالصورة العشوائية!`,
        attachment: fs.createReadStream(cachePath)
      },
      threadID,
      () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      },
      messageID
    );

  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", messageID, () => {}, true);
    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 PIC ━━ ⌬\n\nحدث خطأ أثناء جلب الصورة، حاول لاحقاً.", threadID, messageID);
  }
};
