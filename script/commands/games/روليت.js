const { createCanvas } = require("@napi-rs/canvas");
const fs = require("fs-extra");
const path = require("path");
const { getUserData, addMoney, removeMoney, ensureUser } = require(path.join(process.cwd(), "includes", "mongodb.js"));

module.exports.config = {
  name: "روليت",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "العب روليت وراهن على الأرقام والألوان",
  commandCategory: "games",
  usages: "روليت [رهان] [اختيار]\nأمثلة:\nروليت 100 أحمر\nروليت 500 أسود\nروليت 200 زوجي\nروليت 300 فردي\nروليت 1000 17",
  cooldowns: 8
};

// ══════════════════════════════════════════
//   ROULETTE DATA
// ══════════════════════════════════════════
const RED_NUMS   = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACK_NUMS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

function getColor(n) {
  if (n === 0) return "#16a34a";
  if (RED_NUMS.includes(n)) return "#dc2626";
  return "#1a1a1a";
}

function parseChoice(input) {
  const map = {
    "أحمر": "red", "احمر": "red",
    "أسود": "black", "اسود": "black",
    "أخضر": "green", "اخضر": "green",
    "زوجي": "even", "فردي": "odd",
  };
  if (map[input]) return { type: map[input], label: input };
  const n = parseInt(input);
  if (!isNaN(n) && n >= 0 && n <= 36) return { type: "number", value: n, label: input };
  return null;
}

function checkWin(result, choice) {
  if (choice.type === "red")    return RED_NUMS.includes(result)   ? 2 : 0;
  if (choice.type === "black")  return BLACK_NUMS.includes(result) ? 2 : 0;
  if (choice.type === "green")  return result === 0 ? 14 : 0;
  if (choice.type === "even")   return result !== 0 && result % 2 === 0 ? 2 : 0;
  if (choice.type === "odd")    return result !== 0 && result % 2 !== 0 ? 2 : 0;
  if (choice.type === "number") return result === choice.value ? 36 : 0;
  return 0;
}

