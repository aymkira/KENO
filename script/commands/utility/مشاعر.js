const Sentiment = require('sentiment');
const sentiment  = new Sentiment();

module.exports.config = {
  name: 'مشاعر', aliases: ['sentiment', 'احساس', 'شعور'],
  version: '1.0', credits: 'ayman',
  commandCategory: 'utility',
  description: 'تحليل مشاعر النص',
  usage: '.مشاعر [النص]', cooldown: 3,
  };

const getEmoji = score => {
  if (score >= 5)  return '😄 سعادة عالية';
  if (score >= 2)  return '🙂 إيجابي';
  if (score >= 0)  return '😐 محايد';
  if (score >= -2) return '😕 سلبي خفيف';
  if (score >= -5) return '😢 حزن';
  return '😡 غضب / سلبي جداً';
};

const getBar = (score, max = 10) => {
  const normalized = Math.min(Math.max(score, -max), max);
  const pos = Math.round(((normalized + max) / (max * 2)) * 20);
  const bar = '░'.repeat(20).split('');
  bar[pos] = '█';
  return `[${bar.join('')}] ${score > 0 ? '+' : ''}${score.toFixed(2)}`;
};

module.exports.run = async ({ api, event, args, event: ev }) => {
  const { threadID, messageID, messageReply } = ev;

  // يقبل رد على رسالة
  let text = args.join(' ');
  if (!text && messageReply?.body) text = messageReply.body;

  if (!text) return api.sendMessage(
`╔═══════════════════════╗
║   💭 تحليل المشاعر    ║
╚═══════════════════════╝

📝 الاستخدام:
  • .مشاعر [النص]
  • رد على رسالة + .مشاعر`, threadID, messageID);

  const result = sentiment.analyze(text);
  const { score, comparative, positive, negative, tokens } = result;

  const moodLabel  = getEmoji(score);
  const moodBar    = getBar(comparative);
  const posWords   = positive.slice(0, 5).join(', ') || 'لا يوجد';
  const negWords   = negative.slice(0, 5).join(', ') || 'لا يوجد';
  const wordCount  = tokens.length;
  const posPercent = wordCount ? Math.round((positive.length / wordCount) * 100) : 0;
  const negPercent = wordCount ? Math.round((negative.length / wordCount) * 100) : 0;

  return api.sendMessage(
`╔═══════════════════════╗
║   💭 تحليل المشاعر    ║
╚═══════════════════════╝

📝 النص: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"

━━━━━━━━━━━━━━━━━━━━━━━
🎭 النتيجة:  ${moodLabel}
📊 المقياس:  ${moodBar}
━━━━━━━━━━━━━━━━━━━━━━━
✅ إيجابيات (${posPercent}%): ${posWords}
❌ سلبيات   (${negPercent}%): ${negWords}
📦 الكلمات:  ${wordCount} كلمة
━━━━━━━━━━━━━━━━━━━━━━━
💡 الدرجة الكلية: ${score > 0 ? '+' : ''}${score}
📐 النسبية:      ${comparative > 0 ? '+' : ''}${comparative.toFixed(3)}`, threadID, messageID);
};
