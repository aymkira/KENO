module.exports.config = {
  name: "adc",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "D-Jukie + SOMI Fix",
  description: "Áp dụng code từ buildtooldev và pastebin",
  commandCategory: "المطور",
  usages: "admin",
  cooldowns: 0,
  dependencies: {
    "pastebin-api": "",
    "cheerio": "",
    "request": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const permission = ["61584059280197","61584059280197"];
  if (!permission.includes(event.senderID)) 
    return api.sendMessage("/callad có đứa định trộm mdl", event.threadID, event.messageID);

  const axios = require('axios');
  const fs = require('fs');
  const request = require('request');
  const cheerio = require('cheerio');
  const { join, resolve } = require("path");
  const { senderID, threadID, messageID, messageReply, type } = event;

  // ============== وظيفة جديدة للبحث عن الأمر الحقيقي ==============
  function findRealFile(cmdName) {
    const dir = __dirname;
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));

    for (const file of files) {
      try {
        const filePath = join(dir, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        if (fileContent.includes(`name: "${cmdName}"`) || fileContent.includes(`name:"${cmdName}"`)) {
          return file; // يرجع اسم الملف الحقيقي
        }
      } catch (e) { }
    }
    return null;
  }
  // ===============================================================

  var name = args[0];

  if (type == "message_reply") var text = messageReply.body;

  if (!text && !name)
    return api.sendMessage('Vui lòng reply link muốn áp dụng code hoặc ghi tên file để up code lên pastebin!', threadID, messageID);

  // ============== هنا نستخدم وظيفة البحث عن الأمر ==============
  if (!text && name) {
    const realFile = findRealFile(name) || `${name}.js`;

    fs.readFile(
      `${__dirname}/${realFile}`,
      "utf-8",
      async (err, data) => {
        if (err) return api.sendMessage(`الأمر '${name}' غير موجود!`, threadID, messageID);

        const { PasteClient } = require('pastebin-api')
        const client = new PasteClient("R02n6-lNPJqKQCd5VtL4bKPjuK6ARhHb");

        async function pastepin(name) {
          const url = await client.createPaste({
            code: data,
            expireDate: 'N',
            format: "javascript",
            name: name,
            publicity: 1
          });
          var id = url.split('/')[3]
          return 'https://pastebin.com/raw/' + id
        }

        var link = await pastepin(args[1] || 'noname')
        return api.sendMessage(link, threadID, messageID);
      }
    );
    return;
  }
  // ===============================================================

  var urlR = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
  var url = text.match(urlR);

  if (url[0].indexOf('pastebin') !== -1) {
    axios.get(url[0]).then(i => {
      var data = i.data

      const realFile = findRealFile(args[0]) || `${args[0]}.js`;

      fs.writeFile(
        `${__dirname}/${realFile}`,
        data,
        "utf-8",
        function (err) {
          if (err) return api.sendMessage(`حدث خطأ أثناء كتابة الأكواد في ${realFile}`, threadID, messageID);
          api.sendMessage(`تم تطبيق الكود على ${realFile}, استخدم load!`, threadID, messageID);
        }
      );
    })
  }

  if (url[0].indexOf('buildtool') !== -1 || url[0].indexOf('tinyurl.com') !== -1) {
    const options = { method: 'GET', url: messageReply.body };

    request(options, function (error, response, body) {
      if (error) return api.sendMessage('Vui lòng chỉ reply link (không chứa gì khác ngoài link)', threadID, messageID);

      const load = cheerio.load(body);
      load('.language-js').each((index, el) => {
        if (index !== 0) return;
        var code = el.children[0].data

        const realFile = findRealFile(args[0]) || `${args[0]}.js`;

        fs.writeFile(`${__dirname}/${realFile}`, code, "utf-8", function (err) {
          if (err) return api.sendMessage(`Erro ao aplicar code no "${realFile}".`, threadID, messageID);
          return api.sendMessage(`تم وضع الكود في "${realFile}" استخدم load`, threadID, messageID);
        });
      });
    });
    return;
  }

  if (url[0].indexOf('drive.google') !== -1) {
    var id = url[0].match(/[-\w]{25,}/)
    const realFile = findRealFile(args[0]) || `${args[0]}.js`;
    const path = resolve(__dirname, realFile);

    try {
      await utils.downloadFile(`https://drive.google.com/u/0/uc?id=${id}&export=download`, path);
      return api.sendMessage(`تم تطبيق الكود على "${realFile}"`, threadID, messageID);
    }
    catch (e) {
      return api.sendMessage(`حدث خطأ أثناء الكتابة على "${realFile}".`, threadID, messageID);
    }
  }
}
