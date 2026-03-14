module.exports.config = {
  name: "ابتايم",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "عرض وقت تشغيل البوت",
  commandCategory: "developer",
  cooldowns: 5
};

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h}h ${m}m ${s}s`;
}

module.exports.run = async function({ api, event }) {

  const uptime = formatTime(process.uptime());
  const ping = Date.now() - event.timestamp;

  const groups = global.data.allThreadID?.length || 0;
  const users = global.data.allUserID?.length || 0;

  const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

  const text = `
┏━━━━━━━━━━━━━━┓
      ✨ KIRA BOT ✨
┗━━━━━━━━━━━━━━┛

⏱️ وقت التشغيل: ${uptime}
📶 البنق: ${ping}ms
💾 استهلاك الرام: ${ram} MB
👥 المستخدمين: ${users}
💬 المجموعات: ${groups}

⚡ البوت يعمل
`;

  return api.sendMessage(text, event.threadID, event.messageID);
};
