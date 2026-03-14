const { createCanvas } = require("@napi-rs/canvas");
const fs = require("fs-extra");
const path = require("path");
const { getUserData, addMoney, removeMoney, ensureUser } = require(path.join(process.cwd(), "includes", "mongodb.js"));

module.exports.config = {
  name: "سلوتس",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "العب السلوت ماشين وحاول تحصل على ثلاث متطابقين",
  commandCategory: "games",
  usages: "سلوتس [رهان]",
  cooldowns: 5
};

// ══════════════════════════════════════════
//   SYMBOLS & WEIGHTS
// ══════════════════════════════════════════
const SYMBOLS = [
  { sym: "💀", name: "جمجمة",  weight: 2,  mult: 50  },  // نادر جداً
  { sym: "👁",  name: "عين",   weight: 4,  mult: 25  },
  { sym: "🔥",  name: "نار",   weight: 6,  mult: 15  },
  { sym: "⚡",  name: "برق",   weight: 8,  mult: 10  },
  { sym: "🌙",  name: "قمر",   weight: 12, mult: 6   },
  { sym: "⭐",  name: "نجمة",  weight: 16, mult: 4   },
  { sym: "🗡",  name: "سيف",   weight: 20, mult: 3   },
  { sym: "💎",  name: "ماس",   weight: 10, mult: 8   },
];

const SYMBOL_COLORS = {
  "💀": "#ef4444", "👁": "#a78bfa", "🔥": "#f97316",
  "⚡": "#facc15", "🌙": "#60a5fa", "⭐": "#fbbf24",
  "🗡": "#9ca3af", "💎": "#67e8f9",
};

function weightedRandom() {
  const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of SYMBOLS) { r -= s.weight; if (r <= 0) return s; }
  return SYMBOLS[SYMBOLS.length - 1];
}

function spin3x3() {
  return Array.from({length: 3}, () =>
    Array.from({length: 3}, () => weightedRandom())
  );
}

function checkWins(grid) {
  const results = [];

  // صفوف أفقية
  for (let r = 0; r < 3; r++) {
    if (grid[r][0].sym === grid[r][1].sym && grid[r][1].sym === grid[r][2].sym) {
      results.push({ type: "row", row: r, sym: grid[r][0], mult: grid[r][0].mult });
    }
  }

  // أعمدة
  for (let c = 0; c < 3; c++) {
    if (grid[0][c].sym === grid[1][c].sym && grid[1][c].sym === grid[2][c].sym) {
      results.push({ type: "col", col: c, sym: grid[0][c], mult: grid[0][c].mult });
    }
  }

  // أقطار
  if (grid[0][0].sym === grid[1][1].sym && grid[1][1].sym === grid[2][2].sym)
    results.push({ type: "diag1", sym: grid[0][0], mult: Math.floor(grid[0][0].mult * 1.5) });
  if (grid[0][2].sym === grid[1][1].sym && grid[1][1].sym === grid[2][0].sym)
    results.push({ type: "diag2", sym: grid[0][2], mult: Math.floor(grid[0][2].mult * 1.5) });

  return results;
}

