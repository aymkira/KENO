const axios = require("axios");

const IMGUR_CLIENT_ID = "546c25a59c58ad7";

module.exports.config = {
  name: "رابط",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ayman",
  description: "رفع صورة على Imgur والحصول على رابطها",
  commandCategory: "utility",
  usages: "أرسل صورة + .رابط / رد على صورة + .رابط",
  cooldowns: 10
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, messageReply, attachments } = event;

  let imageUrl = null;

  if (attachments?.length)
    imageUrl = attachments.find(a => a.type === "photo" || a.type === "sticker")?.url;

  if (!imageUrl && messageReply?.attachments?.length)
    imageUrl = messageReply.attachments.find(a => a.type === "photo" || a.type === "sticker")?.url;

  if (!imageUrl)
    return api.sendMessage("أرسل صورة أو رد على صورة + .رابط", threadID, messageID);

  try {
    const imgRes  = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 15000 });
    const upload  = await axios.post("https://api.imgur.com/3/image", {
      image: Buffer.from(imgRes.data).toString("base64"),
      type:  "base64",
    }, {
      headers: { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` },
      timeout: 20000,
    });

    if (!upload.data?.success) throw new Error("فشل");

    return api.sendMessage(upload.data.data.link, threadID, messageID);

  } catch(e) {
    return api.sendMessage("❌ فشل الرفع: " + e.message, threadID, messageID);
  }
};