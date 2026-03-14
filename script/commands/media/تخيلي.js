const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "تخيلي",
  version: "5.4.1",
  hasPermssion: 0,
  credits: "Ayman",
  description: "توليد صور بالذكاء الاصطناعي ✨",
  usePrefix: true,
  commandCategory: "media",
  usages: "[الوصف بالعربية]",
  cooldowns: 15,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const query = args.join(" ");
  const header = `⌬ ━━━━━━━━━━━━ ⌬\n     🎨 أنـظـمـة الـخـيـال\n⌬ ━━━━━━━━━━━━ ⌬`;

  if (!query) {
    return api.sendMessage(`${header}\n\n⪼ يـرجـى كـتـابـة وصـف الـصـورة لـرسـمـهـا.`, threadID, messageID);
  }

  api.sendMessage(`${header}\n\n⪼ جـاري مـعـالـجـة الـخـيـال...\n⪼ تـحـويـل الـنـص إلـى لـوحـة فـنـيـة.`, threadID);

  try {
    const path = __dirname + `/cache/imagine_${senderID}_${Date.now()}.png`;

    // الترجمة للإنجليزية لضمان أفضل نتيجة من الذكاء الاصطناعي
    const translationResponse = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(query)}`);
    const translation = translationResponse.data[0][0][0];

    // جلب الصورة من المحرك
    const response = await axios.get(`https://image.pollinations.ai/prompt/${encodeURIComponent(translation)}`, {
      responseType: "arraybuffer",
    });

    fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));

    return api.sendMessage({
      body: `${header}\n\n⪼ تـم الـتـولـيـد بـنـجـاح.\n⪼ الـوصـف: ${query}`,
      attachment: fs.createReadStream(path)
    }, threadID, () => { if (fs.existsSync(path)) fs.unlinkSync(path); }, messageID);

  } catch (error) {
    return api.sendMessage(`${header}\n\n⚠️ عـذراً، حـدث خـطأ فـي نـظـام الـتـولـيـد.`, threadID, messageID);
  }
};