// ══════════════════════════════════════════
//   DRAW CANVAS
// ══════════════════════════════════════════
function drawSlots(grid, bet, wins, finalMoney, totalProfit) {
  const W = 860, H = 560;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ── خلفية ──
  const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.8);
  bg.addColorStop(0, "#1a0a2e");
  bg.addColorStop(0.5, "#0f0520");
  bg.addColorStop(1, "#050208");
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  // نجوم خلفية
  let s = 13579;
  const rand = () => { s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff; };
  for (let i=0;i<80;i++) {
    ctx.save();
    ctx.globalAlpha = rand()*0.5+0.1;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff"; ctx.shadowBlur = rand()*6+2;
    ctx.beginPath(); ctx.arc(rand()*W, rand()*H, rand()*1.2+0.2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // شبكة
  ctx.save(); ctx.globalAlpha = 0.04; ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 0.5;
  for (let x=0;x<W;x+=38) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y=0;y<H;y+=38) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.restore();

  // ── إطار ومعبد السلوت ──
  ctx.save();
  ctx.shadowColor = "#a78bfa"; ctx.shadowBlur = 40;
  ctx.strokeStyle = "#a78bfa40"; ctx.lineWidth = 2;
  roundRect(ctx, 12, 12, W-24, H-24, 20); ctx.stroke();
  ctx.restore();

  // عنوان
  ctx.save();
  const titleG = ctx.createLinearGradient(W/2-150, 0, W/2+150, 0);
  titleG.addColorStop(0, "#c4b5fd"); titleG.addColorStop(0.5, "#ffffff"); titleG.addColorStop(1, "#c4b5fd");
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  roundRect(ctx, W/2-160, 20, 320, 44, 10); ctx.fill();
  ctx.strokeStyle = "#a78bfa40"; ctx.lineWidth = 1;
  roundRect(ctx, W/2-160, 20, 320, 44, 10); ctx.stroke();
  ctx.font = "bold 22px monospace"; ctx.fillStyle = titleG;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "#a78bfa"; ctx.shadowBlur = 20;
  ctx.fillText("★ KIRA SLOTS ★", W/2, 42);
  ctx.restore();

  // ── آلة السلوت ──
  const CELL = 110, GAP = 12;
  const gridW = 3*CELL + 2*GAP, gridH = 3*CELL + 2*GAP;
  const gX = W/2 - gridW/2, gY = 90;

  // إطار الآلة
  ctx.save();
  const machineG = ctx.createLinearGradient(gX-20, gY-20, gX+gridW+20, gY+gridH+20);
  machineG.addColorStop(0, "#2d1b69"); machineG.addColorStop(1, "#1a0a3e");
  ctx.fillStyle = machineG;
  roundRect(ctx, gX-20, gY-20, gridW+40, gridH+40, 18); ctx.fill();
  ctx.shadowColor = "#7c3aed"; ctx.shadowBlur = 30;
  ctx.strokeStyle = "#7c3aed80"; ctx.lineWidth = 2.5;
  roundRect(ctx, gX-20, gY-20, gridW+40, gridH+40, 18); ctx.stroke();
  ctx.restore();

  // الخلايا
  for (let r=0; r<3; r++) {
    for (let c=0; c<3; c++) {
      const cx = gX + c*(CELL+GAP);
      const cy = gY + r*(CELL+GAP);
      const sym = grid[r][c];
      const symColor = SYMBOL_COLORS[sym.sym] || "#ffffff";

      // هل هذه الخلية جزء من فوز؟
      const isWin = wins.some(w =>
        (w.type==="row" && w.row===r) ||
        (w.type==="col" && w.col===c) ||
        (w.type==="diag1" && r===c) ||
        (w.type==="diag2" && r+c===2)
      );

      ctx.save();
      if (isWin) {
        ctx.shadowColor = symColor; ctx.shadowBlur = 35;
        ctx.fillStyle = symColor + "25";
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
      }
      roundRect(ctx, cx, cy, CELL, CELL, 12); ctx.fill();

      if (isWin) {
        ctx.strokeStyle = symColor; ctx.lineWidth = 2.5;
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
      }
      roundRect(ctx, cx, cy, CELL, CELL, 12); ctx.stroke();
      ctx.restore();

      // الرمز
      ctx.save();
      ctx.font = "52px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (isWin) { ctx.shadowColor = symColor; ctx.shadowBlur = 25; }
      ctx.fillText(sym.sym, cx + CELL/2, cy + CELL/2 - 8);
      ctx.restore();

      // اسم الرمز
      ctx.save();
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = isWin ? symColor : "rgba(255,255,255,0.3)";
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      if (isWin) { ctx.shadowColor = symColor; ctx.shadowBlur = 10; }
      ctx.fillText(sym.name, cx + CELL/2, cy + CELL - 6);
      ctx.restore();
    }
  }

  // خطوط الفوز
  wins.forEach(w => {
    const symColor = SYMBOL_COLORS[w.sym.sym] || "#ffffff";
    ctx.save();
    ctx.strokeStyle = symColor; ctx.lineWidth = 3;
    ctx.shadowColor = symColor; ctx.shadowBlur = 20;
    ctx.globalAlpha = 0.7;
    ctx.setLineDash([8, 4]);

    let x1, y1, x2, y2;
    const mid = (n) => gX + n*(CELL+GAP) + CELL/2;
    const midR = (n) => gY + n*(CELL+GAP) + CELL/2;

    if (w.type==="row") {
      x1=gX-10; y1=midR(w.row); x2=gX+gridW+10; y2=midR(w.row);
    } else if (w.type==="col") {
      x1=mid(w.col); y1=gY-10; x2=mid(w.col); y2=gY+gridH+10;
    } else if (w.type==="diag1") {
      x1=gX; y1=gY; x2=gX+gridW; y2=gY+gridH;
    } else {
      x1=gX+gridW; y1=gY; x2=gX; y2=gY+gridH;
    }

    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.restore();
  });

  // ── لوحة السفلى ──
  const botY = gY + gridH + 38;

  // الرهان
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(ctx, 28, botY, 180, 58, 10); ctx.fill();
  ctx.strokeStyle = "#f5c84230"; ctx.lineWidth = 1;
  roundRect(ctx, 28, botY, 180, 58, 10); ctx.stroke();
  ctx.font = "bold 11px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("الرهان", 118, botY+6);
  ctx.font = "bold 22px monospace"; ctx.fillStyle = "#f5c842";
  ctx.shadowColor = "#f5c842"; ctx.shadowBlur = 12;
  ctx.textBaseline = "bottom";
  ctx.fillText(bet.toLocaleString() + " $", 118, botY+52);
  ctx.restore();

  // النتيجة
  const won = totalProfit > 0;
  const even = totalProfit === 0;
  ctx.save();
  ctx.shadowColor = won ? "#22c55e" : even ? "#f5c842" : "#ef4444"; ctx.shadowBlur = 40;
  ctx.fillStyle = (won ? "#22c55e" : even ? "#f5c842" : "#ef4444") + "20";
  roundRect(ctx, W/2-150, botY, 300, 58, 12); ctx.fill();
  ctx.strokeStyle = won ? "#22c55e" : even ? "#f5c842" : "#ef4444"; ctx.lineWidth = 2;
  roundRect(ctx, W/2-150, botY, 300, 58, 12); ctx.stroke();

  if (wins.length > 0) {
    ctx.font = "bold 13px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText(wins.map(w => `${w.sym.sym} ×${w.mult}`).join("  |  "), W/2, botY+6);
  } else {
    ctx.font = "bold 15px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("لا يوجد تطابق", W/2, botY+10);
  }

  ctx.font = "bold 28px monospace";
  ctx.fillStyle = won ? "#22c55e" : even ? "#f5c842" : "#ef4444";
  ctx.textAlign = "center"; ctx.textBaseline = "bottom";
  ctx.shadowBlur = 20;
  ctx.fillText((won?"+":"")+totalProfit.toLocaleString()+" $", W/2, botY+54);
  ctx.restore();

  // الرصيد الجديد
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(ctx, W-208, botY, 180, 58, 10); ctx.fill();
  ctx.strokeStyle = "#a78bfa30"; ctx.lineWidth = 1;
  roundRect(ctx, W-208, botY, 180, 58, 10); ctx.stroke();
  ctx.font = "bold 11px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("الرصيد", W-118, botY+6);
  ctx.font = "bold 20px monospace"; ctx.fillStyle = "#a78bfa";
  ctx.shadowColor = "#a78bfa"; ctx.shadowBlur = 12;
  ctx.textBaseline = "bottom";
  ctx.fillText(finalMoney.toLocaleString()+" $", W-118, botY+52);
  ctx.restore();

  // جدول الجوائز (صغير، يمين)
  ctx.save();
  ctx.font = "bold 11px monospace"; ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.textAlign = "right"; ctx.textBaseline = "top";
  const topSyms = SYMBOLS.slice(0,4);
  topSyms.forEach((s2, i) => {
    ctx.fillText(`${s2.sym} ×${s2.mult}`, W-28, 75 + i*18);
  });
  ctx.restore();

  // توقيع
  ctx.save();
  ctx.font = "10px monospace"; ctx.fillStyle = "#a78bfa25";
  ctx.textAlign = "left"; ctx.textBaseline = "bottom";
  ctx.fillText("KIRA SLOTS v1.0", 28, H-14);
  ctx.restore();

  drawCorners(ctx, W, H, "#a78bfa");

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
  ctx.strokeStyle = color+"50"; ctx.lineWidth = 2.5;
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
  const bet = parseInt(args[0]);

  if (isNaN(bet) || bet < 10)
    return api.sendMessage("🎰 طريقة الاستخدام:\nسلوتس [رهان]\n\nمثال: سلوتس 200\n\nأدنى رهان: 10 $", threadID, messageID);

  // ── جلب الرصيد من MongoDB ──
  await ensureUser(senderID);
  const userData = await getUserData(senderID);
  const money = userData?.currency?.money ?? 0;

  if (money < bet)
    return api.sendMessage(`❌ رصيدك غير كافٍ!\nرصيدك: ${money.toLocaleString()} $`, threadID, messageID);

  if (api.setMessageReaction) api.setMessageReaction("🎰", messageID, ()=>{}, true);

  // تدوير
  const grid = spin3x3();
  const wins = checkWins(grid);

  // احسب الربح
  let totalProfit = -bet;
  wins.forEach(w => { totalProfit += bet * w.mult; });
  const finalMoney = money + totalProfit;

  // ── تحديث الرصيد في MongoDB ──
  if (totalProfit > 0) {
    await addMoney(senderID, totalProfit);
  } else if (totalProfit < 0) {
    await removeMoney(senderID, Math.abs(totalProfit));
  }

  const img = drawSlots(grid, bet, wins, finalMoney, totalProfit);

  const cacheDir = path.join(process.cwd(), "cache");
  fs.ensureDirSync(cacheDir);
  const cachePath = path.join(cacheDir, `slots_${senderID}_${Date.now()}.png`);
  await fs.writeFile(cachePath, img);

  const reaction = wins.length === 0 ? "💀" : totalProfit >= bet*10 ? "🔥" : "✅";

  return api.sendMessage(
    { attachment: fs.createReadStream(cachePath) },
    threadID,
    () => {
      try { if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); } catch(_){}
      if (api.setMessageReaction) api.setMessageReaction(reaction, messageID, ()=>{}, true);
    },
    messageID
  );
};
