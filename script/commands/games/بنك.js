const { createCanvas, loadImage } = require("@napi-rs/canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const mongodb = require(path.join(process.cwd(), "includes", "mongodb.js"));

module.exports.config = {
  name: "بنك",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "بطاقة بنك كونية",
  commandCategory: "games",
  usages: "بنك [@منشن/رد]",
  cooldowns: 5
};

// ── helpers ──────────────────────────────────────────────────
function rRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getTheme(rank, isDev) {
  if (isDev) return { c1: "#f0abfc", c2: "#c084fc", c3: "#3b0764", glow: "#e879f9" };
  const map = {
    "مبتدئ":    { c1: "#6ee7b7", c2: "#34d399", c3: "#064e3b", glow: "#6ee7b7" },
    "محارب":    { c1: "#fde68a", c2: "#fbbf24", c3: "#78350f", glow: "#fde68a" },
    "فارس":     { c1: "#7dd3fc", c2: "#38bdf8", c3: "#0c4a6e", glow: "#7dd3fc" },
    "نخبة":     { c1: "#fdba74", c2: "#fb923c", c3: "#7c2d12", glow: "#fdba74" },
    "بطل":      { c1: "#fda4af", c2: "#fb7185", c3: "#881337", glow: "#fda4af" },
    "أسطورة":   { c1: "#c4b5fd", c2: "#a78bfa", c3: "#4c1d95", glow: "#c4b5fd" },
    "ملك":      { c1: "#67e8f9", c2: "#22d3ee", c3: "#164e63", glow: "#67e8f9" },
    "إمبراطور": { c1: "#fcd34d", c2: "#f59e0b", c3: "#78350f", glow: "#fcd34d" },
    "إله":      { c1: "#f9a8d4", c2: "#ec4899", c3: "#831843", glow: "#f9a8d4" },
    "خالد":     { c1: "#fca5a5", c2: "#ef4444", c3: "#7f1d1d", glow: "#fca5a5" },
  };
  return map[rank] || map["مبتدئ"];
}

function getRankInfo(rank, isDev) {
  if (isDev) return { label: "SYSTEM LORD" };
  const map = {
    "مبتدئ": "BEGINNER", "محارب": "WARRIOR", "فارس": "KNIGHT",
    "نخبة": "ELITE", "بطل": "HERO", "أسطورة": "LEGEND",
    "ملك": "KING", "إمبراطور": "EMPEROR", "إله": "GOD", "خالد": "IMMORTAL"
  };
  return { label: map[rank] || "BEGINNER" };
}

// ترتيب الرتب للـ timeline
const RANKS_ORDER = ["مبتدئ","محارب","فارس","نخبة","بطل","أسطورة","ملك","إمبراطور","إله","خالد"];

function formatNum(n) {
  n = Math.floor(Number(n) || 0);
  if (n >= 1e18) return (n / 1e18).toFixed(1) + "QT";
  if (n >= 1e15) return (n / 1e15).toFixed(1) + "Q";
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9)  return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6)  return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3)  return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

