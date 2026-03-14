module.exports.config = {
  name: "سكرين",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "التقاط صورة لموقع ويب (رسالة واحدة)",
  commandCategory: "utility",
  usages: "سكرين [الرابط] أو بالرد على رابط",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const fs = require("fs-extra");
  const axios = require("axios");
  const path = require("path");
  const { threadID, messageID, type, messageReply } = event;

  // 1. تحديد الرابط سواء من الأرجومنت أو من الرد على رسالة
  let url = args[0];
  if (type === "message_reply" && messageReply.body) {
    const regex = /(https?:\/\/[^\s]+)/g;
    const found = messageReply.body.match(regex);
    if (found) url = found[0];
  }

  if (!url) {
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n❌ يرجى إدخال رابط أو الرد على رسالة تحتوي على رابط.", threadID, messageID);
  }

  // التأكد من أن الرابط يبدأ بـ http
  if (!url.startsWith("http")) url = "https://" + url;

  const cachePath = path.join(__dirname, "cache", `screen_${Date.now()}.png`);

  try {
    // جلب الصورة مباشرة
    const screenshotUrl = `https://image.thum.io/get/width/1920/crop/800/noanimate/${url}`;
    
    const response = await axios.get(screenshotUrl, { 
      responseType: 'arraybuffer',
      timeout: 20000 // مهلة 20 ثانية للتحميل
    });

    if (response.data.length < 100) throw new Error("الصورة المستلمة غير صالحة");

    fs.ensureDirSync(path.join(__dirname, "cache"));
    fs.writeFileSync(cachePath, Buffer.from(response.data));

    // إرسال الرسالة الواحدة مع الصورة
    return api.sendMessage({ 
        body: `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗦𝗖𝗥𝗘𝗘𝗡 ━━ ⌬\n\n✅ تم تصوير الموقع بنجاح\n🔗 الرابط: ${url}`,
        attachment: fs.createReadStream(cachePath) 
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

  } catch (error) {
    console.error(error);
    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n❌ فشل التقاط الصورة. الرابط قد يكون غير صالح أو الموقع محجوب.", threadID, messageID);
  }
};
