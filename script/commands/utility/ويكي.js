const wtf = require('wtf_wikipedia');

module.exports.config = {
  name: 'ويكي', aliases: ['wiki', 'wikipedia', 'معلومة'],
  version: '1.0', credits: 'ayman',
  commandCategory: 'utility',
  description: 'بحث في ويكيبيديا',
  usage: '.ويكي [موضوع]', cooldown: 5,
  };

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const query = args.join(' ');
  if (!query) return api.sendMessage('╔══════════════════╗\n║  📚 ويكيبيديا    ║\n╚══════════════════╝\n\n📝 الاستخدام: .ويكي [موضوع]\n\nمثال: .ويكي برمجة', threadID, messageID);

  const wait = await api.sendMessage('📚 جاري البحث في ويكيبيديا...', threadID);
  try {
    // بحث بالعربي أولاً ثم الإنجليزي
    let doc = await wtf.fetch(query, 'ar');
    let lang = 'ar';
    if (!doc || !doc.text()) {
      doc  = await wtf.fetch(query, 'en');
      lang = 'en';
    }
    if (!doc) throw new Error('not_found');

    const title    = doc.title() || query;
    const sections = doc.sections();
    const intro    = sections[0]?.paragraphs()?.[0]?.text() || '';
    const summary  = intro.slice(0, 800) + (intro.length > 800 ? '...' : '');

    // معلومات إضافية
    const categories = doc.categories()?.slice(0, 5).join(' | ') || '—';
    const links      = doc.links()?.slice(0, 5).map(l => l.page || l).join(', ') || '—';
    const sectTitles = sections.slice(1, 6).map(s => s.title()).filter(Boolean).join(' | ') || '—';

    api.unsendMessage(wait.messageID);
    return api.sendMessage(
`╔══════════════════════════════╗
║   📚 ${title.slice(0,25)}
╚══════════════════════════════╝

${summary || 'لا يوجد ملخص'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 الأقسام: ${sectTitles}
🏷️ التصنيفات: ${categories}
🔗 روابط ذات صلة: ${links}
🌐 اللغة: ${lang === 'ar' ? 'عربي' : 'إنجليزي'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 en.wikipedia.org/wiki/${encodeURIComponent(title)}`, threadID, messageID);
  } catch (e) {
    api.unsendMessage(wait.messageID);
    const msg = e.message === 'not_found' ? `❌ ما لقيت معلومات عن "${query}"` : `❌ خطأ: ${e.message}`;
    return api.sendMessage(msg, threadID, messageID);
  }
};
