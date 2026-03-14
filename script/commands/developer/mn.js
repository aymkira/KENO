const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

module.exports.config = {
  name: "mn",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "ايمن",
  description: "عرض كل بيانات data.sqlite",
  commandCategory: "developer",
  usages: "mn",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const dbPath = path.join(process.cwd(), "includes", "database", "data.sqlite");
  const { threadID } = event;

  if (!fs.existsSync(dbPath)) {
    return api.sendMessage("❌ الملف data.sqlite غير موجود!", threadID);
  }

  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    const tables = ["Users", "Threads", "Currencies"]; // ضع أسماء الجداول الفعلية حسب Sequelize
    let allData = {};

    let pending = tables.length;

    tables.forEach(table => {
      db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
        if (err) {
          console.error(err);
          allData[table] = `❌ خطأ في القراءة: ${err.message}`;
        } else {
          allData[table] = rows;
        }
        pending--;
        if (pending === 0) {
          // كتابة الملف مؤقتاً للإرسال
          const tempFile = path.join(process.cwd(), "includes", "database", "mn_output.json");
          fs.writeFileSync(tempFile, JSON.stringify(allData, null, 2), "utf8");
          
          api.sendMessage({ attachment: fs.createReadStream(tempFile) }, threadID)
            .then(() => fs.unlinkSync(tempFile))
            .catch(e => console.error(e));
        }
      });
    });
  });

  db.close();
};
