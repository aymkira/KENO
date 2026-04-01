const axios = require("axios");
const path  = require("path");
const fs    = require("fs-extra");

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "config.json"), "utf8")); }
  catch { return {}; }
}

module.exports.config = {
  name:            "عمري",
  version:         "2.0.0",
  hasPermssion:    0,
  credits:         "Ayman",
  description:     "حساب العمر بناءً على تاريخ الميلاد",
  commandCategory: "utility",
  usages:          "عمري YYYY-MM-DD",
  cooldowns:       5,
};

module.exports.run = async function ({ api, args, event }) {
  const { threadID, messageID } = event;
  const cfg     = loadConfig();
  const BOTNAME = cfg.BOTNAME || "البوت";

  const H = `⌬ ━━ ${BOTNAME} ━━ ⌬`;
  const F =  "⌬ ━━━━━━━━━━━━━━━ ⌬";
  const out = (msg) => api.sendMessage(`${H}\n${msg}\n${F}`, threadID, messageID);

  const birthdate = args[0];
  if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate))
    return out("⚠️ أدخل التاريخ بهذا الشكل:\nمثال: عمري 2000-05-15");

  try {
    const { data } = await axios.get(
      `https://rubish-apihub.onrender.com/rubish/agecalculator?birthdate=${encodeURIComponent(birthdate)}&apikey=rubish69`
    );

    const a   = data.ageData;
    const msg =
      `🎂 العمر: ${a.age.years} سنة، ${a.age.months} شهر، ${a.age.days} يوم\n` +
      `📅 تاريخ الميلاد: ${birthdate}\n` +
      `⏳ إجمالاً: ${a.totalAge.days} يوم — ${a.totalAge.hours} ساعة\n` +
      `🎉 عيد الميلاد: ${a.nextBirthday.dayName} (بعد ${a.nextBirthday.remainingMonths}شهر ${a.nextBirthday.remainingDays}يوم)`;

    if (typeof data.imgbbImageUrl === "string" && data.imgbbImageUrl) {
      const imgPath = path.join(process.cwd(), "cache", `age_${Date.now()}.jpg`);
      fs.ensureDirSync(path.dirname(imgPath));

      const imgRes = await axios({ url: data.imgbbImageUrl, method: "GET", responseType: "stream" });
      await new Promise((resolve, reject) => {
        const w = fs.createWriteStream(imgPath);
        imgRes.data.pipe(w);
        w.on("finish", resolve);
        w.on("error", reject);
      });

      await api.sendMessage(
        { body: `${H}\n${msg}\n${F}`, attachment: fs.createReadStream(imgPath) },
        threadID, messageID
      );
      fs.remove(imgPath).catch(() => {});
    } else {
      return out(msg);
    }
  } catch (e) {
    console.error("عمري error:", e);
    return out("❌ خطأ أثناء جلب البيانات، حاول مجدداً.");
  }
};
