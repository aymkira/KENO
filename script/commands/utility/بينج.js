const ping  = require('ping');
const axios = require('axios');

module.exports.config = {
  name: 'بينج', aliases: ['ping', 'ping_site'],
  version: '1.0', credits: 'ayman',
  commandCategory: 'utility',
  description: 'اختبار سرعة الاتصال بأي موقع',
  usage: '.بينج [الموقع]', cooldown: 5,
  };

const getStatus = avg => {
  if (avg < 0)   return '❌ لا يستجيب';
  if (avg < 50)  return '🟢 ممتاز';
  if (avg < 100) return '🟡 جيد';
  if (avg < 200) return '🟠 متوسط';
  return '🔴 بطيء';
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  let host = args[0]?.replace(/https?:\/\//,'').split('/')[0];

  if (!host) return api.sendMessage(
`╔══════════════════════╗
║   📡 اختبار Ping     ║
╚══════════════════════╝

📝 الاستخدام: .بينج [الموقع]

أمثلة:
  • .بينج google.com
  • .بينج 8.8.8.8
  • .بينج youtube.com`, threadID, messageID);

  const wait = await api.sendMessage(`📡 جاري اختبار ${host}...`, threadID);
  try {
    // ping 4 مرات
    const results = [];
    for (let i = 0; i < 4; i++) {
      const res = await ping.promise.probe(host, { timeout: 5, min_reply: 1 });
      results.push(res);
    }

    const alive   = results.filter(r => r.alive);
    const times   = alive.map(r => parseFloat(r.time)).filter(t => !isNaN(t));
    const avg     = times.length ? times.reduce((a,b)=>a+b,0)/times.length : -1;
    const minTime = times.length ? Math.min(...times) : -1;
    const maxTime = times.length ? Math.max(...times) : -1;
    const loss    = Math.round(((4 - alive.length) / 4) * 100);

    // HTTP response time
    let httpTime = '—';
    try {
      const start = Date.now();
      await axios.get(`https://${host}`, { timeout: 5000 });
      httpTime = `${Date.now() - start} ms`;
    } catch (_) {
      try {
        const start = Date.now();
        await axios.get(`http://${host}`, { timeout: 5000 });
        httpTime = `${Date.now() - start} ms`;
      } catch (_) {}
    }

    const pingLines = results.map((r, i) =>
      r.alive ? `  [${i+1}] ✅ ${r.time} ms` : `  [${i+1}] ❌ timeout`
    ).join('\n');

    api.unsendMessage(wait.messageID);
    return api.sendMessage(
`╔══════════════════════╗
║   📡 نتيجة Ping      ║
╚══════════════════════╝

🌐 الهدف: ${host}
${getStatus(avg)}

━━━━━━━━━━━━━━━━━━━━━━
📊 النتائج:
${pingLines}

━━━━━━━━━━━━━━━━━━━━━━
📈 الإحصائيات:
  • المتوسط:    ${avg >= 0 ? avg.toFixed(2)+' ms' : '—'}
  • الأسرع:     ${minTime >= 0 ? minTime+' ms' : '—'}
  • الأبطأ:     ${maxTime >= 0 ? maxTime+' ms' : '—'}
  • فقدان الحزم: ${loss}%
  • HTTP:       ${httpTime}
━━━━━━━━━━━━━━━━━━━━━━
🕐 ${new Date().toLocaleString('ar')}`, threadID, messageID);
  } catch (e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ فشل الاختبار: ${e.message}`, threadID, messageID);
  }
};
