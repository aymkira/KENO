const axios = require("axios");

// ── جدول السور ──────────────────────────────────────────────
const surahNames = {
  1:"الفاتحة",2:"البقرة",3:"آل عمران",4:"النساء",5:"المائدة",
  6:"الأنعام",7:"الأعراف",8:"الأنفال",9:"التوبة",10:"يونس",
  11:"هود",12:"يوسف",13:"الرعد",14:"إبراهيم",15:"الحجر",
  16:"النحل",17:"الإسراء",18:"الكهف",19:"مريم",20:"طه",
  21:"الأنبياء",22:"الحج",23:"المؤمنون",24:"النور",25:"الفرقان",
  26:"الشعراء",27:"النمل",28:"القصص",29:"العنكبوت",30:"الروم",
  31:"لقمان",32:"السجدة",33:"الأحزاب",34:"سبأ",35:"فاطر",
  36:"يس",37:"الصافات",38:"ص",39:"الزمر",40:"غافر",
  41:"فصلت",42:"الشورى",43:"الزخرف",44:"الدخان",45:"الجاثية",
  46:"الأحقاف",47:"محمد",48:"الفتح",49:"الحجرات",50:"ق",
  51:"الذاريات",52:"الطور",53:"النجم",54:"القمر",55:"الرحمن",
  56:"الواقعة",57:"الحديد",58:"المجادلة",59:"الحشر",60:"الممتحنة",
  61:"الصف",62:"الجمعة",63:"المنافقون",64:"التغابن",65:"الطلاق",
  66:"التحريم",67:"الملك",68:"القلم",69:"الحاقة",70:"المعارج",
  71:"نوح",72:"الجن",73:"المزمل",74:"المدثر",75:"القيامة",
  76:"الإنسان",77:"المرسلات",78:"النبأ",79:"النازعات",80:"عبس",
  81:"التكوير",82:"الانفطار",83:"المطففين",84:"الانشقاق",85:"البروج",
  86:"الطارق",87:"الأعلى",88:"الغاشية",89:"الفجر",90:"البلد",
  91:"الشمس",92:"الليل",93:"الضحى",94:"الشرح",95:"التين",
  96:"العلق",97:"القدر",98:"البينة",99:"الزلزلة",100:"العاديات",
  101:"القارعة",102:"التكاثر",103:"العصر",104:"الهمزة",105:"الفيل",
  106:"قريش",107:"الماعون",108:"الكوثر",109:"الكافرون",110:"النصر",
  111:"المسد",112:"الإخلاص",113:"الفلق",114:"الناس"
};

// إيجاد رقم السورة من الاسم أو الرقم
function getSurahNum(input) {
  input = input.trim();
  if (!isNaN(input)) {
    const n = parseInt(input);
    return n >= 1 && n <= 114 ? n : null;
  }
  for (const [num, name] of Object.entries(surahNames)) {
    if (name === input || name.includes(input)) return parseInt(num);
  }
  return null;
}

// ── Timer للإرسال التلقائي ──────────────────────────────────
const autoQuranTimers = new Map(); // threadID -> timer

function startAutoQuran(api, threadID) {
  if (autoQuranTimers.has(threadID)) return false; // شغال مسبقاً

  async function sendRandomAyah() {
    try {
      const surah = Math.floor(Math.random() * 114) + 1;
      const res = await axios.get(`https://api.alquran.cloud/v1/surah/${surah}/ar.alafasy`);
      const ayahs = res.data.data.ayahs;
      const ayah = ayahs[Math.floor(Math.random() * ayahs.length)];
      const surahName = surahNames[surah];

      // مدة الصوت بين 1-2 دقيقة: نختار آية قصيرة (نص أقل من 100 حرف)
      const shortAyahs = ayahs.filter(a => a.text.length < 100);
      const chosen = shortAyahs.length > 0
        ? shortAyahs[Math.floor(Math.random() * shortAyahs.length)]
        : ayah;

      const msg = `🕌 ﷽\n\n📖 سورة ${surahName} — آية ${chosen.numberInSurah}\n\n${chosen.text}`;
      api.sendMessage(msg, threadID);

      // الوقت التالي: 2-3 ساعات بالمللي ثانية
      const nextTime = (2 + Math.random()) * 60 * 60 * 1000;
      const t = setTimeout(sendRandomAyah, nextTime);
      autoQuranTimers.set(threadID, t);
    } catch (e) {
      const t = setTimeout(sendRandomAyah, 2 * 60 * 60 * 1000);
      autoQuranTimers.set(threadID, t);
    }
  }

  // أرسل أول آية فوراً ثم ابدأ الدورة
  sendRandomAyah();
  return true;
}

function stopAutoQuran(threadID) {
  if (!autoQuranTimers.has(threadID)) return false;
  clearTimeout(autoQuranTimers.get(threadID));
  autoQuranTimers.delete(threadID);
  return true;
}

// ── الأمر ──────────────────────────────────────────────────
module.exports.config = {
  name: "قران",
  aliases: ["quran"],
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ST + Arabic",
  description: "قرآن كريم مع إرسال تلقائي",
  commandCategory: "islam",
  usages: "[رقم السورة / اسمها] | auto | stop | list",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const input = args[0]?.toLowerCase();

  // ── list ──────────────────────────────────────────────────
  if (!input || input === "list") {
    let list = "📖 السور (1-114):\n\n";
    for (let i = 1; i <= 114; i++) {
      list += `${i}. ${surahNames[i]}\n`;
      if (list.length > 1800) {
        await api.sendMessage(list, threadID);
        list = "";
      }
    }
    if (list) api.sendMessage(list, threadID, messageID);
    return;
  }

  // ── auto ──────────────────────────────────────────────────
  if (input === "auto") {
    const started = startAutoQuran(api, threadID);
    return api.sendMessage(
      started
        ? "✅ تم تفعيل الإرسال التلقائي للقرآن\n⏰ كل 2-3 ساعات\n📻 مدة الآية: 1-2 دقيقة"
        : "⚠️ الإرسال التلقائي شغال مسبقاً!",
      threadID, messageID
    );
  }

  // ── stop ──────────────────────────────────────────────────
  if (input === "stop") {
    const stopped = stopAutoQuran(threadID);
    return api.sendMessage(
      stopped ? "🛑 تم إيقاف الإرسال التلقائي" : "⚠️ الإرسال التلقائي مو شغال",
      threadID, messageID
    );
  }

  // ── سورة محددة ────────────────────────────────────────────
  const surahNum = getSurahNum(args[0]);
  if (!surahNum) {
    return api.sendMessage(
      "❌ سورة غير موجودة\nاستخدم رقم (1-114) أو اسم السورة\nمثال: .قران 36 أو .قران يس",
      threadID, messageID
    );
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    const res = await axios.get(`https://api.alquran.cloud/v1/surah/${surahNum}/ar.alafasy`);
    const data = res.data.data;

    let msg = `📖 سورة ${surahNames[surahNum]} (${data.numberOfAyahs} آية)\n${"─".repeat(30)}\n\n`;

    for (const ayah of data.ayahs) {
      msg += `${ayah.numberInSurah}. ${ayah.text}\n\n`;
      if (msg.length > 1800) {
        await api.sendMessage(msg, threadID);
        msg = "";
      }
    }

    if (msg) api.sendMessage(msg, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);

  } catch (err) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("❌ خطأ في جلب السورة، حاول لاحقاً", threadID, messageID);
  }
};
