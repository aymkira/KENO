module.exports.config = {
  name: "ابتايم",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "عرض حالة البوت مع صورة الموقع",
  commandCategory: "developer",
  cooldowns: 5
};

const pidusage = require("pidusage");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h}h ${m}m ${s}s`;
}

function formatBytes(bytes) {
  const sizes = ["B","KB","MB","GB"];
  if (!bytes) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

module.exports.run = async function({ api, event }) {

  const start = Date.now();
  const stat = await pidusage(process.pid);

  const uptime = formatTime(process.uptime());
  const ram = formatBytes(stat.memory);
  const ping = Date.now() - start;

  const groups = global.data.allThreadID?.length || 0;
  const users = global.data.allUserID?.length || 0;

  const url = process.env.REPL_SLUG 
  ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  : "https://keno-production-544e.up.railway.app";

  const screenshot = `https://image.thum.io/get/width/1920/crop/900/noanimate/${url}`;

  const cachePath = path.join(__dirname, "cache", `uptime_${Date.now()}.png`);

  try {

    const res = await axios.get(screenshot, {
      responseType: "arraybuffer",
      timeout: 20000
    });

    fs.ensureDirSync(path.join(__dirname, "cache"));
    fs.writeFileSync(cachePath, Buffer.from(res.data));

    const text = `
┏━━━━━━━━━━━━━━┓
        ✨ KIRA BOT ✨
┗━━━━━━━━━━━━━━┛

🌐 الموقع:
${url}

⏱️ وقت التشغيل: ${uptime}
📶 البنق: ${ping}ms
💾 استهلاك الرام: ${ram}

👥 المستخدمين: ${users}
💬 المجموعات: ${groups}

━━━━━━━━━━━━━━
⚡ البوت يعمل بشكل طبيعي
━━━━━━━━━━━━━━
`;

    return api.sendMessage({
      body: text,
      attachment: fs.createReadStream(cachePath)
    }, event.threadID, () => {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }, event.messageID);

  } catch (e) {

    const text = `
✨ KIRA BOT STATUS ✨

🌐 ${url}

⏱️ Uptime: ${uptime}
📶 Ping: ${ping}ms
💾 RAM: ${ram}

⚠️ تعذر التقاط صورة للموقع
`;

    return api.sendMessage(text, event.threadID, event.messageID);

  }
};
