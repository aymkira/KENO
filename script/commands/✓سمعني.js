const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "سمعني",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Y-ANBU",
    description: "تحميل أغاني من يوتيوب بصيغة mp3",
    commandCategory: "خدمات",
    usages: "سمعني (اغنية لي تريد)",
    cooldowns: 10,
  },

  async run({ args, api, event }) {
    if (args.length === 0) {
      return api.sendMessage("حط اسم اغنيه", event.threadID, event.messageID);
    }
    const query = args.join(" ");
    try {
      const search = await yts(query);
      if (!search.videos.length) {
        return api.sendMessage("ما لقيت شيء", event.threadID, event.messageID);
      }
      const video = search.videos[0];
      const videoUrl = video.url;
      const apiRes = await axios.post(
        "https://sami3ni-yassine3323735-kr3wx9e4.leapcell.dev/yt-mp3",
        { url: videoUrl },
        { headers: { "Content-Type": "application/json" } }
      );
      const downloadUrl = apiRes.data.download; 
      if (!downloadUrl) {
        return api.sendMessage("حصل خطأ في api", event.threadID, event.messageID);
      }
      const tempFile = path.join(__dirname, `${Date.now()}.mp3`);
      const response = await axios.get(downloadUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(tempFile);
      response.data.pipe(writer);
      writer.on("finish", async () => {
        api.sendMessage(
          {
            body: `🎵 ${video.title}\n⏱️ ${video.timestamp}`,
            attachment: fs.createReadStream(tempFile),
          },
          event.threadID,
          () => fs.unlinkSync(tempFile), 
          event.messageID
        );
      });
      writer.on("error", (err) => {
        console.error(err);
        api.sendMessage("حصل خطأ في تحميل الملف", event.threadID, event.messageID);
      });

    } catch (err) {
      console.error(err);
      return api.sendMessage(err, event.threadID, event.messageID);
    }
  }
};
