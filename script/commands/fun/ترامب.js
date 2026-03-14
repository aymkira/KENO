const fs = require('fs-extra');
const axios = require('axios');

module.exports.config = {
  name: "ترامب",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "يظهر النص أو اسم المنشن على لافتة ترامب مع معالجة ذكية",
  commandCategory: "fun",
  usages: "ترامب [نص] أو [منشن]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;
  const pathImg = __dirname + `/cache/trump_${senderID}.png`;
  
  let text = args.join(" ");
  let isMention = false;

  // 1. استخراج النص ومعرفة إذا كان هناك منشن
  if (type === "message_reply") {
    text = await Users.getNameUser(messageReply.senderID);
  } else if (Object.keys(mentions).length > 0) {
    const targetID = Object.keys(mentions)[0];
    text = mentions[targetID].replace("@", "");
    isMention = true; // نحدد أن هناك منشن
  }

  if (!text) {
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔  - الـترفـيـه ━━ ⌬\n\nقم بكتابة نص أو عمل منشن ليظهر على اللافتة", threadID, messageID);
  }

  try {
    // 2. معالجة النص: إذا كان منشن نضيف "2" في الرابط فقط (المعالجة المخفية)
    let processedText = text.replace(/\s+/g, '_');
    if (isMention) {
      processedText = processedText + "_2"; // يضيف الرقم 2 للرابط فقط لضمان المعالجة
    }

    const encodedText = encodeURIComponent(processedText);
    const apiUrl = `https://api.memegen.link/images/trump/${encodedText}.png`;

    const res = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    
    fs.ensureDirSync(__dirname + '/cache/');
    fs.writeFileSync(pathImg, Buffer.from(res.data, 'utf-8'));

    return api.sendMessage({
      body: "⌬ ━━ 𝗞𝗜𝗥𝗔  - الـترفـيـه ━━ ⌬",
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => {
      // مسح الصورة بعد الإرسال
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
    }, messageID);

  } catch (error) {
    if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
    console.error(error);
    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔  - الـترفـيـه ━━ ⌬\n\nعذراً، فشل توليد الصورة.`, threadID, messageID);
  }
};
