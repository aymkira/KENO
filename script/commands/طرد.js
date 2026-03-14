const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "طرد",
  version: "1.0.2",
  hasPermission: 1,
  credits: "ChatGPT",
  description: "طرد عضو مع إهانة باسمه وصورة مضحكة",
  commandCategory: "👮‍♂️ الإدارة",
  usages: "رد على الشخص أو منشن",
  cooldowns: 3
};

const ownerID = "61584059280197"; // ضع معرفك هنا

module.exports.run = async function ({ api, event, args, Users }) {

  const { senderID, threadID, messageID, messageReply, mentions } = event;
  const threadInfo = await api.getThreadInfo(threadID);

  // التحقق من الصلاحيات
  const isAdmin = threadInfo.adminIDs.some(ad => ad.id === senderID);
  const isOwner = senderID === ownerID;

  if (!isAdmin && !isOwner) {
    return api.sendMessage("🫢 انت مش أدمن ولا مطور، ابعد عن الأمر.", threadID, messageID);
  }

  let targetID;

  if (messageReply) targetID = messageReply.senderID;
  else if (Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];
  else if (args[0]) targetID = args[0];
  else return api.sendMessage("❌ استخدم الأمر بالرد أو المنشن أو ID.", threadID, messageID);

  // منع طرد المطور
  if (targetID === ownerID) {
    return api.sendMessage("🤣 لا تفكر تطرد المطور يا مسكين.", threadID, messageID);
  }

  // الحصول على اسم الشخص المطرود
  const name = await Users.getNameUser(targetID);

  // رابط الصورة (يمكن تغييره)
  const imgURL = "https://i.ibb.co/7t8GZcvm/9da90c493a29.gif";
  const imgPath = __dirname + "/cache/kick_insult.jpg";

  try {
    // 🦵 تنفيذ الطرد
    await api.removeUserFromGroup(targetID, threadID);

    // تحميل الصورة
    const imgData = (await axios.get(imgURL, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(imgPath, imgData);

    // رسالة الإهانة الموجهة بالاسم
    const insult = 
`🚮✨ تم تنظيف المكان...

🤣 تخلّصنا من **${name}**
الي كان عامل نفسه مهم… وهو أصلاً معاق فكريًا!

🧹 الباب يفوت جمل يا ${name}، 
ولا ترجع لو سمحت… المجموعة صارت أرتب بدونك 😮‍💨🔥`;

    // إرسال النص والصورة
    return api.sendMessage(
      {
        body: insult,
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath)
    );

  } catch (err) {
    return api.sendMessage(
      "⚠️ فشل في الطرد! تأكد أن البوت أدمن وله الصلاحية.",
      threadID
    );
  }
};
