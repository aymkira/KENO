module.exports.config = {
  name: "برجي",
  version: "2.0",
  hasPermssion: 0,
  credits: "You + fixed by SOMI",
  description: "لعبة الأبراج — اختيار رقم أو تاريخ ميلاد",
  commandCategory: "ألعاب",
  usages: "",
  cooldowns: 3
};

const ZODIACS = [
  { id:1, name:"الحمل",  color:"#FF6B6B", range:[[21,3],[19,4]] },
  { id:2, name:"الثور",  color:"#FFD93D", range:[[20,4],[20,5]] },
  { id:3, name:"الجوزاء",color:"#6BCB77", range:[[21,5],[20,6]] },
  { id:4, name:"السرطان",color:"#4D96FF", range:[[21,6],[22,7]] },
  { id:5, name:"الأسد",  color:"#FF9F1C", range:[[23,7],[22,8]] },
  { id:6, name:"العذراء",color:"#6A4C93", range:[[23,8],[22,9]] },
  { id:7, name:"الميزان",color:"#FF6B6B", range:[[23,9],[22,10]] },
  { id:8, name:"العقرب",color:"#FF3C38", range:[[23,10],[21,11]] },
  { id:9, name:"القوس", color:"#00B4D8", range:[[22,11],[21,12]] },
  { id:10,name:"الجدي", color:"#8338EC", range:[[22,12],[19,1]] },
  { id:11,name:"الدلو", color:"#3A86FF", range:[[20,1],[18,2]] },
  { id:12,name:"الحوت", color:"#2EC4B6", range:[[19,2],[20,3]] }
];

const MOODS = ["محظوظ", "قلق", "مبتهج", "معقد", "مزاجي", "كسول"];

function getZodiacByDate(day, month) {
  for (const z of ZODIACS) {
    const [[sd, sm], [ed, em]] = z.range;
    if ((month === sm && day >= sd) || (month === em && day <= ed)) return z;
  }
  return null;
}

module.exports.run = async function ({ api, event, Users }) {
  const { threadID, messageID, senderID } = event;
  const userName = await Users.getNameUser(senderID) || "مستخدم";

  // إرسال القائمة
  let menu = "✨ أهلاً بك في لعبة الأبراج الخرافية\n";
  menu += "اختر رقم برجك أو أرسل تاريخ ميلادك 🔮\n\n";
  ZODIACS.forEach(z => menu += `${z.id}. ${z.name}\n`);

  return api.sendMessage(menu, threadID, (err, msg) => {
    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID: msg.messageID,
      author: senderID,
      type: "choose"
    });
  }, messageID);
};


// 📌 هنا النظام الحقيقي اللي يعالج رد المستخدم
module.exports.handleReply = async function ({ api, event, handleReply, Users }) {
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const path = require("path");
  const { createCanvas, loadImage } = require("canvas");

  if (event.senderID != handleReply.author) return;

  const { threadID, messageID, body, senderID } = event;
  const text = body.trim();
  const userName = await Users.getNameUser(senderID) || "مستخدم";

  let zodiac = null;

  // اختيار رقم
  if (/^\d{1,2}$/.test(text)) {
    zodiac = ZODIACS.find(z => z.id === parseInt(text));
  }

  // تاريخ ميلاد
  else if (/^\d{1,2}[-/]\d{1,2}$/.test(text)) {
    const [d, m] = text.split(/[-/]/).map(Number);
    zodiac = getZodiacByDate(d, m);
  }

  if (!zodiac)
    return api.sendMessage("❌ إدخال غير صحيح… أرسل رقم 1–12 أو تاريخ مثل 15-9", threadID);

  // حذف قائمة الاختيارات
  api.unsendMessage(handleReply.messageID);

  // تجهيز الصورة
  const cache = path.join(__dirname, `/cache/zodiac_${senderID}.png`);
  const avatar = path.join(__dirname, `/cache/avt_${senderID}.png`);

  // جلب صورة البروفايل — محاولتين
  const tokens = [
    "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662",
    "1799872890|dummy_backup_token"
  ];
  let avatarImg = null;

  for (let tk of tokens) {
    try {
      const get = await axios.get(
        `https://graph.facebook.com/${senderID}/picture?height=720&width=720&access_token=${tk}`,
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(avatar, get.data);
      avatarImg = await loadImage(avatar);
      break;
    } catch (e) { continue; }
  }

  // إنشاء البطاقة
  const width = 1200, height = 675;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // خلفية
  const grad = ctx.createLinearGradient(0,0,width,height);
  grad.addColorStop(0, "#0f0f0f");
  grad.addColorStop(1, zodiac.color);
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,width,height);

  // عنوان
  ctx.fillStyle = "#FFD166";
  ctx.font = "bold 54px Arial";
  ctx.textAlign = "center";
  ctx.fillText("بطاقة سومي للأبراج", width / 2, 90);

  // اسم المستخدم
  ctx.fillStyle = "#fff";
  ctx.font = "bold 36px Arial";
  ctx.fillText(`المستخدم: ${userName}`, width / 2, 170);

  // البرج
  ctx.font = "bold 42px Arial";
  ctx.fillText(`برج ${zodiac.name}`, width / 2, 240);

  // صورة بروفايل دائرية
  if (avatarImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(150 + 110, 360, 110, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, 150, 250, 220, 220);
    ctx.restore();
  }

  // نسبة الحظ
  const luck = Math.floor(Math.random() * 101);
  const mood = MOODS[Math.floor(Math.random() * MOODS.length)];

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(400, 430, 600, 35);

  ctx.fillStyle = luck >= 50 ? "#16a34a" : "#f97316";
  ctx.fillRect(400, 430, 600 * (luck / 100), 35);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`نسبة الحظ: ${luck}% — ${mood}`, 700, 460);

  fs.writeFileSync(cache, canvas.toBuffer());

  return api.sendMessage({
    body: `🔮 برجك: ${zodiac.name}`,
    attachment: fs.createReadStream(cache)
  }, threadID, () => {
    fs.unlinkSync(cache);
    if (fs.existsSync(avatar)) fs.unlinkSync(avatar);
  });
};
