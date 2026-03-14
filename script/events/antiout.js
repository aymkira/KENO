const fs = require("fs");
const axios = require("axios");

module.exports.config = {
  name: "تحكم_الجروب",
  eventType: ["log:subscribe", "log:unsubscribe"],
  version: "5.0",
  credits: "ChatGPT",
  description: "ترحيب واضافة وطرد ورجوع تلقائي برسائل فخمة وصور"
};

module.exports.run = async ({ api, event, Users, Threads }) => {
  const threadID = event.threadID;
  const threadInfo = await api.getThreadInfo(threadID);
  const groupName = threadInfo.threadName || "المجموعة";

  // ══════════ عند الإضافة ══════════
  if (event.logMessageType === "log:subscribe") {
    const addedIDs = event.logMessageData.addedParticipants;

    for (const user of addedIDs) {
      const userID = user.userFbId;
      const name = global.data.userName.get(userID) || (await Users.getNameUser(userID));

      // صورة البروفايل الرسمية من فيسبوك
      const avatarURL = `https://graph.facebook.com/${userID}/picture?width=800&height=800&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const imgPath = __dirname + `/welcome_${userID}.png`;

      try {
        const imgData = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(imgPath, Buffer.from(imgData));

        api.sendMessage(
          {
            body:
              `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 ━━ ⌬\n\n` +
              `🌸 أهلاً ${name} 🌸\n` +
              `✨ نوّرت ${groupName}\n` +
              `📌 اقرأ القوانين واستمتع 🔥`,
            attachment: fs.createReadStream(imgPath)
          },
          threadID,
          () => { try { fs.unlinkSync(imgPath); } catch (_) {} }
        );
      } catch (e) {
        // fallback بدون صورة
        api.sendMessage(
          `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 ━━ ⌬\n\n🌸 أهلاً ${name}\n✨ نوّرت ${groupName} 🔥`,
          threadID
        );
      }
    }
    return;
  }

  // ══════════ عند المغادرة ══════════
  if (event.logMessageType === "log:unsubscribe") {
    const leftUser = event.logMessageData.leftParticipantFbId;
    const name = global.data.userName.get(leftUser) || (await Users.getNameUser(leftUser));

    // صورة البروفايل
    const avatarURL = `https://graph.facebook.com/${leftUser}/picture?width=800&height=800&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const avatarPath = __dirname + `/left_${leftUser}.png`;

    try {
      const imgData = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(avatarPath, Buffer.from(imgData));
    } catch (_) {}

    // طلع لوحده → نرجّعه
    if (event.author == leftUser) {
      api.addUserToGroup(leftUser, threadID, async (err) => {
        if (err) {
          return api.sendMessage(
            `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n🚪 ${name} فرّ كالجبان 😂`,
            threadID
          );
        }
        const msgs = [
          `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n😂 وين تروح يا ${name}؟\n🔒 ما في مفر من هنا!`,
          `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n🤣 ${name} فكّر يهرب!\nلا تهرب مرة ثانية يا ضيّع`,
          `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n😏 ${name} جان يطق\nرجّعناك قسراً 🔗`
        ];
        api.sendMessage(msgs[Math.floor(Math.random() * msgs.length)], threadID);
      });

      try { fs.unlinkSync(avatarPath); } catch (_) {}
      return;
    }

    // تم طرده → صورة GIF من giphy
    const kickGif = "https://media.giphy.com/media/KRxcgvd5fLiWk/giphy.gif";
    const gifPath = __dirname + `/kick_${leftUser}.gif`;

    const kickMsgs = [
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗞𝗜𝗖𝗞 ━━ ⌬\n\n🗑️ تم التخلص من ${name}\nكان زي البعوضة بالضبط 🦟`,
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗞𝗜𝗖𝗞 ━━ ⌬\n\n😂 باي باي ${name}!\nما راح يفوتنا شي 🚮`,
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗞𝗜𝗖𝗞 ━━ ⌬\n\n🦶 ${name} اتطرد\nالجروب صار أنظف 🧹`,
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗞𝗜𝗖𝗞 ━━ ⌬\n\n💀 ${name} مات رسمياً\nعزاءنا لعيلته 😂`,
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗞𝗜𝗖𝗞 ━━ ⌬\n\n🤣 ${name} ودّعناه\nما كان يستاهل الهواء اللي يشمه`
    ];
    const kickMsg = kickMsgs[Math.floor(Math.random() * kickMsgs.length)];

    try {
      const gifData = (await axios.get(kickGif, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(gifPath, Buffer.from(gifData));

      // نرسل صورة البروفايل + GIF
      const attachments = [];
      if (fs.existsSync(avatarPath)) attachments.push(fs.createReadStream(avatarPath));
      attachments.push(fs.createReadStream(gifPath));

      api.sendMessage(
        { body: kickMsg, attachment: attachments },
        threadID,
        () => {
          try { fs.unlinkSync(gifPath); } catch (_) {}
          try { fs.unlinkSync(avatarPath); } catch (_) {}
        }
      );
    } catch (_) {
      api.sendMessage(kickMsg, threadID);
      try { fs.unlinkSync(avatarPath); } catch (_) {}
    }
  }
};
