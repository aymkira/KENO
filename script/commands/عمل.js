module.exports.config = {
  name: "عمل",
  version: "1.0",
  hasPermssion: 0,
  credits: "You",
  description: "جمع فلوس — يعرض 7 وظائف، المستخدم يرد برقم وتُرسل له بطاقة وظيفة منسقة",
  commandCategory: "ألعاب",
  usages: "",
  cooldowns: 5
};

module.exports.wrapText = (ctx, text, maxWidth) => {
  return new Promise(resolve => {
    if (!text) return resolve(['']);
    if (ctx.measureText(text).width < maxWidth) return resolve([text]);
    if (ctx.measureText('W').width > maxWidth) return resolve(null);
    const words = text.split(' ');
    const lines = [];
    let line = '';
    while (words.length > 0) {
      let split = false;
      while (ctx.measureText(words[0]).width >= maxWidth) {
        const temp = words[0];
        words[0] = temp.slice(0, -1);
        if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
        else {
          split = true;
          words.splice(1, 0, temp.slice(-1));
        }
      }
      if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
      else {
        lines.push(line.trim());
        line = '';
      }
      if (words.length === 0) lines.push(line.trim());
    }
    return resolve(lines);
  });
};

const JOBS = [
  { id: 1, name: "جز العشب", money: [50,100], accent: "#8B5E3C" },
  { id: 2, name: "في الدعارة", money: [200,400], accent: "#C0392B" },
  { id: 3, name: "حفر الصخور", money: [80,150], accent: "#7B8A8B" },
  { id: 4, name: "خام التعدين", money: [120,250], accent: "#6B4C3B" },
  { id: 5, name: "حقل نفط", money: [300,600], accent: "#1F2937" },
  { id: 6, name: "منطقة الخدمة", money: [40,90], accent: "#F59E0B" },
  { id: 7, name: "المجمع الصناعي", money: [500,1000], accent: "#2D6A4F" }
];

const COUNTRIES = ["مصر","السعودية","الإمارات","تركيا","المغرب","لبنان","اليمن","الأردن"];

