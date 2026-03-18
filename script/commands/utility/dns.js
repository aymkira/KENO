const dns = require('dns').promises;

module.exports.config = {
  name: 'dns', aliases: ['nslookup', 'domain'],
  version: '1.0', credits: 'ayman',
  commandCategory: 'utility',
  description: 'معلومات DNS لأي دومين',
  usage: '.dns [الدومين]', cooldown: 5,
  };

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const domain = args[0]?.replace(/https?:\/\//,'').split('/')[0];

  if (!domain) return api.sendMessage(
`╔═══════════════════╗
║   🌐 بحث DNS      ║
╚═══════════════════╝

📝 الاستخدام: .dns [الدومين]

أمثلة:
  • .dns google.com
  • .dns facebook.com`, threadID, messageID);

  const wait = await api.sendMessage(`🔍 جاري البحث عن ${domain}...`, threadID);
  try {
    const [a, aaaa, mx, ns, txt, cname] = await Promise.allSettled([
      dns.resolve4(domain),
      dns.resolve6(domain),
      dns.resolveMx(domain),
      dns.resolveNs(domain),
      dns.resolveTxt(domain),
      dns.resolveCname(domain),
    ]);

    const get = r => r.status === 'fulfilled' ? r.value : null;

    const aRecords    = get(a)?.slice(0,4).join(', ')     || '—';
    const aaaaRecords = get(aaaa)?.slice(0,2).join(', ')  || '—';
    const mxRecords   = get(mx)?.slice(0,3).map(m=>`${m.exchange} (${m.priority})`).join(', ') || '—';
    const nsRecords   = get(ns)?.slice(0,4).join(', ')    || '—';
    const txtRecords  = get(txt)?.slice(0,2).map(t=>t.join('')).join('\n    ') || '—';
    const cnameRecord = get(cname)?.join(', ')            || '—';

    api.unsendMessage(wait.messageID);
    return api.sendMessage(
`╔═══════════════════╗
║   🌐 نتائج DNS    ║
╚═══════════════════╝

🔍 الدومين: ${domain}

━━━━━━━━━━━━━━━━━━━━
📍 A    (IPv4): ${aRecords}
📍 AAAA (IPv6): ${aaaaRecords}
📧 MX  (بريد): ${mxRecords}
🌐 NS  (خوادم): ${nsRecords}
🔄 CNAME:      ${cnameRecord}
📄 TXT:        ${txtRecords.slice(0,100)}

━━━━━━━━━━━━━━━━━━━━
🕐 ${new Date().toLocaleString('ar')}`, threadID, messageID);
  } catch (e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ فشل البحث: ${e.message}`, threadID, messageID);
  }
};
