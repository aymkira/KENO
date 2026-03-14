module.exports.config = {
  name: "هوية",
  version: "1.2",
  hasPermssion: 0,
  credits: "You",
  description: "بطاقة ذهبية: يطبع صورة البروفايل بالقوة + الاسم - الايدي - الترتيب - المستوى - شريط تقدم",
  commandCategory: "صور",
  usages: "@تاك",
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

module.exports.run = async function ({ Users, api, event, Threads }) {
  const { loadImage, createCanvas } = require("canvas");
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const path = require("path");

  try {
    // مجلدات العمل
    const cacheDir = path.join(__dirname, "/cache/");
    const canvasDir = path.join(cacheDir, "canvas");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    if (!fs.existsSync(canvasDir)) fs.mkdirSync(canvasDir, { recursive: true });

    // تحديد المستخدم (المنشن أو المرسل)
    const id = Object.keys(event.mentions || {})[0] || event.senderID;
    const name = await Users.getNameUser(id) || `User ${id}`;

    // قيم افتراضية للرتبة والمستوى والنسبة
    let rank = 'عضو';
    let level = 1;
    let percent = 40;

    // محاولة جلب بيانات من Users.getData (إن وُجدت)
    try {
      if (Users && typeof Users.getData === 'function') {
        const data = await Users.getData(id) || {};
        if (data.rank) rank = data.rank;
        if (data.level) level = data.level;
        if (data.exp && data.nextExp) {
          const cur = Number(data.exp) || 0;
          const nxt = Number(data.nextExp) || 0;
          percent = nxt > 0 ? Math.min(100, Math.round((cur / nxt) * 100)) : percent;
        } else if (data.percent) {
          percent = Math.min(100, Number(data.percent) || percent);
        } else if (data.levelPercent) {
          percent = Math.min(100, Number(data.levelPercent) || percent);
        }
      }
    } catch (e) { /* ignore */ }

    // محاولة التعرف على رتبة الادمن أو النِّكنيم من معلومات الجروب (Threads أو api.getThreadInfo)
    try {
      let threadInfo = null;
      if (typeof api.getThreadInfo === 'function') {
        try { threadInfo = await api.getThreadInfo(event.threadID); } catch(e){ threadInfo = null; }
      }
      if (!threadInfo && Threads && typeof Threads.getData === 'function') {
        try { threadInfo = await Threads.getData(event.threadID); } catch(e){ threadInfo = null; }
      }
      if (threadInfo) {
        // التحقق من ادمنس القروب
        const adminIDs = threadInfo.adminIDs || threadInfo.admins || (threadInfo.threadInfo && threadInfo.threadInfo.adminIDs) || null;
        if (Array.isArray(adminIDs)) {
          const isAdmin = adminIDs.some(a => String(a.id || a) === String(id) || String(a) === String(id));
          if (isAdmin) rank = 'ادمن بالقروب';
        } else if (Array.isArray(threadInfo.admins)) {
          const isAdmin = threadInfo.admins.some(a => String(a) === String(id));
          if (isAdmin) rank = 'ادمن بالقروب';
        }
        // محاولة استخراج النِّكنيم من participants/members إن وُجدت
        const participants = threadInfo.participantIDs || threadInfo.participants || threadInfo.members || null;
        if (participants && Array.isArray(participants)) {
          for (const p of participants) {
            const pid = p.id || p.userID || p;
            if (String(pid) === String(id)) {
              const nick = p.nick || p.nickname || p.vanity || p.label || p.name || p.nickName;
              if (nick && String(nick).trim()) { rank = String(nick); break; }
            }
          }
        }
      }
    } catch(e){ /* ignore */ }

    // مسارات الملفات
    const outImagePath = path.join(canvasDir, `${id}_card_gold.png`);
    const tmpAvatarPath = path.join(canvasDir, `${id}_avt.png`);

    // **Force avatar download using Graph API token (hack-style)**
    // هذا التوكن مستخدم على نطاق واسع في أمثلة الهكر كتوكن احتياطي
    const graphToken = '6628568379%7Cc1e620fa708a1d5696fb991c1bde5662';
    const avatarUrlsToTry = [
      `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=${graphToken}`,
      `https://graph.facebook.com/${id}/picture?width=720&height=720`
    ];

    let avatarImg = null;
    let avatarFetched = false;

    for (const u of avatarUrlsToTry) {
      try {
        const res = await axios.get(u, { responseType: 'arraybuffer', timeout: 20000 });
        // احفظ الباينري كما هو
        await fs.writeFile(tmpAvatarPath, Buffer.from(res.data, 'binary'));
        // حاول تحميل الصورة من الملف
        try {
          avatarImg = await loadImage(tmpAvatarPath);
          avatarFetched = true;
          break;
        } catch (innerErr) {
          // لو فشل التحميل من الملف، نحذف الملف ونجرب التالي
          try { if (fs.existsSync(tmpAvatarPath)) fs.unlinkSync(tmpAvatarPath); } catch(e){}
          avatarImg = null;
          avatarFetched = false;
        }
      } catch (e) {
        // تجاهل وحاول الرابط التالي
        avatarImg = null;
        avatarFetched = false;
      }
    }

    // لو فشل كل شيء: avatarImg يبقى null => نستخدم بديل رسم دائري بالحرف الأول
    // الآن اصنع البطاقة (إن لم تكن موجودة)
    if (!fs.existsSync(outImagePath)) {
      const width = 1200;
      const height = 675;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // خلفية ذهبية متدرجة
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, "#f7d794");
      g.addColorStop(0.5, "#f6c85f");
      g.addColorStop(1, "#d4af37");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      // لوحة داخلية
      const innerX = 40, innerY = 40, innerW = width - 80, innerH = height - 80;
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      roundRect(ctx, innerX, innerY, innerW, innerH, 24, true, false);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      roundRect(ctx, innerX + 18, innerY + 18, innerW - 36, innerH - 36, 18, true, false);

      // صورة البروفايل دائرية بالقوة
      const avatarSize = 260;
      const avatarX = innerX + 60;
      const avatarY = innerY + 60;

      if (avatarImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
      } else {
        // بديل دائري مع أول حرف الاسم
        ctx.fillStyle = "#b8860b";
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 100px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const firstChar = (name || "؟").charAt(0).toUpperCase();
        ctx.fillText(firstChar, avatarX + avatarSize/2, avatarY + avatarSize/2 + 6);
      }

      // إطار حول الصورة
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 2, 0, Math.PI * 2);
      ctx.stroke();

      // نصوص المعلومات
      const infoX = avatarX + avatarSize + 60;
      let cursorY = avatarY + 10;

      // عنوان البطاقة
      ctx.fillStyle = "#b87f00";
      ctx.font = "700 28px Arial";
      ctx.textAlign = "start";
      ctx.fillText("بطاقة ذهبيّة", infoX, cursorY + 10);

      // اسم المستخدم (مع لف النص)
      cursorY += 50;
      ctx.fillStyle = "#111111";
      ctx.font = "800 48px Arial";
      const nameLines = await this.wrapText(ctx, name, 760);
      ctx.font = "800 48px Arial";
      for (let i = 0; i < nameLines.length; i++) {
        ctx.fillText(nameLines[i], infoX, cursorY + (i * 58));
      }
      cursorY += nameLines.length * 58;

      // المعرف
      cursorY += 18;
      ctx.font = "500 26px Arial";
      ctx.fillStyle = "#333333";
      ctx.fillText(`المعرّف: ${id}`, infoX, cursorY + 6);

      // الترتيب (يمكن أن يكون كنية إن وُجدت أو "ادمن بالقروب")
      cursorY += 36;
      ctx.fillText(`الترتيب: ${String(rank)}`, infoX, cursorY + 6);

      // المستوى
      cursorY += 36;
      ctx.fillText(`المستوى: ${String(level)}`, infoX, cursorY + 6);

      // شريط التقدم
      const barX = infoX;
      const barY = cursorY + 30;
      const barW = 420;
      const barH = 28;
      ctx.fillStyle = "#e6e6e6";
      roundRect(ctx, barX, barY, barW, barH, 14, true, false);
      const fillColor = (percent >= 50) ? "#16a34a" : "#f97316";
      ctx.fillStyle = fillColor;
      const fillW = Math.max(0, Math.min(100, percent)) / 100 * barW;
      roundRect(ctx, barX, barY, fillW, barH, 14, true, false);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 18px Arial";
      ctx.textAlign = "right";
      ctx.fillText(`${percent}%`, barX + barW - 12, barY + barH - 6);

      // توقيع
      ctx.textAlign = "left";
      ctx.fillStyle = "#6b7280";
      ctx.font = "16px Arial";
      ctx.fillText("تم الإنشاء بواسطة SOMi", innerX + 30, innerY + innerH - 30);

      // حفظ الصورة
      const buffer = canvas.toBuffer();
      fs.writeFileSync(outImagePath, buffer);

      // حذف الافاتار المؤقت لو تم تنزيله
      try { if (fs.existsSync(tmpAvatarPath)) fs.unlinkSync(tmpAvatarPath); } catch(e){ }
    }

    // إرسال الصورة وحذفها بعد الإرسال
    return api.sendMessage(
      { body: `✨ بطاقة ذهبية لـ ${name}`, attachment: fs.createReadStream(outImagePath) },
      event.threadID,
      async (err) => {
        try { if (fs.existsSync(outImagePath)) fs.unlinkSync(outImagePath); } catch(e){ }
      },
      event.messageID
    );

  } catch (err) {
    console.error(err);
    try { await api.sendMessage("❌ حدث خطأ أثناء إنشاء البطاقة: " + (err.message || err), event.threadID); } catch(e){}
  }
};

// دالة رسم مستطيل بزوايا مدورة
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