module.exports.run = async function ({ api, event, Users, Threads }) {
  const { createCanvas, loadImage } = require("canvas");
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const path = require("path");

  try {
    // ==== مجلدات العمل ====
    const cacheDir = path.join(__dirname, "/cache/");
    const canvasDir = path.join(cacheDir, "canvas");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    if (!fs.existsSync(canvasDir)) fs.mkdirSync(canvasDir, { recursive: true });

    // من كتب الأمر
    const authorID = event.senderID;
    const authorName = await Users.getNameUser(authorID) || `User ${authorID}`;

    // نص القائمة و الصورة المصغّرة للقائمة
    // سنتولّد صورة فيها 7 أسطر مرقمة مع لمسات فنية صغيرة
    const menuImagePath = path.join(canvasDir, `work_menu_${authorID}.png`);
    // إن لم تكن الصورة موجودة - أنشئها
    if (!fs.existsSync(menuImagePath)) {
      const width = 1000, height = 700;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // خلفية داكنة مموّجة
      const grad = ctx.createLinearGradient(0,0,width,height);
      grad.addColorStop(0, "#2b2b2b");
      grad.addColorStop(1, "#1f2937");
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,width,height);

      // عنوان
      ctx.fillStyle = "#FFD166";
      ctx.font = "700 36px Arial";
      ctx.textAlign = "center";
      ctx.fillText("اختر عملك للحصول على مال سومي 💼", width/2, 70);

      // رسم مربع أبيض خفيف للخيارات
      const boxX = 50, boxY = 110, boxW = width - 100, boxH = height - 170;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      roundRect(ctx, boxX, boxY, boxW, boxH, 18, true, false);

      // لكل خيار صف
      const rowH = Math.floor((boxH - 40) / 7);
      ctx.textAlign = "start";
      for (let i=0;i<7;i++) {
        const y = boxY + 20 + i*rowH;
        // خلفية صف خفيفة متبدلة
        ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)";
        roundRect(ctx, boxX + 10, y, boxW - 20, rowH - 6, 12, true, false);

        // دائرة رقم
        ctx.fillStyle = "#FFD166";
        ctx.beginPath();
        ctx.arc(boxX + 50, y + (rowH-6)/2, 26, 0, Math.PI*2);
        ctx.fill();

        // رقم داخل الدائرة
        ctx.fillStyle = "#1f2937";
        ctx.font = "700 22px Arial";
        ctx.textAlign = "center";
        ctx.fillText(String(i+1), boxX + 50, y + (rowH-6)/2 + 8);

        // نص الوظيفة
        ctx.textAlign = "start";
        ctx.fillStyle = "#ffffff";
        ctx.font = "600 26px Arial";
        ctx.fillText(`${i+1}. ${JOBS[i].name}`, boxX + 100, y + (rowH-6)/2 + 10);

        // لمسة فنية: مستطيل صغير بلون الAccent
        ctx.fillStyle = JOBS[i].accent;
        roundRect(ctx, boxX + boxW - 170, y + (rowH-6)/2 - 18, 140, 36, 10, true, false);
        ctx.fillStyle = "#fff";
        ctx.font = "600 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText("إختر", boxX + boxW - 100, y + (rowH-6)/2 + 8);
      }

      // تعليمات سريعة أسفل
      ctx.textAlign = "center";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "16px Arial";
      ctx.fillText(`اكتب رقم الخيار هنا خلال 60 ثانية — يخصّص الرد لمستخدم: ${authorName}`, width/2, height - 30);

      const buffer = canvas.toBuffer();
      fs.writeFileSync(menuImagePath, buffer);
    }

    // إرسال القائمة وحفظ handleReply
    const body = `✨ ${authorName} — اختر عملك من القائمة المرفقة:\n\n` +
                 `1. جز العشب\n2. في الدعارة\n3. حفر الصخور\n4. خام التعدين\n5. حقل نفط\n6. منطقة الخدمة\n7. المجمع الصناعي\n\n` +
                 `رد برقم الوظيفة (مثلاً: 3). الرد يجب أن يكون من نفس المستخدم الذي كتب الأمر.`;
    api.sendMessage({ body, attachment: fs.createReadStream(menuImagePath) }, event.threadID, (err, info) => {
      if (err) return console.error(err);
      // سجل انتظار الرد — نفس نمط مشروعك: global.client.handleReply
      if (!global.client) global.client = {};
      if (!global.client.handleReply) global.client.handleReply = [];
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: authorID,
        time: Date.now(),
        type: "work_menu"
      });
    }, event.messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ حدث خطأ أثناء عرض وظائف العمل: " + (err.message || err), event.threadID);
  }
};

