const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "داتا",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "ايمن",
  description: "رفع الملفات للجروب المربوط بدون عبارات",
  commandCategory: "developer",
  usages: "داتا",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const DB_THREAD_ID = "1438595104475963"; // الجروب المربوط
  const dbPath = path.join(process.cwd(), "includes", "database");
  const files = ["threads.json", "users.json", "currencies.json"];

  try {
    let attachments = [];

    // التأكد من كتابة البيانات من الذاكرة للملفات قبل الرفع
    if (global.data) {
      if (global.data.allThreadID) fs.writeJsonSync(path.join(dbPath, "threads.json"), global.data.allThreadID, { spaces: 2 });
      if (global.data.allUserID) fs.writeJsonSync(path.join(dbPath, "users.json"), global.data.allUserID, { spaces: 2 });
      if (global.data.allCurrenciesID) fs.writeJsonSync(path.join(dbPath, "currencies.json"), global.data.allCurrenciesID, { spaces: 2 });
    }

    // تجهيز الملفات كـ Streams للرفع
    for (let file of files) {
      let filePath = path.join(dbPath, file);
      if (fs.existsSync(filePath)) {
        attachments.push(fs.createReadStream(filePath));
      }
    }

    if (attachments.length === 0) return;

    // إرسال الملفات فقط بدون أي نص كما طلبت
    await api.sendMessage({
      attachment: attachments
    }, DB_THREAD_ID);

    // تفاعل بسيط على رسالة المطور لتأكيد النجاح بصمت
    api.setMessageReaction("✅", event.messageID, () => {}, true);

  } catch (e) {
    console.log("❌ خطأ في رفع الداتا: " + e.message);
    api.sendMessage("❌ فشل الرفع للجروب.", event.threadID);
  }
};
