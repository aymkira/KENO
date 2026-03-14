const fs = require("fs-extra");

module.exports.config = {
  name: "بوت",
  version: "1.0.0",
  hasPermssion: 2, // للمطور (أيمن) فقط
  credits: "أيمن",
  description: "تشغيل أو إيقاف استجابة البوت للعامة عبر وضع المطور",
  commandCategory: "الـمطـور",
  usages: "اون / اوف",
  cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const pathConfig = __dirname + "/../../../config.json"; 
  
  // قراءة الملف
  let config = JSON.parse(fs.readFileSync(pathConfig, "utf-8"));

  if (args[0] == "اون") {
    config.DeveloperMode = false; // إيقاف وضع المطور = البوت يعمل للجميع
    fs.writeFileSync(pathConfig, JSON.stringify(config, null, "\t"));
    return api.sendMessage("✅ تم تشغيل البوت! (البوت الآن يستجيب للجميع كالمعتاد).", threadID, messageID);
  } 
  
  else if (args[0] == "اوف") {
    config.DeveloperMode = true; // تفعيل وضع المطور = البوت يتجاهل العامة
    fs.writeFileSync(pathConfig, JSON.stringify(config, null, "\t"));
    return api.sendMessage("🛑 تم إيقاف البوت! (البوت الآن في وضع المطور ولن يستجيب إلا لك).", threadID, messageID);
  } 
  
  else {
    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\nالوضع الحالي: ${config.DeveloperMode ? "مُعطّل (اوف)" : "يعمل (اون)"}\nاستخدم:\n.بوت اون\n.بوت اوف`, threadID, messageID);
  }
};
