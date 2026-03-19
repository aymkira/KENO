const path = require("path");

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); }
  catch { return null; }
}

module.exports.config = {
  name: "حظ",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ayman",
  description: "لعبة حظ سريعة",
  commandCategory: "games",
  usages: "حظ [المبلغ]",
  cooldowns: 10
};

const header = `⌬ ━━━━━━━━━━━━ ⌬\n   𝗞𝗜𝗥𝗔 𝗥𝗢𝗬𝗔𝗟 𝗟𝗨𝗖𝗞\n⌬ ━━━━━━━━━━━━ ⌬`;

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const db = getDB();
  if (!db) return api.sendMessage("❌ data.js مو موجود", threadID, messageID);

  try {
    const bet = parseInt(args[0]);

    if (isNaN(bet) || bet <= 0)
      return api.sendMessage(`${header}\n\n⚠️ اكتب مبلغ الرهان صح!\nمثال: .حظ 500`, threadID, messageID);

    await db.ensureUser(senderID);
    const wallet  = await db.getWallet(senderID);
    const balance = wallet.money || 0;

    if (balance < bet)
      return api.sendMessage(`${header}\n\n❌ رصيدك غير كافٍ!\n💰 رصيدك: ${balance.toLocaleString()}$`, threadID, messageID);

    api.setMessageReaction("🎰", messageID, () => {}, true);
    const isWin = Math.random() > 0.5;

    if (isWin) {
      const newBal = await db.addMoney(senderID, bet);
      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(
        `${header}\n\n✨ 𝗪𝗜𝗡𝗡𝗘𝗥\n✅ مبروك! لقد ابتسم لك الحظ.\n\n💰 الربح: +${bet.toLocaleString()}$\n🏦 الرصيد: ${newBal.toLocaleString()}$`,
        threadID, messageID
      );
    }

    const r = await db.removeMoney(senderID, bet);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(
      `${header}\n\n💥 𝗟𝗢𝗦𝗘𝗥\n❌ الحظ لم يكن بجانبك.\n\n🗑️ الخسارة: -${bet.toLocaleString()}$\n🏦 الرصيد: ${(r.balance || balance - bet).toLocaleString()}$`,
      threadID, messageID
    );

  } catch(e) {
    api.sendMessage("❌ خطأ في العملية.", threadID, messageID);
  }
};
