module.exports.config = {
  name: "إحصائيات",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SOMi",
  description: "بطاقة إحصائيات المجموعة مع شريط تقدم للنشاط",
  commandCategory: "معلومات",
  usages: "إحصائيات",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, Threads }) {
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const path = require("path");
  const { createCanvas, loadImage } = require("canvas");

  const { threadID, messageID } = event;

  try {
    // جلب بيانات المجموعة
    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName || "مجموعة بدون اسم";
    const groupID = threadID;
    const memberCount = threadInfo.participantIDs.length;
    const messageCount = threadInfo.messageCount || 100; // افتراضي إذا لم يتوفر
    const adminCount = threadInfo.adminIDs.length;
    const maxMessages = 1000; // الحد الأقصى للرسائل لتحديد نسبة النشاط
    const activityPercent = Math.min((messageCount / maxMessages) * 100, 100); // النسبة المئوية

    // إنشاء النص
    const textMessage = `╔════ ⸻ 📊 𝐆𝐫𝐨𝐮𝐩 𝐒𝐭𝐚𝐭𝐬 📊 ⸻ ════╗
🏷️ اسم المجموعة: 『${groupName}』
🆔 معرف المجموعة: 『${groupID}』
👥 عدد الأعضاء: 『${memberCount}』
✉️ عدد الرسائل: 『${messageCount} (${activityPercent.toFixed(0)}%)』
🛡️ عدد المشرفين: 『${adminCount}』
╚════════════════════════╝`;

    // إرسال النص أولاً
    await api.sendMessage(textMessage, threadID, messageID);

    // تجهيز الصورة
    const cache = path.join(__dirname, `/cache/stats_${threadID}.png`);
    const avatar = path.join(__dirname, `/cache/group_avt_${threadID}.png`);

    // جلب صورة المجموعة — محاولتين
    const tokens = [
      "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662",
      "1799872890|dummy_backup_token"
    ];
    let avatarImg = null;

    for (let tk of tokens) {
      try {
        const get = await axios.get(
          `https://graph.facebook.com/${threadID}/picture?height=720&width=720&access_token=${tk}`,
          { responseType: "arraybuffer" }
        );
        fs.writeFileSync(avatar, get.data);
        avatarImg = await loadImage(avatar);
        break;
      } catch (e) {
        console.warn(`فشل جلب صورة المجموعة برمز ${tk}:`, e.message);
        continue;
      }
    }

    // إنشاء الصورة
    const width = 1400, height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // خلفية سوداء مع تدرج خفيف
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#000000");
    grad.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // إطار زخرفي
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // عنوان
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("📊 𝐆𝐫𝐨𝐮𝐩 𝐒𝐭𝐚𝐭𝐬 📊", width / 2, 100);

    // صورة المجموعة دائرية
    const imgSize = 300, imgX = 100, imgY = 200;
    if (avatarImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, imgX, imgY, imgSize, imgSize);
      ctx.restore();
      // إطار حول الصورة
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // بديل إذا لم تتوفر الصورة
      ctx.fillStyle = "#333333";
      ctx.beginPath();
      ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 100px Arial";
      ctx.textAlign = "center";
      ctx.fillText(groupName.charAt(0).toUpperCase(), imgX + imgSize / 2, imgY + imgSize / 1.5);
    }

    // كتابة البيانات
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "right";
    let startY = 200;
    const startX = width - 100;
    const fields = [
      `🏷️ اسم المجموعة: ${groupName}`,
      `🆔 معرف المجموعة: ${groupID}`,
      `👥 عدد الأعضاء: ${memberCount}`,
      `✉️ عدد الرسائل: ${messageCount} (${activityPercent.toFixed(0)}%)`,
      `🛡️ عدد المشرفين: ${adminCount}`
    ];

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      ctx.fillText(field, startX, startY);
      if (i === 3) { // بعد حقل عدد الرسائل
        // شريط النشاط
        const barWidth = 400, barHeight = 30;
        const barX = startX - barWidth, barY = startY + 10;
        // خلفية الشريط
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(barX, barY, barWidth, barHeight);
        // الشريط الملون
        ctx.fillStyle = activityPercent >= 50 ? "#16a34a" : "#f97316";
        ctx.fillRect(barX, barY, barWidth * (activityPercent / 100), barHeight);
        // نص النسبة
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${activityPercent.toFixed(0)}%`, barX + barWidth / 2, barY + 22);
        startY += barHeight + 20; // إضافة مساحة إضافية بعد الشريط
      }
      startY += 60;
    }

    // إضافة ظلال ناعمة
    ctx.shadowColor = "rgba(255,255,255,0.3)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("تم الإنشاء بواسطة SOMi", 50, height - 50);

    // إعادة تعيين الظل
    ctx.shadowBlur = 0;

    // حفظ الصورة
    fs.writeFileSync(cache, canvas.toBuffer());

    // إرسال الصورة
    return api.sendMessage(
      {
        body: `📈 إحصائيات المجموعة: ${groupName}`,
        attachment: fs.createReadStream(cache)
      },
      threadID,
      () => {
        fs.unlinkSync(cache);
        if (fs.existsSync(avatar)) fs.unlinkSync(avatar);
      },
      messageID
    );

  } catch (err) {
    console.error("خطأ في إنشاء بطاقة إحصائيات المجموعة:", err);
    return api.sendMessage("❌ حدث خطأ أثناء إنشاء بطاقة الإحصائيات، حاول مرة أخرى.", threadID, messageID);
  }
};
