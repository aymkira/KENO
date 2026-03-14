const axios = require("axios");
const path = require("path");

module.exports.config = {
  name: "كابوي",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "لعبة راعي البقر المصلحة",
  commandCategory: "games",
  usages: "كابوي",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;
  const header = `⌬ ━━━━━━━━━━━━ ⌬\n      🐄 تـحـدي الـكـابـوي\n⌬ ━━━━━━━━━━━━ ⌬`;

  try {
    const gif = (await axios.get("https://i.ibb.co/2dgF3vf/keobogif.gif", { responseType: "stream" })).data;
    const msg = {
      body: `${header}\n\n⪼ اخـتـر بـقـرة لـسـحـبـهـا (1-5):\n💰 الـجـائـزة: 50$\n\n⌬ ━━━━━━━━━━━━ ⌬\n📩 رد بـرقـم الـبـقـرة لـلـبـدء!`,
      attachment: gif
    };

    return api.sendMessage(msg, threadID, (err, info) => {
      global.client.handleReply.push({
        name: "كابوي",
        messageID: info.messageID,
        author: senderID,
        step: 1
      });
    }, messageID);
  } catch (e) { return api.sendMessage("⚠️ عطل في جلب اللعبة.", threadID); }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, senderID, messageID, body } = event;
  if (handleReply.author !== senderID) return;

  const header = `⌬ ━━━━━━━━━━━━ ⌬`;
  const mongodb = require(path.join(process.cwd(), "includes", "mongodb.js"));

  // المرحلة الأولى: اختيار البقرة
  if (handleReply.step === 1) {
    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > 5) return api.sendMessage("⚠️ اخـتـر رقـم مـن 1 إلـى 5 فـقـط.", threadID, messageID);

    return api.sendMessage(`${header}\n⪼ لـقـد حـددت الـبـقـرة [ ${choice} ]\n⪼ رد عـلـى هـذه الـرسـالـة بـكـلـمـة "سحب" الآن!\n${header}`, threadID, (err, info) => {
      global.client.handleReply.push({
        name: "كابوي",
        messageID: info.messageID,
        author: senderID,
        choice: choice,
        step: 2
      });
    }, messageID);
  }

  // المرحلة الثانية: تنفيذ السحب
  if (handleReply.step === 2) {
    if (body.trim() !== "سحب") return api.sendMessage("⚠️ يـجـب الـرد بـكـلـمـة 'سحب' لـتـبـدأ!", threadID, messageID);

    const images = {
      "1": ["https://i.ibb.co/VH1jcVH/bo1-success.jpg", "https://i.ibb.co/JCNFMF1/bo1-fail.jpg"],
      "2": ["https://i.ibb.co/cX2BN8Q/bo2-success.jpg", "https://i.ibb.co/473dpvW/bo2-fail.jpg"],
      "3": ["https://i.ibb.co/vhkgzS4/bo3-success.jpg", "https://i.ibb.co/42r5pPd/bo3-fail.jpg"],
      "4": ["https://i.ibb.co/gb0fbPS/bo4-success.jpg", "https://i.ibb.co/hMfRHHr/bo4-fail.jpg"],
      "5": ["https://i.ibb.co/RTSKc7q/bo5-success.jpg", "https://i.ibb.co/sFRsTr2/bo5-fail.jpg"]
    };

    const [winImg, loseImg] = images[handleReply.choice];
    const isWin = Math.random() > 0.5;
    const imgUrl = isWin ? winImg : loseImg;

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);
      const image = (await axios.get(imgUrl, { responseType: "stream" })).data;

      if (isWin) {
        await mongodb.addMoney(senderID, 50);
        return api.sendMessage({
          body: `${header}\n✅ كـفـو! نـجـحـت فـي سـحبـها\n⪼ الـجـائـزة: 50$\n${header}`,
          attachment: image
        }, threadID, messageID);
      } else {
        return api.sendMessage({
          body: `${header}\n❌ لـلأسـف افـلـتـت مـنـك!\n⪼ حـاول مـرة أخـرى.\n${header}`,
          attachment: image
        }, threadID, messageID);
      }
    } catch (e) { return api.sendMessage("⚠️ خطأ في تحميل النتيجة.", threadID); }
  }
};