// ── خلفية: نجوم ──────────────────────────────────────────────
function drawStars(ctx, W, H) {
  let s = 99991;
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  for (let i = 0; i < 260; i++) {
    const size = rand() * 1.8 + 0.2, alpha = rand() * 0.7 + 0.2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = size * 3;
    ctx.beginPath();
    ctx.arc(rand() * W, rand() * H, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── جسيمات/شرارات متوهجة ──────────────────────────────────────
function drawParticles(ctx, W, H, T) {
  let s = 31337;
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };

  // جسيمات دائرية متوهجة
  for (let i = 0; i < 35; i++) {
    const px = rand() * W;
    const py = rand() * H;
    const pr = rand() * 2.5 + 0.5;
    const alpha = rand() * 0.6 + 0.15;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = T.c1;
    ctx.shadowBlur = 12;
    ctx.fillStyle = i % 3 === 0 ? T.c1 : i % 3 === 1 ? T.c2 : "#ffffff";
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // شرارات (خطوط قصيرة مائلة)
  for (let i = 0; i < 20; i++) {
    const sx = rand() * W;
    const sy = rand() * H;
    const len = rand() * 18 + 4;
    const angle = rand() * Math.PI * 2;
    const alpha = rand() * 0.4 + 0.1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = T.c2;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = rand() > 0.5 ? T.c1 : T.c2;
    ctx.lineWidth = rand() * 1.2 + 0.3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
    ctx.stroke();
    ctx.restore();
  }

  // حلقات ضوء صغيرة
  for (let i = 0; i < 8; i++) {
    const cx = rand() * W, cy = rand() * H;
    const cr = rand() * 15 + 5;
    ctx.save();
    ctx.globalAlpha = rand() * 0.12 + 0.03;
    ctx.shadowColor = T.glow;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = T.c1;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// ── scan lines ────────────────────────────────────────────────
function drawScanLines(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.025;
  ctx.fillStyle = "#000000";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  ctx.restore();
}

// ── grid pattern ──────────────────────────────────────────────
function drawGrid(ctx, W, H, T) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = T.c2;
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}

// ── أيقونات مرسومة (بدل إيموجي) ─────────────────────────────
function drawIcon(ctx, x, y, type, color, size = 14) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = 1.5; ctx.shadowColor = color; ctx.shadowBlur = 8;

  if (type === "money") {
    ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.font = `bold ${size - 2}px serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("$", x, y);
  } else if (type === "exp") {
    const r = size / 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      i === 0 ? ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
              : ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 0.4; ctx.fill();
  } else if (type === "level") {
    ctx.beginPath();
    ctx.moveTo(x, y - size / 2); ctx.lineTo(x + size / 2, y + size / 2); ctx.lineTo(x - size / 2, y + size / 2);
    ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 0.35; ctx.fill();
  } else if (type === "msg") {
    rRect(ctx, x - size / 2, y - size / 2 + 2, size, size - 4, 3); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 4, y + size / 2 - 2); ctx.lineTo(x - size / 2, y + size / 2 + 3); ctx.lineTo(x + 2, y + size / 2 - 2);
    ctx.stroke();
  } else if (type === "rank_num") {
    // # داخل دائرة
    ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.font = `bold ${size - 4}px monospace`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("#", x, y);
  }
  ctx.restore();
}

// ── progress دائري ────────────────────────────────────────────
function drawCircularProgress(ctx, cx, cy, radius, progress, T) {
  const start = -Math.PI / 2;
  const end = start + (progress / 100) * Math.PI * 2;

  ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();

  if (progress > 0) {
    ctx.save();
    ctx.shadowColor = T.glow; ctx.shadowBlur = 22;
    ctx.lineWidth = 9; ctx.lineCap = "round";
    const g = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    g.addColorStop(0, T.c3 + "cc"); g.addColorStop(0.5, T.c2); g.addColorStop(1, T.c1);
    ctx.strokeStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, radius, start, end); ctx.stroke(); ctx.restore();

    const ex = cx + radius * Math.cos(end), ey = cy + radius * Math.sin(end);
    ctx.save(); ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 22;
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(ex, ey, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

// ── شريط timeline للرتب ───────────────────────────────────────
function drawRankTimeline(ctx, x, y, w, currentRank, T) {
  const ranks = RANKS_ORDER;
  const isDev = !ranks.includes(currentRank);
  const currentIdx = isDev ? ranks.length - 1 : ranks.indexOf(currentRank);
  const nodeCount = ranks.length;
  const spacing = w / (nodeCount - 1);

  // الخط الخلفي
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  ctx.restore();

  // الخط المكتمل (حتى الرتبة الحالية)
  if (currentIdx > 0) {
    ctx.save();
    ctx.shadowColor = T.glow; ctx.shadowBlur = 10;
    const pg = ctx.createLinearGradient(x, y, x + spacing * currentIdx, y);
    pg.addColorStop(0, T.c3 + "aa"); pg.addColorStop(1, T.c1);
    ctx.strokeStyle = pg; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + spacing * currentIdx, y); ctx.stroke();
    ctx.restore();
  }

  // النقاط
  ranks.forEach((rank, i) => {
    const nx = x + i * spacing;
    const done = i <= currentIdx;
    const isCurrent = i === currentIdx;

    ctx.save();
    if (isCurrent) {
      ctx.shadowColor = T.glow; ctx.shadowBlur = 20;
      ctx.fillStyle = T.c1;
      ctx.beginPath(); ctx.arc(nx, y, 7, 0, Math.PI * 2); ctx.fill();
      // حلقة خارجية نابضة
      ctx.globalAlpha = 0.4; ctx.strokeStyle = T.c1; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(nx, y, 11, 0, Math.PI * 2); ctx.stroke();
    } else if (done) {
      ctx.shadowColor = T.c2; ctx.shadowBlur = 8;
      ctx.fillStyle = T.c2;
      ctx.beginPath(); ctx.arc(nx, y, 4.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(nx, y, 4, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();

    // اسم الرتبة (للأولى والحالية والأخيرة فقط لتجنب الازدحام)
    if (isCurrent || i === 0 || i === ranks.length - 1) {
      ctx.save();
      ctx.font = isCurrent ? "bold 11px sans-serif" : "9px sans-serif";
      ctx.fillStyle = isCurrent ? T.c1 : "rgba(255,255,255,0.4)";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      if (isCurrent) { ctx.shadowColor = T.glow; ctx.shadowBlur = 10; }
      ctx.fillText(rank, nx, y + 14);
      ctx.restore();
    }
  });
}

// ─────────────────────────────────────────────────────────────
async function createCard(data) {
  const W = 960, H = 500; // زيادة H قليلاً لاستيعاب timeline
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const T = getTheme(data.rank, data.isDeveloper);
  const RI = getRankInfo(data.rank, data.isDeveloper);

  // ── خلفية ──
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#020008"); bg.addColorStop(0.5, "#04020e"); bg.addColorStop(1, "#000510");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const neb = ctx.createRadialGradient(W * 0.65, H * 0.3, 0, W * 0.65, H * 0.3, 400);
  neb.addColorStop(0, T.c3 + "40"); neb.addColorStop(0.6, T.c3 + "15"); neb.addColorStop(1, "transparent");
  ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);

  const neb2 = ctx.createRadialGradient(130, H - 60, 0, 130, H - 60, 280);
  neb2.addColorStop(0, T.c2 + "22"); neb2.addColorStop(1, "transparent");
  ctx.fillStyle = neb2; ctx.fillRect(0, 0, W, H);

  drawGrid(ctx, W, H, T);
  drawStars(ctx, W, H);
  drawParticles(ctx, W, H, T); // ✅ جسيمات جديدة
  drawScanLines(ctx, W, H);

  // ── إطار ──
  ctx.save();
  ctx.shadowColor = T.glow; ctx.shadowBlur = 40;
  ctx.strokeStyle = T.c2 + "80"; ctx.lineWidth = 2;
  rRect(ctx, 12, 12, W - 24, H - 24, 18); ctx.stroke();
  ctx.restore();

  ctx.save();
  const glass = ctx.createLinearGradient(0, 0, 0, H);
  glass.addColorStop(0, "rgba(255,255,255,0.04)"); glass.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = glass; rRect(ctx, 12, 12, W - 24, H - 24, 18); ctx.fill();
  ctx.restore();

  // خط علوي
  ctx.save(); ctx.shadowColor = T.glow; ctx.shadowBlur = 20;
  const tl = ctx.createLinearGradient(0, 0, W, 0);
  tl.addColorStop(0, "transparent"); tl.addColorStop(0.3, T.c1); tl.addColorStop(0.7, T.c1); tl.addColorStop(1, "transparent");
  ctx.strokeStyle = tl; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, 13); ctx.lineTo(W - 60, 13); ctx.stroke();
  ctx.restore();

  // ── KIRA BANK لوجو أعلى يسار ──
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)"; rRect(ctx, 22, 22, 158, 34, 6); ctx.fill();
  ctx.strokeStyle = T.c2 + "60"; ctx.lineWidth = 1; rRect(ctx, 22, 22, 158, 34, 6); ctx.stroke();
  ctx.fillStyle = T.c1; ctx.shadowColor = T.glow; ctx.shadowBlur = 10;
  ctx.fillRect(30, 32, 6, 6); ctx.fillStyle = T.c2; ctx.fillRect(38, 32, 4, 4); ctx.fillStyle = T.c1 + "80"; ctx.fillRect(44, 34, 3, 3);
  ctx.font = "bold 16px monospace"; ctx.fillStyle = T.c1; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.shadowBlur = 12;
  ctx.fillText("KIRA", 52, 39); ctx.fillStyle = "#ffffff"; ctx.shadowBlur = 0; ctx.fillText("BANK", 95, 39);
  ctx.restore();

  // ── رتبة badge أعلى يمين ──
  ctx.save();
  const rw = 138, rh = 34, rx = W - rw - 22;
  ctx.fillStyle = T.c3 + "aa"; rRect(ctx, rx, 22, rw, rh, 6); ctx.fill();
  ctx.shadowColor = T.glow; ctx.shadowBlur = 22; ctx.strokeStyle = T.c1 + "cc"; ctx.lineWidth = 1.5;
  rRect(ctx, rx, 22, rw, rh, 6); ctx.stroke();
  ctx.font = "bold 13px monospace"; ctx.fillStyle = T.c1; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(RI.label, rx + rw / 2, 39);
  ctx.restore();

  // ── صورة البروفايل (يسار، تحركت يمين قليلاً) ──
  // ✅ AX زاد من 90 → 115 لتظهر الصورة كاملة
  const AX = 115, AY = H / 2 - 15, AR = 122;

  try {
    const avatarURL = `https://graph.facebook.com/${data.userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const res = await axios.get(avatarURL, { responseType: "arraybuffer", timeout: 10000 });
    const avatar = await loadImage(Buffer.from(res.data));

    const ag = ctx.createRadialGradient(AX, AY, 0, AX, AY, AR * 2.6);
    ag.addColorStop(0, T.c2 + "30"); ag.addColorStop(0.5, T.c3 + "12"); ag.addColorStop(1, "transparent");
    ctx.fillStyle = ag; ctx.fillRect(AX - AR * 3, AY - AR * 3, AR * 6, AR * 6);

    for (let i = 3; i >= 1; i--) {
      ctx.save(); ctx.globalAlpha = 0.08 / i;
      ctx.strokeStyle = T.c1; ctx.lineWidth = 1; ctx.setLineDash([4, 9]);
      ctx.beginPath(); ctx.arc(AX, AY, AR + i * 16, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }

    ctx.save();
    ctx.beginPath(); ctx.arc(AX, AY, AR, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(avatar, AX - AR, AY - AR, AR * 2, AR * 2);
    ctx.restore();

    ctx.save(); ctx.shadowColor = T.glow; ctx.shadowBlur = 38;
    ctx.strokeStyle = T.c1; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(AX, AY, AR + 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();

    ctx.save(); ctx.strokeStyle = T.c2 + "50"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(AX, AY, AR + 11, 0, Math.PI * 2); ctx.stroke(); ctx.restore();

  } catch (_) {
    ctx.save();
    const pg = ctx.createRadialGradient(AX, AY, 5, AX, AY, AR);
    pg.addColorStop(0, T.c3 + "ee"); pg.addColorStop(1, "#04020e");
    ctx.fillStyle = pg; ctx.shadowColor = T.glow; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(AX, AY, AR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = T.c1; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
  }

  // badge رتبة تحت الصورة
  ctx.save();
  const bw = 116, bh = 26, bx = AX - 58, by = AY + AR + 12;
  ctx.fillStyle = T.c3 + "cc"; rRect(ctx, bx, by, bw, bh, 13); ctx.fill();
  ctx.shadowColor = T.glow; ctx.shadowBlur = 20; ctx.strokeStyle = T.c1; ctx.lineWidth = 1.5;
  rRect(ctx, bx, by, bw, bh, 13); ctx.stroke();
  ctx.font = "bold 13px sans-serif"; ctx.fillStyle = T.c1; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(data.rank, AX, by + bh / 2); ctx.restore();

  // ── منطقة المعلومات (يمين الصورة) ──
  const infoX = AX + AR + 40;
  const infoW = W - infoX - 30;

  // الاسم بـ gradient
  ctx.save(); ctx.shadowColor = T.glow; ctx.shadowBlur = 25;
  let nfs = 46; ctx.font = `bold ${nfs}px sans-serif`;
  while (ctx.measureText(data.username).width > infoW && nfs > 26) { nfs--; ctx.font = `bold ${nfs}px sans-serif`; }
  const ng = ctx.createLinearGradient(infoX, 0, infoX + infoW, 0);
  ng.addColorStop(0, "#ffffff"); ng.addColorStop(0.5, T.c1); ng.addColorStop(1, T.c2);
  ctx.fillStyle = ng; ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(data.username, infoX, 68); ctx.restore();

  // خط تحت الاسم
  ctx.save(); ctx.shadowColor = T.glow; ctx.shadowBlur = 12;
  const ul = ctx.createLinearGradient(infoX, 0, infoX + 320, 0);
  ul.addColorStop(0, T.c1); ul.addColorStop(0.7, T.c2 + "55"); ul.addColorStop(1, "transparent");
  ctx.strokeStyle = ul; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(infoX, 124); ctx.lineTo(infoX + infoW, 124); ctx.stroke(); ctx.restore();

  // ID صغير
  ctx.save(); ctx.font = "11px monospace"; ctx.fillStyle = T.c2 + "70";
  ctx.textAlign = "left"; ctx.fillText("ID: " + data.userID, infoX, 130); ctx.restore();

  // ── صفوف المعلومات (مع إصلاح RTL) ──
  // ✅ الإصلاح: الأيقونة على اليمين، التسمية العربية بعدها، القيمة على اليسار
  const rowData = [
    { label: "الرصيد",  value: formatNum(data.money) + " $", icon: "money", c: T.c1 },
    { label: "الخبرة",  value: formatNum(data.exp) + " XP",  icon: "exp",   c: T.c2 },
    { label: "المستوى", value: `LV. ${data.level}`,           icon: "level", c: T.c1 },
    { label: "الرسائل", value: formatNum(data.msg),           icon: "msg",   c: T.c2 },
  ];

  const rowStartY = 148, rowH = 50, rW = infoW;

  rowData.forEach((row, i) => {
    const ry = rowStartY + i * rowH;

    // خلفية
    ctx.save();
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.02)";
    rRect(ctx, infoX, ry, rW, rowH - 6, 10); ctx.fill(); ctx.restore();

    // شريط جانبي يمين (RTL style) ✅
    ctx.save();
    ctx.shadowColor = row.c; ctx.shadowBlur = 15; ctx.fillStyle = row.c;
    rRect(ctx, infoX + rW - 3, ry, 3, rowH - 6, 2); ctx.fill(); ctx.restore();

    // أيقونة على اليمين ✅
    drawIcon(ctx, infoX + rW - 20, ry + (rowH - 6) / 2, row.icon, row.c, 16);

    // التسمية العربية - محاذاة يمين ✅
    ctx.save();
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "right"; // ✅ RTL
    ctx.textBaseline = "middle";
    ctx.fillStyle = row.c + "cc"; ctx.shadowColor = row.c; ctx.shadowBlur = 8;
    ctx.fillText(row.label, infoX + rW - 38, ry + (rowH - 6) / 2); ctx.restore();

    // القيمة على اليسار ✅
    ctx.save();
    let fs2 = 21; ctx.font = `bold ${fs2}px monospace`;
    while (ctx.measureText(row.value).width > rW * 0.45 && fs2 > 13) { fs2--; ctx.font = `bold ${fs2}px monospace`; }
    ctx.textAlign = "left"; // ✅
    ctx.textBaseline = "middle";
    ctx.shadowColor = row.c; ctx.shadowBlur = 15; ctx.fillStyle = "#ffffff";
    ctx.fillText(row.value, infoX + 12, ry + (rowH - 6) / 2); ctx.restore();
  });

  // ── رقم الترتيب في المجموعة ✅ ──
  const rankNum = data.groupRank || "?";
  const rnX = infoX + rW - 1; // أقصى يمين
  const rnY = 68;
  ctx.save();
  ctx.fillStyle = T.c3 + "bb"; rRect(ctx, rnX - 90, rnY, 88, 30, 8); ctx.fill();
  ctx.shadowColor = T.glow; ctx.shadowBlur = 15; ctx.strokeStyle = T.c2 + "99"; ctx.lineWidth = 1;
  rRect(ctx, rnX - 90, rnY, 88, 30, 8); ctx.stroke();
  drawIcon(ctx, rnX - 80, rnY + 15, "rank_num", T.c1, 14);
  ctx.font = "bold 15px monospace"; ctx.fillStyle = T.c1;
  ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.shadowBlur = 10;
  ctx.fillText(rankNum, rnX - 65, rnY + 15); ctx.restore();

  // ── شريط Progress دائري ──
  const progY = rowStartY + rowData.length * rowH + 4;
  const cR = 32, cX = infoX + cR + 4, cY = progY + cR + 2;

  drawCircularProgress(ctx, cX, cY, cR, data.progress, T);

  ctx.save(); ctx.font = "bold 15px monospace"; ctx.fillStyle = T.c1;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.shadowColor = T.glow; ctx.shadowBlur = 10;
  ctx.fillText(`${Math.round(data.progress)}%`, cX, cY); ctx.restore();

  ctx.save(); ctx.font = "bold 12px monospace"; ctx.fillStyle = T.c2 + "cc";
  ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText("LEVEL PROGRESS", cX + cR + 12, progY + 4);
  ctx.font = "bold 19px monospace"; ctx.fillStyle = T.c1;
  ctx.fillText(formatNum(data.exp) + " XP", cX + cR + 12, progY + 22); ctx.restore();

  // ── فاصل عمودي ──
  ctx.save(); ctx.shadowColor = T.glow; ctx.shadowBlur = 10;
  const dg = ctx.createLinearGradient(0, 60, 0, H - 70);
  dg.addColorStop(0, "transparent"); dg.addColorStop(0.3, T.c2 + "55"); dg.addColorStop(0.7, T.c2 + "55"); dg.addColorStop(1, "transparent");
  ctx.strokeStyle = dg; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(infoX - 18, 60); ctx.lineTo(infoX - 18, H - 70); ctx.stroke(); ctx.restore();

  // ── شريط Rank Timeline (أسفل البطاقة) ✅ ──
  const tlY = H - 42;
  const tlX = 28, tlW = W - 56;

  // خلفية خفية للشريط
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  rRect(ctx, tlX - 10, tlY - 22, tlW + 20, 52, 8); ctx.fill();
  ctx.strokeStyle = T.c2 + "22"; ctx.lineWidth = 1;
  rRect(ctx, tlX - 10, tlY - 22, tlW + 20, 52, 8); ctx.stroke();
  ctx.restore();

  drawRankTimeline(ctx, tlX, tlY, tlW, data.rank, T);

  // ── زوايا زخرفية ──
  ctx.save(); ctx.strokeStyle = T.c2 + "66"; ctx.lineWidth = 2.5; ctx.shadowColor = T.c2; ctx.shadowBlur = 8;
  [[W-52,18,W-18,18,W-18,52],[18,H-52,18,H-18,52,H-18],[18,52,18,18,52,18],[W-52,H-18,W-18,H-18,W-18,H-52]]
    .forEach(([x1,y1,x2,y2,x3,y3]) => { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke(); });
  ctx.restore();

  [[18,18],[W-18,18],[18,H-18],[W-18,H-18]].forEach(([px,py]) => {
    ctx.save(); ctx.fillStyle = T.c1; ctx.shadowColor = T.glow; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  });

  // ── توقيع ──
  ctx.save(); ctx.font = "10px monospace"; ctx.fillStyle = T.c2 + "35";
  ctx.textAlign = "right"; ctx.textBaseline = "bottom";
  ctx.fillText("KIRA SYSTEM v7.0", W - 28, H - 8); ctx.restore();

  return canvas.toBuffer("image/png");
}

// ─────────────────────────────────────────────────────────────
module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID, type, messageReply, mentions } = event;

  try {
    let targetID = senderID;
    if (type === "message_reply") targetID = messageReply.senderID;
    else if (Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];

    const data = await mongodb.getUserData(targetID);
    if (!data || !data.currency)
      return api.sendMessage("❌ لا توجد بيانات لهذا المستخدم.", threadID, messageID);

    const { currency, calculated } = data;
    const userInfo = await api.getUserInfo(targetID);
    const username = (data.user?.name || userInfo[targetID]?.name || "USER").toUpperCase();
    const isDeveloper = global.config?.ADMINBOT?.includes(targetID) || false;

    // ✅ رقم الترتيب — يحتاج إضافة في mongodb.js
    // إذا عندك دالة تجيب ترتيب المستخدم في المجموعة، استخدمها هنا
    // مثال: const groupRank = await mongodb.getUserRank(targetID, threadID);
    const groupRank = data.rank_position ? `#${data.rank_position}` : "#?";

    if (api.setMessageReaction) api.setMessageReaction("⌛", messageID, () => {}, true);

    const card = await createCard({
      userID: targetID,
      username,
      money: currency.money || 0,
      exp: currency.exp || 0,
      level: currency.level || 1,
      msg: currency.messageCount || 0,
      rank: currency.rank || "مبتدئ",
      progress: calculated?.progress || 0,
      groupRank,
      isDeveloper
    });

    const cacheDir = path.join(process.cwd(), "cache");
    fs.ensureDirSync(cacheDir);
    const cachePath = path.join(cacheDir, `bank_${targetID}.png`);
    await fs.writeFile(cachePath, card);

    return api.sendMessage(
      { attachment: fs.createReadStream(cachePath) },
      threadID,
      () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
      },
      messageID
    );

  } catch (e) {
    console.error("❌ خطأ في البنك:", e);
    return api.sendMessage("❌ خطأ: " + e.message, threadID, messageID);
  }
};
