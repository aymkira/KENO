const geoip  = require('geoip-lite');
const axios  = require('axios');

module.exports.config = {
  name: 'ip', aliases: ['معلومات_ip', 'ipinfo'],
  version: '1.0', credits: 'ayman',
  commandCategory: 'utility',
  description: 'معلومات تفصيلية عن عنوان IP',
  usage: '.ip [العنوان]', cooldown: 5,
  };

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const ipInput = args[0];

  if (!ipInput) return api.sendMessage(
`╔══════════════════════╗
║   🌐 معلومات IP      ║
╚══════════════════════╝

📝 الاستخدام: .ip [العنوان]

أمثلة:
  • .ip 8.8.8.8
  • .ip 1.1.1.1
  • .ip 142.250.185.78`, threadID, messageID);

  // التحقق من صحة IP
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ipInput)) return api.sendMessage('❌ عنوان IP غير صحيح', threadID, messageID);

  const wait = await api.sendMessage('🔍 جاري البحث...', threadID);
  try {
    // geoip-lite للبيانات الأساسية
    const geo = geoip.lookup(ipInput);

    // API إضافي للتفاصيل
    let extra = {};
    try {
      const res = await axios.get(`https://ipapi.co/${ipInput}/json/`, { timeout: 5000 });
      extra = res.data;
    } catch (_) {}

    if (!geo && !extra.country) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ ما لقيت معلومات عن ${ipInput}`, threadID, messageID);
    }

    const country  = extra.country_name  || geo?.country || '—';
    const region   = extra.region        || geo?.region  || '—';
    const city     = extra.city          || geo?.city    || '—';
    const timezone = extra.timezone      || geo?.timezone|| '—';
    const isp      = extra.org           || '—';
    const lat      = extra.latitude      || geo?.ll?.[0] || '—';
    const lon      = extra.longitude     || geo?.ll?.[1] || '—';
    const currency = extra.currency_name || '—';
    const calling  = extra.country_calling_code || '—';
    const lang     = extra.languages     || '—';

    api.unsendMessage(wait.messageID);
    return api.sendMessage(
`╔══════════════════════╗
║   🌐 معلومات IP      ║
╚══════════════════════╝

🔍 IP: ${ipInput}

━━━━━━━━━━━━━━━━━━━━━━
🗺️ الموقع:
  • الدولة:   ${country} ${extra.country_code ? `(${extra.country_code})` : ''}
  • المنطقة:  ${region}
  • المدينة:  ${city}
  • الإحداثيات: ${lat}, ${lon}

🌐 الشبكة:
  • مزود الخدمة: ${isp}
  • المنطقة الزمنية: ${timezone}

📱 معلومات الدولة:
  • رمز الاتصال: ${calling}
  • العملة:  ${currency}
  • اللغات:  ${lang.slice(0,30)}

━━━━━━━━━━━━━━━━━━━━━━
🗺️ الخريطة: https://maps.google.com/?q=${lat},${lon}`, threadID, messageID);
  } catch (e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
  }
};
