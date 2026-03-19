const axios = require('axios');
const fs    = require('fs');
const path  = require('path');
const CFG   = JSON.parse(fs.readFileSync(path.join(__dirname,'../../..','config.json'),'utf8'));
const KEY   = CFG['طقس']?.OPEN_WEATHER || CFG.OPEN_WEATHER || 'c4ef85b93982d6627681b056e24bd438';

module.exports.config = {
  name: 'طقس', aliases: ['weather', 'جو'],
  version: '1.0', credits: 'ayman',
  commandCategory: 'utility',
  description: 'حالة الطقس لأي مدينة',
  usage: '.طقس [المدينة]', cooldown: 5,
  };

const windDir = d => ['شمال','شمال شرق','شرق','جنوب شرق','جنوب','جنوب غرب','غرب','شمال غرب'][Math.round(d/45)%8];
const emojiMap = c => ({'01d':'☀️','01n':'🌙','02d':'⛅','02n':'☁️','03d':'☁️','03n':'☁️','04d':'🌧️','04n':'🌧️','09d':'🌧️','09n':'🌧️','10d':'🌦️','10n':'🌧️','11d':'⛈️','11n':'⛈️','13d':'❄️','13n':'❄️','50d':'🌫️','50n':'🌫️'})[c]||'🌡️';

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const city = args.join(' ');
  if (!city) return api.sendMessage('╔═══════════════╗\n║  🌍 أمر الطقس  ║\n╚═══════════════╝\n\n📝 الاستخدام: .طقس [المدينة]\n\n مثال: .طقس بغداد', threadID, messageID);

  const wait = await api.sendMessage('🌐 جاري جلب بيانات الطقس...', threadID);
  try {
    const [cur, fore] = await Promise.all([
      axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${KEY}&units=metric&lang=ar`),
      axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${KEY}&units=metric&lang=ar&cnt=24`)
    ]);
    const d = cur.data;
    const icon = emojiMap(d.weather[0].icon);
    const sunrise = new Date(d.sys.sunrise*1000).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'});
    const sunset  = new Date(d.sys.sunset*1000).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'});

    // توقع 3 أيام
    const days = {};
    fore.data.list.forEach(f => {
      const day = new Date(f.dt*1000).toLocaleDateString('ar',{weekday:'short'});
      if (!days[day]) days[day] = { min:f.main.temp_min, max:f.main.temp_max, desc:f.weather[0].description, icon:f.weather[0].icon };
      else { days[day].min = Math.min(days[day].min, f.main.temp_min); days[day].max = Math.max(days[day].max, f.main.temp_max); }
    });
    const forecastLines = Object.entries(days).slice(1,4).map(([day,v]) => `  ${emojiMap(v.icon)} ${day}: ${Math.round(v.min)}° ↔ ${Math.round(v.max)}°`).join('\n');

    api.unsendMessage(wait.messageID);
    return api.sendMessage(
`╔══════════════════════════════╗
║   ${icon} الطقس — ${d.name}, ${d.sys.country}
╚══════════════════════════════╝

🌡️ الحرارة:    ${Math.round(d.main.temp)}°C  (يحس ${Math.round(d.main.feels_like)}°C)
📊 نطاق اليوم: ${Math.round(d.main.temp_min)}° ↔ ${Math.round(d.main.temp_max)}°
💧 الرطوبة:    ${d.main.humidity}%
🌬️ الرياح:     ${d.wind.speed} م/ث ${windDir(d.wind.deg)}
👁️ الرؤية:     ${(d.visibility/1000).toFixed(1)} كم
🌫️ الضغط:     ${d.main.pressure} hPa
☁️ الغيوم:     ${d.clouds.all}%
🌅 الشروق:    ${sunrise}
🌇 الغروب:    ${sunset}

📋 الحالة: ${d.weather[0].description}

📅 توقعات الأيام القادمة:
${forecastLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 ${new Date().toLocaleString('ar')}`, threadID, messageID);
  } catch (e) {
    api.unsendMessage(wait.messageID);
    const msg = e.response?.status === 404 ? `❌ مدينة "${city}" غير موجودة` : `❌ خطأ: ${e.message}`;
    return api.sendMessage(msg, threadID, messageID);
  }
};
