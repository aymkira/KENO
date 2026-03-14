const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "فحص",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Y-ANBU",
    description: "جلب معلومات حساب فري فاير ",
    commandCategory: "خدمات",
    usages: "فري_فاير [ايدي]",
    cooldowns: 10,
  },

  async run({ args, api, event }) {
    if (args.length === 0) {
      return api.sendMessage("حط ايدي حسابك", event.threadID, event.messageID);
    }
    const playerId = args[0];
    try {
      const apiRes = await axios.get(`https://freefire-yassine3323735-1hqxh0on.leapcell.dev/freefire/${playerId}`);
      const data = apiRes.data;

      if (!data || !data["معلومات الحساب"]) {
        return api.sendMessage("لم اجد اي معلومات عن هذا حساب قد يكون مبند او ايدي غير صحيح", event.threadID, event.messageID);
      }
      const profile = data["معلومات الحساب"];
      const skins = data["صور السكّينات"];
      let msg = `👤 الاسم: ${profile["الاسم"]}\n`;
      msg += `🆔 المعرف: ${profile["المعرف"]}\n`;
      msg += `🥇 العضوية المميزة: ${profile["العضوية المميزة"]}\n`;
      msg += `🌍 المنطقة: ${profile["المنطقة"]}\n`;
      msg += `🎖️ المستوى: ${profile["المستوى"]}\n`;
      msg += `📈 الخبرة: ${profile["نقاط الخبرة"]}\n`;
      msg += `🏆 نقاط الترتيب: ${profile["نقاط الترتيب"]}\n`;
      msg += `📢 مؤثر: ${profile["مؤثر"]}\n`;
      msg += `👍 الإعجابات: ${profile["الإعجابات"]}\n`;
      msg += `🕒 آخر دخول: ${profile["آخر تسجيل دخول"]}\n`;
      msg += `📅 إنشاء الحساب: ${profile["تاريخ إنشاء الحساب"]}\n`;
      msg += `🔄 آخر تحديث: ${profile["آخر تحديث للبروفايل"]}\n\n`;

      if (skins.length > 0) {
        msg += `🎭 :عدد السكينات المجهزة ${skins.length}`;
      } else {
        msg += `🎭 لا توجد سكينات مجهزة`;
      }
      const attachments = [];
      for (let i = 0; i < skins.length; i++) {
        const url = skins[i];
        const tempFile = path.join(__dirname, `${playerId}_${i}.png`);
        const response = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(tempFile, Buffer.from(response.data, "binary"));
        attachments.push(fs.createReadStream(tempFile));
      }
      api.sendMessage(
        {
          body: msg,
          attachment: attachments,
        },
        event.threadID,
        () => {
          attachments.forEach((file) => {
            try {
              fs.unlinkSync(file.path);
            } catch (e) {}
          });
        },
        event.messageID
      );

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ حضل خطأ ", event.threadID, event.messageID);
    }
  },
};
