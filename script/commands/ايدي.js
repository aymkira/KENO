const fs = require("fs");
const request = require("request");
const { join } = require("path");

function getUserMoney(senderID) {
  const pathData = join(__dirname, 'banking', 'banking.json');
  if (fs.existsSync(pathData)) {
    const user = require(pathData);
    const userData = user.find(user => user.senderID === senderID);
    return userData ? userData.money : 0;
  } else {
    return 0;
  }
}

function getRank(exp) {
  if (exp >= 100000) return '🏆 𝑺𝒖𝒑𝒆𝒓 𝑳𝒆𝒈𝒆𝒏𝒅 🥇';
  if (exp >= 20000) return '💠 𝑴𝒂𝒔𝒕𝒆𝒓 🥈';
  if (exp >= 10000) return '👑 𝑳𝒆𝒈𝒆𝒏𝒅';
  if (exp >= 8000) return '🔥 𝑭𝒊𝒓𝒆 𝑼𝒔𝒆𝒓';
  if (exp >= 4000) return '🌠 𝑨𝒄𝒕𝒊𝒗𝒆 𝑴𝒆𝒎𝒃𝒆𝒓';
  if (exp >= 2000) return '⚔️ 𝑾𝒂𝒓𝒓𝒊𝒐𝒓';
  if (exp >= 1000) return '🎖️ 𝑮𝒐𝒐𝒅 𝑷𝒍𝒂𝒚𝒆𝒓';
  if (exp >= 800) return '🌟 𝑴𝒐𝒕𝒊𝒗𝒂𝒕𝒆𝒅';
  if (exp >= 500) return '✨ 𝑺𝒕𝒂𝒓𝒕𝒊𝒏𝒈';
  if (exp >= 300) return '👾 𝑵𝒐𝒗𝒊𝒄𝒆';
  if (exp >= 100) return '🗿 𝑰𝒏𝒂𝒄𝒕𝒊𝒗𝒆';
  return '⚰️ 𝑫𝒆𝒂𝒅';
}

function getUserGender(genderCode) {
  if (genderCode === 2) return '👦 ولد';
  if (genderCode === 1) return '👧 فتاة';
  return '🤖 غير محدد';
}

module.exports.config = {
  name: "ايدي",
  version: "1.1.1",
  hasPermssion: 0,
  credits: "ChatGPT + Ayoub",
  description: "عرض معلومات أنيقة عن المستخدم",
  commandCategory: "🎮 الالعاب",
  cooldowns: 0,
};

module.exports.run = async function ({ args, api, event, Currencies }) {
  try {
    const data = await api.getThreadInfo(event.threadID);
    const storage = [];
    for (const value of data.userInfo) {
      storage.push({ id: value.id, name: value.name });
    }

    const exp = [];
    for (const user of storage) {
      const countMess = await Currencies.getData(user.id);
      exp.push({
        name: user.name,
        exp: typeof countMess.exp == "undefined" ? 0 : countMess.exp,
        uid: user.id,
      });
    }

    exp.sort((a, b) => b.exp - a.exp);

    const userId = event.type == "message_reply" ? event.messageReply.senderID : event.senderID;
    const infoUser = exp.find(info => parseInt(info.uid) === parseInt(userId));

    const userInfo = await api.getUserInfo(userId);
    const name = userInfo[userId].name;
    const gender = getUserGender(userInfo[userId].gender);
    const moneyFromFile = getUserMoney(userId);
    const moneyFromDB = (await Currencies.getData(userId)).money || 0;
    const rank = getRank(infoUser.exp);

    const msg = `
╔════ ⸻ 💫 𝑷𝒓𝒐𝒇𝒊𝒍𝒆 💫 ⸻ ════╗
👤 الاسم: 『${name}』
🆔 معرفك: 『${userId}』
✉️ رسائلك: 『${infoUser.exp}』
🌟 التصنيف: 『${rank}』
💸 البنك: 『${moneyFromFile}💲』
💵 الكاش: 『${moneyFromDB}💵』
🚻 النوع: 『${gender}』
╚════════════════════════╝
`.trim();

    const imgPath = `${__dirname}/cache/1.png`;
    request(`https://graph.facebook.com/${userId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
      .pipe(fs.createWriteStream(imgPath))
      .on("close", () => {
        api.sendMessage(
          { body: msg, attachment: fs.createReadStream(imgPath) },
          event.threadID
        );
        // الصورة لم تُحذف (fs.unlinkSync محذوف)
      });
  } catch (error) {
    console.error("خطأ:", error.message);
    api.sendMessage(`❌ حدث خطأ أثناء جلب البيانات.`, event.threadID);
  }
};