// ══════════════════════════════════════════
//   DRAW CANVAS
// ══════════════════════════════════════════
function drawRoulette(result, bet, choice, multiplier, finalMoney) {
  const W = 900, H = 520;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ── خلفية ──
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a0a0f");
  bg.addColorStop(0.5, "#0f0a14");
  bg.addColorStop(1, "#0a0f0a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // شبكة خفيفة
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.restore();

  // جسيمات
  let s = 77777;
  const rand = () => { s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff; };
  for (let i = 0; i < 60; i++) {
    ctx.save();
    ctx.globalAlpha = rand()*0.4+0.05;
    ctx.shadowColor = i%3===0?"#dc2626":i%3===1?"#16a34a":"#888";
    ctx.shadowBlur = 10;
    ctx.fillStyle = ctx.shadowColor;
    ctx.beginPath(); ctx.arc(rand()*W, rand()*H, rand()*1.8+0.3, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // ── عجلة الروليت ──
  const WX = 195, WY = H/2, WR = 155;

  // توهج خلف العجلة
  const wglow = ctx.createRadialGradient(WX, WY, 0, WX, WY, WR*1.8);
  wglow.addColorStop(0, getColor(result)+"30");
  wglow.addColorStop(1, "transparent");
  ctx.fillStyle = wglow; ctx.fillRect(0,0,W,H);

  // رسم أقسام العجلة
  const segCount = WHEEL_ORDER.length;
  const segAngle = (Math.PI * 2) / segCount;

  // إيجاد موقع الـ result في العجلة
  const resultIdx = WHEEL_ORDER.indexOf(result);
  // نحسب الزاوية بحيث الـ result يكون أعلى العجلة
  const baseAngle = -Math.PI/2 - resultIdx * segAngle - segAngle/2;

  for (let i = 0; i < segCount; i++) {
    const num = WHEEL_ORDER[i];
    const startA = baseAngle + i * segAngle;
    const endA = startA + segAngle;
    const isResult = num === result;

    ctx.save();
    ctx.shadowColor = isResult ? "#ffffff" : "transparent";
    ctx.shadowBlur = isResult ? 20 : 0;

    // القسم
    ctx.beginPath();
    ctx.moveTo(WX, WY);
    ctx.arc(WX, WY, WR, startA, endA);
    ctx.closePath();
    ctx.fillStyle = getColor(num);
    ctx.fill();

    // حدود
    ctx.strokeStyle = "rgba(200,180,100,0.35)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    // الرقم
    const midA = startA + segAngle/2;
    const tx = WX + (WR * 0.72) * Math.cos(midA);
    const ty = WY + (WR * 0.72) * Math.sin(midA);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(midA + Math.PI/2);
    ctx.font = `bold ${isResult ? 11 : 8}px monospace`;
    ctx.fillStyle = isResult ? "#ffffff" : "rgba(255,255,255,0.8)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (isResult) { ctx.shadowColor="#ffffff"; ctx.shadowBlur=15; }
    ctx.fillText(num.toString(), 0, 0);
    ctx.restore();
  }

  // دائرة داخلية
  ctx.save();
  const innerGrad = ctx.createRadialGradient(WX, WY, 0, WX, WY, WR*0.28);
  innerGrad.addColorStop(0, "#1a1208");
  innerGrad.addColorStop(1, "#0d0c08");
  ctx.fillStyle = innerGrad;
  ctx.shadowColor = "rgba(200,180,100,0.5)"; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(WX, WY, WR*0.28, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "rgba(200,180,100,0.6)"; ctx.lineWidth = 2;
  ctx.stroke();

  // إطار خارجي
  ctx.beginPath(); ctx.arc(WX, WY, WR+8, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(200,180,100,0.5)"; ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath(); ctx.arc(WX, WY, WR+14, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(200,180,100,0.2)"; ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // مثلث المؤشر (أعلى العجلة)
  ctx.save();
  ctx.shadowColor = "#f5c842"; ctx.shadowBlur = 20;
  ctx.fillStyle = "#f5c842";
  ctx.beginPath();
  ctx.moveTo(WX, WY - WR - 6);
  ctx.lineTo(WX - 10, WY - WR - 26);
  ctx.lineTo(WX + 10, WY - WR - 26);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // ── لوحة المعلومات (يمين) ──
  const PX = 400, PW = W - PX - 28;

  // الرقم الناتج - كبير
  ctx.save();
  ctx.fillStyle = getColor(result) + "cc";
  roundRect(ctx, PX, 28, PW, 100, 14); ctx.fill();
  ctx.shadowColor = getColor(result); ctx.shadowBlur = 40;
  ctx.strokeStyle = getColor(result); ctx.lineWidth = 2;
  roundRect(ctx, PX, 28, PW, 100, 14); ctx.stroke();

  ctx.font = "bold 72px monospace";
  ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowBlur = 30;
  ctx.fillText(result.toString(), PX + PW/2, 78);
  ctx.restore();

  ctx.save();
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(
    result === 0 ? "أخضر" : RED_NUMS.includes(result) ? "أحمر" : "أسود",
    PX + PW/2, 133
  );
  ctx.restore();

  // ── صفوف المعلومات ──
  const rows = [
    { label: "رهانك", value: bet.toLocaleString() + " $" },
    { label: "اختيارك", value: choice.label },
    { label: "المضاعف", value: multiplier > 0 ? "×" + multiplier : "×0" },
  ];

  rows.forEach((r, i) => {
    const ry = 160 + i * 62;
    ctx.save();
    ctx.fillStyle = i%2===0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.2)";
    roundRect(ctx, PX, ry, PW, 52, 10); ctx.fill();

    ctx.font = "bold 14px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillText(r.label, PX + PW - 16, ry + 26);

    ctx.font = "bold 20px monospace"; ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(r.value, PX + 16, ry + 26);
    ctx.restore();
  });

  // ── النتيجة النهائية ──
  const won = multiplier > 0;
  const profit = won ? bet * multiplier - bet : -bet;
  const resY = 350;

  ctx.save();
  ctx.shadowColor = won ? "#22c55e" : "#ef4444"; ctx.shadowBlur = 40;
  ctx.fillStyle = won ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)";
  roundRect(ctx, PX, resY, PW, 80, 14); ctx.fill();
  ctx.strokeStyle = won ? "#22c55e" : "#ef4444"; ctx.lineWidth = 2;
  roundRect(ctx, PX, resY, PW, 80, 14); ctx.stroke();

  ctx.font = "bold 16px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(won ? "🏆 فزت!" : "💀 خسرت!", PX + PW/2, resY + 10);

  ctx.font = "bold 32px monospace";
  ctx.fillStyle = won ? "#22c55e" : "#ef4444";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowBlur = 20;
  ctx.fillText((won ? "+" : "") + profit.toLocaleString() + " $", PX + PW/2, resY + 52);
  ctx.restore();

  // رصيد جديد
  ctx.save();
  ctx.font = "bold 13px monospace"; ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.textAlign = "center"; ctx.textBaseline = "bottom";
  ctx.fillText("الرصيد الجديد: " + finalMoney.toLocaleString() + " $", PX + PW/2, H - 18);
  ctx.restore();

  // ── عنوان اللعبة ──
  ctx.save();
  ctx.font = "bold 13px monospace"; ctx.fillStyle = "rgba(200,180,100,0.5)";
  ctx.textAlign = "left"; ctx.textBaseline = "bottom";
  ctx.fillText("KIRA ROULETTE", 28, H - 18);
  ctx.restore();

  // زوايا زخرفية
  drawCorners(ctx, W, H, "#c8b464");

  return canvas.toBuffer("image/png");
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function drawCorners(ctx, W, H, color) {
  ctx.save();
  ctx.strokeStyle = color+"60"; ctx.lineWidth = 2.5;
  ctx.shadowColor = color; ctx.shadowBlur = 8;
  [[W-50,18,W-18,18,W-18,50],[18,H-50,18,H-18,50,H-18],[18,50,18,18,50,18],[W-50,H-18,W-18,H-18,W-18,H-50]]
    .forEach(([x1,y1,x2,y2,x3,y3])=>{ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke(); });
  [[18,18],[W-18,18],[18,H-18],[W-18,H-18]].forEach(([px,py])=>{
    ctx.fillStyle=color; ctx.shadowBlur=15;
    ctx.beginPath(); ctx.arc(px,py,3.5,0,Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

// ══════════════════════════════════════════
//   RUN
// ══════════════════════════════════════════
module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const args = event.body.trim().split(/\s+/).slice(1);

  if (args.length < 2) {
    return api.sendMessage(
      "🎰 طريقة الاستخدام:\nروليت [رهان] [اختيار]\n\nالاختيارات:\n• أحمر / أسود / أخضر\n• زوجي / فردي\n• رقم (0-36)\n\nأمثلة:\nروليت 100 أحمر\nروليت 500 17",
      threadID, messageID
    );
  }

  const bet = parseInt(args[0]);
  if (isNaN(bet) || bet < 10)
    return api.sendMessage("❌ الرهان الأدنى هو 10 $", threadID, messageID);

  const choice = parseChoice(args[1]);
  if (!choice)
    return api.sendMessage("❌ اختيار غير صحيح! استخدم: أحمر، أسود، زوجي، فردي، أو رقم (0-36)", threadID, messageID);

  // ── جلب الرصيد من MongoDB ──
  await ensureUser(senderID);
  const userData = await getUserData(senderID);
  const money = userData?.currency?.money ?? 0;

  if (money < bet)
    return api.sendMessage(`❌ رصيدك غير كافٍ!\nرصيدك: ${money.toLocaleString()} $`, threadID, messageID);

  // ── تدوير العجلة ──
  const result = Math.floor(Math.random() * 37);
  const multiplier = checkWin(result, choice);
  const profit = multiplier > 0 ? bet * multiplier - bet : -bet;
  const finalMoney = money + profit;

  // ── تحديث الرصيد في MongoDB ──
  if (multiplier > 0) {
    // فاز — أضف الربح (المبلغ المسترجع = bet * multiplier)
    await addMoney(senderID, bet * multiplier - bet);
  } else {
    // خسر — اشيل الرهان
    await removeMoney(senderID, bet);
  }

  if (api.setMessageReaction) api.setMessageReaction("🎰", messageID, ()=>{}, true);

  const img = drawRoulette(result, bet, choice, multiplier, finalMoney);

  const cacheDir = path.join(process.cwd(), "cache");
  fs.ensureDirSync(cacheDir);
  const cachePath = path.join(cacheDir, `roulette_${senderID}_${Date.now()}.png`);
  await fs.writeFile(cachePath, img);

  return api.sendMessage(
    { attachment: fs.createReadStream(cachePath) },
    threadID,
    () => {
      try { if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); } catch (_) {}
      if (api.setMessageReaction) api.setMessageReaction(multiplier > 0 ? "✅" : "💀", messageID, ()=>{}, true);
    },
    messageID
  );
};
