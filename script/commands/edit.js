const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "وين",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SOMI",
  description: "البحث عن مكان أي أمر داخل ملفات البوت",
  usages: "وين [اسم الأمر]",
  commandCategory: "النظام"
};

module.exports.run = async ({ api, event, args }) => {
  const commandName = args.join(" ").trim();

  if (!commandName)
    return api.sendMessage("اكتب اسم الأمر اللي تريد تبحث عنه.\nمثال: وين زوجني", event.threadID, event.messageID);

  const baseDir = path.join(__dirname, ".."); // modules/commands
  let found = false;
  let resultMessage = "";

  function searchFolder(folderPath) {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        searchFolder(fullPath);
      } else if (file.endsWith(".js")) {
        try {
          const fileData = require(fullPath);

          if (fileData.config && fileData.config.name === commandName) {
            found = true;

            resultMessage =
              `✔️ تم العثور على الأمر!\n\n` +
              `📌 اسم الأمر: ${commandName}\n` +
              `📁 الملف: ${file}\n` +
              `📂 المجلد: ${path.dirname(fullPath)}\n` +
              `🛠️ المسار الكامل:\n${fullPath}\n` +
              `\n🔥 الأمر جاهز ويعمل بشكل طبيعي.`;

          }
        } catch (e) {
          // تجاهل الملفات التي فيها أخطاء
        }
      }
    }
  }

  searchFolder(baseDir);

  if (!found) {
    resultMessage =
      `❌ ما لقيت الأمر "${commandName}" نهائيًا.\n` +
      `🔍 تأكد من الاسم أو شوف لو الملف ناقص.`;
  }

  return api.sendMessage(resultMessage, event.threadID, event.messageID);
};