/*
  handleReply: يتعامل مع الردود على رسالة القائمة.
  يتأكد أن من ردّ هو صاحب الطلب، ثم ينشئ بطاقة الوظيفة المناسبة ويرسلها.
*/
module.exports.handleReply = async function ({ api, event, handleReply, Users, Threads }) {
  const { createCanvas, loadImage } = require("canvas");
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const path = require("path");

  try {
    // تحقق أن نوعنا هو work_menu وأن صاحب الرد هو نفس صاحب الطلب
    if (!handleReply || handleReply.type !== "work_menu") return;
    const author = handleReply.author;
    if (String(event.senderID) !== String(author)) {
      // ليس له: راسل ونمسح الرد السريع بعد ثانية (لو يدعم)
      await api.sendMessage("🚫 هذا الاختيار مخصّص لصاحب الأمر فقط.", event.threadID);
      return;
    }

    // الرقم المرسل
    const body = (event.body || "").trim();
    if (!body || !/^[1-7]$/.test(body)) {
      await api.sendMessage("❗ رجاءً أرسل رقم صحيح من 1 إلى 7.", event.threadID);
      return;
    }
    const choice = parseInt(body);

    // احذف رسالة القائمة (messageID من handleReply)
    try {
      if (typeof api.unsendMessage === "function") {
        await api.unsendMessage(handleReply.messageID);
      } else if (typeof api.deleteMessage === "function") {
        await api.deleteMessage(handleReply.messageID);
      }
    } catch(e) { /* ignore if not supported */ }

    // بيانات المستخدم
    const id = author;
    const name = await Users.getNameUser(id) || `User ${id}`;

    // بيانات عمل
    const job = JOBS.find(j => j.id === choice) || JOBS[0];
    const money = Math.floor(Math.random() * (job.money[1] - job.money[0] + 1)) + job.money[0];
    const place = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];

    // أحاول قراءة rank/level/percent من Users.getData (إن وُجدت)
    let rank = 'عضو', level = 1, percent = Math.min(100, Math.max(0, Math.round((money/ (job.money[1]||100))*100)));
    try {
      if (Users && typeof Users.getData === "function") {
        const data = await Users.getData(id) || {};
        if (data.rank) rank = data.rank;
        if (data.level) level = data.level;
        if (data.exp && data.nextExp) {
          const cur = Number(data.exp)||0, nxt = Number(data.nextExp)||1;
          percent = Math.min(100, Math.round((cur/nxt)*100));
        }
      }
    } catch(e) { /* ignore */ }

    // ===== تحميل صورة البروفايل بالقوة مثل أسلوب الهكر =====
    const tmpAvatarPath = path.join(__dirname, "/cache/canvas/", `${id}_work_avt.png`);
    let avatarImg = null;
    const graphToken = '6628568379%7Cc1e620fa708a1d5696fb991c1bde5662';
    const avatarUrls = [
      `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=${graphToken}`,
      `https://graph.facebook.com/${id}/picture?width=720&height=720`
    ];
    for (const u of avatarUrls) {
      try {
        const res = await axios.get(u, { responseType: 'arraybuffer', timeout: 20000 });
        await fs.writeFile(tmpAvatarPath, Buffer.from(res.data, 'binary'));
        try {
          avatarImg = await loadImage(tmpAvatarPath);
          break;
        } catch (e) {
          try { if (fs.existsSync(tmpAvatarPath)) fs.unlinkSync(tmpAvatarPath); } catch(e){}
        }
      } catch(e){}
    }
    // لو لم يتم جلب الصورة سيفضل avatarImg = null وسيُطبع بديل حرف أول الاسم.

    // ==== إنشاء بطاقة الوظيفة البنية الخاصة بالاختيار ====
    const width = 1200, height = 675;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // خلفية بنية مع لمسات ذهبية خفيفة
    const bgGrad = ctx.createLinearGradient(0,0,width,height);
    bgGrad.addColorStop(0, "#6b4c3b");
    bgGrad.addColorStop(1, "#3b2f2f");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);

    // لوحة داخلية شبه شفافة داكنة
    const innerX = 40, innerY = 40, innerW = width-80, innerH = height-80;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    roundRect(ctx, innerX, innerY, innerW, innerH, 22, true, false);

    // لوح أبيض شفاف داخلي لإبراز المحتوى
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, innerX+18, innerY+18, innerW-36, innerH-36, 16, true, false);

    // مكان الصورة الدائرية على اليسار
    const avatarSize = 260;
    const avatarX = innerX + 60, avatarY = innerY + 60;

    if (avatarImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI*2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
    } else {
      ctx.fillStyle = "#4b2e2e";
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 100px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const firstChar = (name || "?").charAt(0).toUpperCase();
      ctx.fillText(firstChar, avatarX + avatarSize/2, avatarY + avatarSize/2 + 4);
    }

    // إطار حول الصورة
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 2, 0, Math.PI*2);
    ctx.stroke();

    // المعلومات على اليمين (اسم، آي دي، وظيفة، مكان)
    const infoX = avatarX + avatarSize + 60;
    let cursorY = avatarY + 10;

    ctx.fillStyle = job.accent; // لون مميّز للوظيفة
    ctx.font = "700 28px Arial";
    ctx.textAlign = "start";
    ctx.fillText("بطاقة وظيفة", infoX, cursorY + 10);

    cursorY += 50;
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 44px Arial";
    const nameLines = await this.wrapText(ctx, name, 720);
    for (let i=0;i<nameLines.length;i++) {
      ctx.fillText(nameLines[i], infoX, cursorY + (i*52));
    }
    cursorY += nameLines.length * 52;

    cursorY += 8;
    ctx.font = "500 24px Arial";
    ctx.fillStyle = "#f3f4f6";
    ctx.fillText(`الايدي: ${id}`, infoX, cursorY + 6);

    cursorY += 34;
    ctx.fillText(`الوظيفة: ${job.name}`, infoX, cursorY + 6);

    cursorY += 34;
    ctx.fillText(`المكان: ${place}`, infoX, cursorY + 6);

    cursorY += 34;
    ctx.fillText(`الرتبة: ${rank}`, infoX, cursorY + 6);

    cursorY += 34;
    ctx.fillText(`المستوى: ${level}`, infoX, cursorY + 6);

    // المال المكتسب بمربع لامع أسفل
    const moneyBoxX = infoX, moneyBoxY = cursorY + 26, moneyBoxW = 360, moneyBoxH = 80;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, moneyBoxX, moneyBoxY, moneyBoxW, moneyBoxH, 14, true, false);

    // لون شعار المال حسب الوظيفة (تدرج)
    const moneyGrad = ctx.createLinearGradient(moneyBoxX, moneyBoxY, moneyBoxX + moneyBoxW, moneyBoxY + moneyBoxH);
    moneyGrad.addColorStop(0, job.accent);
    moneyGrad.addColorStop(1, "#111827");
    ctx.fillStyle = moneyGrad;
    roundRect(ctx, moneyBoxX + 6, moneyBoxY + 6, moneyBoxW - 12, moneyBoxH - 12, 10, true, false);

    ctx.fillStyle = "#fff";
    ctx.font = "800 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${money} $`, moneyBoxX + moneyBoxW/2, moneyBoxY + moneyBoxH/2 + 8);

    // شريط نسبة المستوى (أسفل المال)
    const barX = moneyBoxX, barY = moneyBoxY + moneyBoxH + 26, barW = 520, barH = 22;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(ctx, barX, barY, barW, barH, 12, true, false);
    const barFill = Math.max(0, Math.min(100, percent)) / 100 * barW;
    ctx.fillStyle = percent >= 50 ? "#16a34a" : "#f97316";
    roundRect(ctx, barX, barY, barFill, barH, 12, true, false);
    ctx.fillStyle = "#fff";
    ctx.font = "700 16px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`${percent}%`, barX + barW - 12, barY + barH - 4);

    // توقيع صغير
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "14px Arial";
    ctx.fillText("تم إصدار بطاقة العمل بواسطة SOMi", innerX + 30, innerY + innerH - 28);

    // حفظ البطاقة باسم فريد
    const cardPath = path.join(__dirname, "/cache/canvas/", `${id}_job_${Date.now()}.png`);
    const buffer = canvas.toBuffer();
    fs.writeFileSync(cardPath, buffer);

    // حذف الافاتار المؤقت لو موجود
    try { if (fs.existsSync(tmpAvatarPath)) fs.unlinkSync(tmpAvatarPath); } catch(e){}

    // إرسال البطاقة
    await api.sendMessage({ body: `🎫 تم تسجيل عملك في: ${job.name}\n💰 ربحك: ${money} $`, attachment: fs.createReadStream(cardPath) }, event.threadID, async (err) => {
      try { if (fs.existsSync(cardPath)) fs.unlinkSync(cardPath); } catch(e){}
    });

  } catch (err) {
    console.error(err);
    try { await api.sendMessage("❌ حدث خطأ أثناء معالجة اختيار العمل: " + (err.message || err), event.threadID); } catch(e){}
  }
};

// دالة رسم مستطيل بزوايا مدورة (مستخدمة بكثرة)
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') stroke = true;
  if (typeof radius === 'undefined') radius = 5;
  if (typeof radius === 'number') radius = { tl: radius, tr: radius, br: radius, bl: radius };
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
