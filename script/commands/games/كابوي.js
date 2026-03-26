const axios = require("axios");
const path  = require("path");

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); }
  catch { return null; }
}

function getBotName() {
  try {
    const cfg = require(path.join(process.cwd(), "config.json"));
    return cfg.BOTNAME || "BOT";
  } catch { return "BOT"; }
}

module.exports.config = {
  name: "كابوي",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "لعبة راعي البقر",
  commandCategory: "games",
  usages: "كابوي",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;
  const BOT = getBotName();
  const header = `⌬ ━━━━━━━━━━━━ ⌬\n⌬ ━━ ${BOT} GAMES ━━ ⌬\n      🐄 تـحـدي الـكـابـوي\n⌬ ━━━━━━━━━━━━ ⌬`;

  try {
    const gif = (await axios.get("https://i.ibb.co/2dgF3vf/keobogif.gif", { responseType: "stream" })).data;
    return api.sendMessage({
      body: `${header}\n\n⪼ اخـتـر بـقـرة لـسـحـبـهـا (1-5):\n💰 الـجـائـزة: 50$\n\n⌬ ━━━━━━━━━━━━ ⌬\n📩 رد بـرقـم الـبـقـرة لـلـبـدء!`,
      attachment: gif
    }, threadID, (err, info) => {
      global.client.handleReply.push({ name: "كابوي", messageID: info.messageID, author: senderID, step: 1 });
    }, messageID);
  } catch (e) { return api.sendMessage("⚠️ عطل في جلب اللعبة.", threadID); }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, senderID, messageID, body } = event;
  if (handleReply.author !== senderID) return;

  const BOT = getBotName();
  const header = `⌬ ━━━━━━━━━━━━ ⌬\n⌬ ━━ ${BOT} GAMES ━━ ⌬`;
  const db = getDB();

  if (handleReply.step === 1) {
    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > 5)
      return api.sendMessage("⚠️ اخـتـر رقـم مـن 1 إلـى 5 فـقـط.", threadID, messageID);

    return api.sendMessage(
      `${header}\n⪼ لـقـد حـددت الـبـقـرة [ ${choice} ]\n⪼ رد بـكـلـمـة "سحب" الآن!\n⌬ ━━━━━━━━━━━━ ⌬`,
      threadID, (err, info) => {
        global.client.handleReply.push({ name: "كابوي", messageID: info.messageID, author: senderID, choice, step: 2 });
      }, messageID
    );
  }

  if (handleReply.step === 2) {
    if (body.trim() !== "سحب") return api.sendMessage("⚠️ يـجـب الـرد بـكـلـمـة 'سحب'!", threadID, messageID);

    const images = {
      "1": ["https://i.ibb.co/VH1jcVH/bo1-success.jpg", "https://i.ibb.co/JCNFMF1/bo1-fail.jpg"],
      "2": ["https://i.ibb.co/cX2BN8Q/bo2-success.jpg", "https://i.ibb.co/473dpvW/bo2-fail.jpg"],
      "3": ["https://i.ibb.co/vhkgzS4/bo3-success.jpg", "https://i.ibb.co/42r5pPd/bo3-fail.jpg"],
      "4": ["https://i.ibb.co/gb0fbPS/bo4-success.jpg", "https://i.ibb.co/hMfRHHr/bo4-fail.jpg"],
      "5": ["https://i.ibb.co/RTSKc7q/bo5-success.jpg", "https://i.ibb.co/sFRsTr2/bo5-fail.jpg"]
    };

    const [winImg, loseImg] = images[handleReply.choice];
    const isWin = Math.random() > 0.5;

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);
      const image = (await axios.get(isWin ? winImg : loseImg, { responseType: "stream" })).data;

      if (isWin) {
        if (db) await db.addMoney(senderID, 50).catch(() => {});
        return api.sendMessage({ body: `${header}\n✅ كـفـو! نـجـحـت!\n⪼ الـجـائـزة: 50$\n⌬ ━━━━━━━━━━━━ ⌬`, attachment: image }, threadID, messageID);
      } else {
        return api.sendMessage({ body: `${header}\n❌ افـلـتـت مـنـك!\n⪼ حـاول مـرة أخـرى.\n⌬ ━━━━━━━━━━━━ ⌬`, attachment: image }, threadID, messageID);
      }
    } catch (e) { return api.sendMessage("⚠️ خطأ في تحميل النتيجة.", threadID); }
  }
};
