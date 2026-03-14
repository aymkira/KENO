const axios = require("axios");

module.exports.config = {
  name: "فيديو",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "SOMI",
  description: "يجلب فيديو قصير بدون أزرار",
  commandCategory: "متعة",
  usages: "فيديو [فئة]",
  cooldowns: 3,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const category = args[0] || "anime";

  try {
    const res = await axios.get(
      `https://tikwm.com/api/feed/search?keywords=${category}&count=10`
    );

    const videos = res.data.data.videos;
    if (!videos || !videos.length)
      return api.sendMessage(`لم أجد فيديوهات للفئة: ${category}`, threadID, messageID);

    const video = videos[Math.floor(Math.random() * videos.length)];

    await api.sendMessage(
      { body: `🎬 فيديو قصير للفئة: ${category}`, attachment: video.play },
      threadID,
      messageID
    );

  } catch (e) {
    console.log(e);
    return api.sendMessage("⚠️ حدث خطأ أثناء جلب الفيديو.", threadID, messageID);
  }
};
