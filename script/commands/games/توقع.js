const path = require("path");

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); }
  catch { return null; }
}

module.exports.config = {
  name: "توقع",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ayman",
  description: "لعبة الصناديق العملاقة",
  commandCategory: "games",
  usages: "توقع [المبلغ]",
  cooldowns: 5
};

const heavy = text => {
  const k = { "A":"𝗔","B":"𝗕","C":"𝗖","D":"𝗗","E":"𝗘","F":"𝗙","G":"𝗚","H":"𝗛","I":"𝗜","J":"𝗝","K":"𝗞","L":"𝗟","M":"𝗠","N":"𝗡","O":"𝗢","P":"𝗣","Q":"𝗤","R":"𝗥","S":"𝗦","T":"𝗧","U":"𝗨","V":"𝗩","W":"𝗪","X":"𝗫","Y":"𝗬","Z":"𝗭","a":"𝗮","b":"𝗯","c":"𝗰","d":"𝗱","e":"𝗲","f":"𝗳","g":"𝗴","h":"𝗵","i":"𝗶","j":"𝗷","k":"𝗸","l":"𝗹","m":"𝗺","n":"𝗻","o":"𝗼","p":"𝗽","q":"𝗾","r":"𝗿","s":"𝘀","t":"𝘁","u":"𝘂","v":"𝘃","w":"𝘄","x":"𝘅","y":"𝘆","z":"𝘇","0":"𝟬","1":"𝟭","2":"𝟮","3":"𝟯","4":"𝟰","5":"𝟱","6":"𝟲","7":"𝟳","8":"𝟴","9":"𝟵" };
  return text.toString().split("").map(c => k[c] || c).join("");
};

const HEADER = `⌬ ━━━━━━━━━━━━ ⌬\n   ${heavy("KIRA MEGA BOXES")}\n⌬ ━━━━━━━━━━━━ ⌬`;

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const db = getDB();
  if (!db) return api.sendMessage("❌ data.js مو موجود", threadID, messageID);

  try {
    await db.ensureUser(senderID);
    const wallet = await db.getWallet(senderID);
    const user   = await db.getUser(senderID);

    let bet = args[0];
    if (bet === "all") bet = wallet.money;
    bet = parseInt(bet);

    if (isNaN(bet) || bet < 100)
      return api.sendMessage(`${HEADER}\n\n⚠️ ${heavy("ERROR")}\nيرجى تحديد مبلغ رهان صحيح (100 فأكثر).`, threadID, messageID);

    if (bet > (wallet.money || 0))
      return api.sendMessage(`${HEADER}\n\n❌ ${heavy("POOR")}\nرصيدك (${wallet.money || 0}$) لا يكفي!`, threadID, messageID);

    const msg = `${HEADER}\n\n` +
      `👤 ${heavy("PLAYER")}: ${user?.name || senderID}\n` +
      `💰 ${heavy("BET")}: ${bet}$\n\n` +
      `🎁 اختر صندوقك:\n\n` +
      `1️⃣ 📦 ${heavy("BOX 01")}\n` +
      `2️⃣ 📦 ${heavy("BOX 02")}\n` +
      `3️⃣ 📦 ${heavy("BOX 03")}\n\n` +
      `📥 ${heavy("REPLY")} برقم الصندوق!`;

    return api.sendMessage(msg, threadID, (err, info) => {
      if (err) return;
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID,
        bet,
      });
    }, messageID);

  } catch(e) {
    api.sendMessage("❌ عطل في البنك.", threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (senderID != handleReply.author) return;

  const choice = parseInt(body);
  if (isNaN(choice) || choice < 1 || choice > 3) return;

  api.unsendMessage(handleReply.messageID);
  api.setMessageReaction("🎲", messageID, () => {}, true);

  const db         = getDB();
  const winningBox = Math.floor(Math.random() * 3) + 1;
  const isWin      = choice === winningBox;

  try {
    if (isWin) {
      const prize = handleReply.bet * 2;
      if (db) await db.addMoney(senderID, prize).catch(() => {});

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(
        `⌬ ━━━━━━━━━━━━ ⌬\n   ${heavy("KIRA TREASURE")}\n⌬ ━━━━━━━━━━━━ ⌬\n\n✨ ${heavy("WINNER")}\n📦 فتحت الصندوق (${choice}) ووجدت الكنز!\n\n💰 ${heavy("PRIZE")}: +${prize}$\n🥳 مبروك!`,
        threadID, messageID
      );
    }

    if (db) await db.removeMoney(senderID, handleReply.bet).catch(() => {});

    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(
      `⌬ ━━━━━━━━━━━━ ⌬\n     ${heavy("KIRA BOOM")}\n⌬ ━━━━━━━━━━━━ ⌬\n\n💥 ${heavy("LOST")}\n📦 الصندوق (${choice}) كان فارغاً!\n\n🗑️ ${heavy("LOSS")}: -${handleReply.bet}$\n💡 الكنز كان في: [ ${winningBox} ]`,
      threadID, messageID
    );
  } catch(e) {
    api.sendMessage("❌ فشل تحديث الرصيد.", threadID, messageID);
  }
};
