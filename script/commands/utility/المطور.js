const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "المطور",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "أيمن",
  description: "معلومات المطور برمز السهم التقني",
  commandCategory: "utility",
  usages: "المطور",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const header = `⌬ ━━━━━━━━━━━━ ⌬\n      👑 الـمـطـور\n⌬ ━━━━━━━━━━━━ ⌬`;

  api.setMessageReaction("⏳", messageID, () => {}, true);

  const gifs = [
    "https://media.giphy.com/media/kXdo4BgGoFC80/giphy.gif",
    "https://media.giphy.com/media/FB5EOw0CaaQM0/giphy.gif",
    "https://media.giphy.com/media/EdInbVEktp3sA/giphy.gif",
    "https://media.giphy.com/media/UC0nxqFk0Sxa/giphy.gif"
  ];

  const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
  const gifPath = path.join(__dirname, "cache", `dev_arrow_${Date.now()}.gif`);

  try {
    const response = await axios.get(randomGif, { responseType: "arraybuffer" });
    await fs.outputFile(gifPath, Buffer.from(response.data));

    const msg = {
      body: `${header}\n\n` +
            `⪼ الاسـم: أيـمـن\n` +
            `⪼ الـديـانة: مـسيحي\n` +
            `⪼ الـسـكن: الـعراق\n` +
            `⪼ انـسـتا: x_v_k¹\n\n` +
            `👾 كـيـرا بـوت - 𝟐𝟎𝟐𝟔`,
      attachment: fs.createReadStream(gifPath)
    };

    return api.sendMessage(msg, threadID, () => {
      if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
      api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ خطأ في عرض البيانات.`, threadID, messageID);
  }
};
