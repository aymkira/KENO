const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "زومبي",
  version: "1.0",
  hasPermssion: 0,
  credits: "SOMI",
  description: "تحويل الصورة إلى زومبي",
  usages: "زومبي + صورة",
  commandCategory: "تعديل الصور",
};

module.exports.run = async ({ api, event }) => {
  try {
    if (!event.messageReply || !event.messageReply.attachments || !event.messageReply.attachments[0]) {
      return api.sendMessage("🎯 رد على صورة واكتب: زومبي", event.threadID, event.messageID);
    }

    const imageUrl = event.messageReply.attachments[0].url;

    const res = await axios.post(
      "https://api.deepai.org/api/style-transfer",
      {
        image: imageUrl,
        style: "https://i.ibb.co/TPgSjxF/zombie-style.jpg"
      },
      {
        headers: {
          "api-key": "976ddfe8-26f1-4f8e-9c54-d30e8636dd0f"
        }
      }
    );

    const result = await axios.get(res.data.output_url, { responseType: "arraybuffer" });

    const path = __dirname + `/zombie_${Date.now()}.png`;
    fs.writeFileSync(path, result.data);

    api.sendMessage(
      {
        body: "💀 تم تحويل وجهك لزومبي… جهز نفسك 😈",
        attachment: fs.createReadStream(path)
      },
      event.threadID,
      () => fs.unlinkSync(path),
      event.messageID
    );

  } catch (err) {
    console.log(err);
    api.sendMessage("⚠️ حصل خطأ في التحويل… جرّب صورة أوضح أو غير الرابط.", event.threadID);
  }
};
