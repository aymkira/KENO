module.exports.config = {
  name: "زوجيني",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "زواج عشوائي أو من شخص معين (بالمنشن أو الرد)",
  commandCategory: "fun",
  usages: "زوجيني [@شخص] أو بالرد",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");
  const { threadID, messageID, senderID, type, messageReply, mentions } = event;

  let id;
  let isSpecific = false; // هل تم اختيار شخص معين؟

  // ✅ الإصلاح: التحقق من المنشن أولاً، ثم الرد، ثم عشوائي
  if (mentions && Object.keys(mentions).length > 0) {
    // منشن شخص معين
    id = Object.keys(mentions)[0];
    isSpecific = true;
  } else if (type === "message_reply") {
    // رد على رسالة شخص
    id = messageReply.senderID;
    isSpecific = true;
  } else {
    // اختيار عشوائي
    let threadInfo = await api.getThreadInfo(threadID);
    let participants = threadInfo.participantIDs;
    let listID = participants.filter(ID => ID !== senderID && ID !== api.getCurrentUserID());
    
    if (listID.length === 0) {
      return api.sendMessage(
        "⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n❌ لا يوجد أعضاء كافيين في المجموعة للزواج!",
        threadID,
        messageID
      );
    }
    id = listID[Math.floor(Math.random() * listID.length)];
    isSpecific = false;
  }

  // التحقق من عدم الزواج من النفس
  if (id === senderID) {
    return api.sendMessage(
      "⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n😅 لا يمكنك الزواج من نفسك!",
      threadID,
      messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

  const path1 = path.join(cacheDir, `avt_${senderID}.png`);
  const path2 = path.join(cacheDir, `avt_${id}.png`);

  try {
    // جلب الأسماء والصور في نفس الوقت
    const [userData1, userData2] = await Promise.all([
      Users.getData(senderID),
      Users.getData(id)
    ]);

    const name1 = userData1.name;
    const name2 = userData2.name;
    const lovePercent = Math.floor(Math.random() * 101);

    // دالة جلب الصورة
    const getAvt = async (uid, savePath) => {
      const imgRes = await axios.get(
        `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(savePath, Buffer.from(imgRes.data));
    };

    await Promise.all([getAvt(senderID, path1), getAvt(id, path2)]);

    // رسائل مختلفة حسب طريقة الاختيار
    let bodyMessage;
    if (isSpecific) {
      bodyMessage = `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗠𝗔𝗥𝗥𝗜𝗔𝗚𝗘 ━━ ⌬\n\n` +
                    `💍 تم عقد القران!\n\n` +
                    `👤 الزوج الأول: ${name1}\n` +
                    `👤 الزوج الثاني: ${name2}\n\n` +
                    `❤️ نسبة التوافق: ${lovePercent}%\n` +
                    `✨ ألف مبروك للعروسين!`;
    } else {
      bodyMessage = `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗠𝗔𝗥𝗥𝗜𝗔𝗚𝗘 ━━ ⌬\n\n` +
                    `🎲 اختيار عشوائي!\n\n` +
                    `👤 الزوج الأول: ${name1}\n` +
                    `👤 الزوج الثاني: ${name2}\n\n` +
                    `❤️ نسبة التوافق: ${lovePercent}%\n` +
                    `🎊 باركوا للعروسين الجدد!`;
    }

    const msg = {
      body: bodyMessage,
      mentions: [
        { tag: name1, id: senderID },
        { tag: name2, id: id }
      ],
      attachment: [fs.createReadStream(path1), fs.createReadStream(path2)]
    };

    return api.sendMessage(msg, threadID, () => {
      // تنظيف الكاش
      if (fs.existsSync(path1)) fs.unlinkSync(path1);
      if (fs.existsSync(path2)) fs.unlinkSync(path2);
    }, messageID);

  } catch (err) {
    console.error(err);
    // في حال فشل جلب الصور
    const name2Simple = (await Users.getData(id)).name;
    const lovePercent = Math.floor(Math.random() * 101);
    
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n` +
      `🎊 مبروك الزواج!\n` +
      `💖 الشريك: ${name2Simple}\n` +
      `📊 نسبة الحب: ${lovePercent}%`,
      threadID,
      messageID
    );
  }
};
