const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "ميدجورني",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "AYOUB",
    description: "توليد صور Midjourney",
    commandCategory: "صور",
    usages: "mi [الوصف]",
    cooldowns: 10,
  },
  run: async ({ api, event, args }) => {
    try {
      const zabi = args.join(" ");
      if (!zabi) {
        return api.sendMessage("اكتب وصف الصورة", event.threadID, event.messageID);
      }
      const ayoub = await api.sendMessage("🎨 جاري التوليد...", event.threadID);
      const msito = await axios.post(
        "https://flux-nobro9735-9yayti5m.leapcell.online/api/midjourney/generate",
        { prompt: zabi, count: 1 },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 300000
        }
      );
      
      if (msito.data?.success && msito.data?.data?.imageUrls?.length > 0) {
        await msitzabayoub(msito.data.data.imageUrls, zabi, api, event, ayoub);
      } else {
        api.editMessage("❌ فشل في التوليد", ayoub.messageID);
      }
    } catch (error) {
      console.error("Error in mi command:", error);
      api.sendMessage(`❌ خطأ في الخدمة: ${error.message}`, event.threadID, event.messageID);
    }
  }
};

async function msitzabayoub(imageUrls, zabi, api, event, ayoub) {
  const attachments = [];
  const cacheDir = path.join(__dirname, "cache");
  
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const imageUrl = imageUrls[i];
      
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      if (imageResponse.data && imageResponse.data.byteLength > 1000) {
        const buffer = Buffer.from(imageResponse.data);
        const fileName = `mj_${Date.now()}_${i}.jpg`;
        const filePath = path.join(cacheDir, fileName);
        fs.writeFileSync(filePath, buffer);
        attachments.push(fs.createReadStream(filePath));
      }
    } catch (e) {
      console.error(`Error downloading image ${i}:`, e);
    }
  }
  
  if (attachments.length > 0) {
    api.sendMessage({
      body: `🎨 تم توليد ${attachments.length} صورة بناءً على: "${zabi}"`,
      attachment: attachments
    }, event.threadID, (error) => {
      if (!error) {
        attachments.forEach(stream => {
          if (stream.path && fs.existsSync(stream.path)) {
            fs.unlinkSync(stream.path);
          }
        });
        api.unsendMessage(ayoub.messageID);
      } else {
        console.error("Error sending message:", error);
        attachments.forEach(stream => {
          if (stream.path && fs.existsSync(stream.path)) {
            fs.unlinkSync(stream.path);
          }
        });
      }
    });
  } else {
    api.editMessage("❌ فشل في معالجة الصور", ayoub.messageID);
  }
  }
