const si = require('systeminformation');

module.exports.config = {
  name: 'سيستم', aliases: ['system', 'server', 'stats'],
  version: '1.0', credits: 'ayman',
  commandCategory: 'utility',
  description: 'معلومات السيرفر والبوت',
  usage: '.سيستم', cooldown: 10,
  };

const formatBytes = b => {
  if (b < 1024)       return b + ' B';
  if (b < 1024**2)    return (b/1024).toFixed(1) + ' KB';
  if (b < 1024**3)    return (b/1024**2).toFixed(1) + ' MB';
  return (b/1024**3).toFixed(1) + ' GB';
};

const formatUptime = s => {
  const d = Math.floor(s/86400);
  const h = Math.floor((s%86400)/3600);
  const m = Math.floor((s%3600)/60);
  return `${d}ي ${h}س ${m}د`;
};

const getBar = (used, total, len=15) => {
  const pct  = Math.round((used/total)*len);
  const bar  = '█'.repeat(pct) + '░'.repeat(len-pct);
  return `[${bar}] ${Math.round((used/total)*100)}%`;
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;
  const wait = await api.sendMessage('⚙️ جاري جمع معلومات السيرفر...', threadID);

  try {
    const [cpu, mem, disk, os_, net, load] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.osInfo(),
      si.networkInterfaces(),
      si.currentLoad(),
    ]);

    const cpuLoad   = load.currentLoad.toFixed(1);
    const memUsed   = mem.active;
    const memTotal  = mem.total;
    const diskInfo  = disk[0] || {};
    const diskUsed  = diskInfo.used || 0;
    const diskSize  = diskInfo.size || 1;
    const netInfo   = (Array.isArray(net) ? net : [net]).find(n => !n.internal && n.ip4) || {};

    // معلومات Node.js
    const nodeUptime = process.uptime();
    const nodeMem    = process.memoryUsage();
    const nodeVer    = process.version;

    // معلومات البوت
    const botUptime  = global.client?.botStartTime
      ? Math.round((Date.now() - global.client.botStartTime) / 1000)
      : nodeUptime;

    api.unsendMessage(wait.messageID);
    return api.sendMessage(
`╔═══════════════════════════╗
║   ⚙️ معلومات السيرفر      ║
╚═══════════════════════════╝

🖥️ النظام:
  • OS:    ${os_.distro || os_.platform} ${os_.release || ''}
  • Arch:  ${os_.arch || process.arch}
  • Kernel: ${os_.kernel || '—'}

⚡ المعالج (CPU):
  • ${cpu.manufacturer} ${cpu.brand}
  • النوى: ${cpu.cores} | السرعة: ${cpu.speed} GHz
  • الحمل: ${getBar(parseFloat(cpuLoad), 100)} ${cpuLoad}%

💾 الذاكرة (RAM):
  • ${getBar(memUsed, memTotal)}
  • المستخدم: ${formatBytes(memUsed)} / ${formatBytes(memTotal)}
  • الحر:     ${formatBytes(mem.free)}

💿 القرص:
  • ${getBar(diskUsed, diskSize)}
  • المستخدم: ${formatBytes(diskUsed)} / ${formatBytes(diskSize)}
  • النوع:    ${diskInfo.type || '—'}

🌐 الشبكة:
  • IP:   ${netInfo.ip4 || '—'}
  • MAC:  ${netInfo.mac || '—'}

🤖 البوت:
  • Node.js:   ${nodeVer}
  • مدة التشغيل: ${formatUptime(Math.round(botUptime))}
  • RAM (Node): ${formatBytes(nodeMem.heapUsed)} / ${formatBytes(nodeMem.heapTotal)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 ${new Date().toLocaleString('ar')}
🤖 KIRA Bot — Made by Ayman`, threadID, messageID);
  } catch (e) {
    api.unsendMessage(wait.messageID);
    // fallback بسيط
    const mem = process.memoryUsage();
    return api.sendMessage(
`╔═══════════════════════════╗
║   ⚙️ معلومات البوت        ║
╚═══════════════════════════╝

🤖 Node.js: ${process.version}
⏱️ مدة التشغيل: ${formatUptime(Math.round(process.uptime()))}
💾 RAM: ${formatBytes(mem.heapUsed)} / ${formatBytes(mem.heapTotal)}
🕐 ${new Date().toLocaleString('ar')}`, threadID, messageID);
  }
};
