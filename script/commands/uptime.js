module.exports.config = {
  name: "ابتايم",
  version: "1.0",
  hasPermission: 0,
  credits: "SOMI",
  description: "لوحة حالة البوت",
  commandCategory: "بوت",
  cooldowns: 5
};

const pidusage = require("pidusage");

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h}h ${m}m ${s}s`;
}

function formatBytes(bytes) {
  const sizes = ['B','KB','MB','GB'];
  if (!bytes) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

module.exports.run = async ({ api, event }) => {
  const start = Date.now();
  const stat = await pidusage(process.pid);

  const uptime = formatTime(process.uptime());
  const ram = formatBytes(stat.memory);
  const ping = Date.now() - start;

  const groups = global.data.allThreadID?.length || 0;
  const users = global.data.allUserID?.length || 0;

  const text = `
┏━━━━━━━━━━━━━━┓
        ✨ 𝙎𝙊𝙈𝙄 𝘽𝙊𝙏 ✨
┗━━━━━━━━━━━━━━┛

⏱️ وقت التشغيل: ${uptime}
📶 البنق: ${ping}ms
💾 استهلاك الرام: ${ram}
👥 عدد المستخدمين: ${users}
💬 عدد المجموعات: ${groups}

━━━━━━━━━━━━━━
⚡ استخدم:  .اوامر  ← لعرض أوامر البوت
━━━━━━━━━━━━━━
`;

  api.sendMessage(text, event.threadID, event.messageID);
};
