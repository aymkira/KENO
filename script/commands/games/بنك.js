
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "بنك",
  version: "8.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "بطاقة بنك مرعبة",
  commandCategory: "games",
  usages: "بنك [@منشن/رد]",
  cooldowns: 5
};

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

function getTheme(rank, isDev) {
  if (isDev) return {
    c1: "#f0abfc", c2: "#c084fc", c3: "#3b0764", glow: "#e879f9",
    bg1: "#0d001a", bg2: "#1a0030", accent: "#7c3aed"
  };
  const map = {
    "مبتدئ":    { c1: "#86efac", c2: "#22c55e", c3: "#052e16", glow: "#4ade80", bg1: "#010d04", bg2: "#031a0a", accent: "#16a34a" },
    "محارب":    { c1: "#fde68a", c2: "#f59e0b", c3: "#3a1a00", glow: "#fbbf24", bg1: "#0d0800", bg2: "#1a1000", accent: "#d97706" },
    "فارس":     { c1: "#7dd3fc", c2: "#0ea5e9", c3: "#001a30", glow: "#38bdf8", bg1: "#00080f", bg2: "#00101e", accent: "#0284c7" },
    "نخبة":     { c1: "#fdba74", c2: "#ea580c", c3: "#3a1000", glow: "#fb923c", bg1: "#0f0500", bg2: "#1e0a00", accent: "#c2410c" },
    "بطل":      { c1: "#fda4af", c2: "#e11d48", c3: "#3a0010", glow: "#fb7185", bg1: "#0f0008", bg2: "#1e0010", accent: "#be123c" },
    "أسطورة":   { c1: "#c4b5fd", c2: "#7c3aed", c3: "#1e0050", glow: "#a78bfa", bg1: "#06001a", bg2: "#0d0030", accent: "#6d28d9" },
    "ملك":      { c1: "#67e8f9", c2: "#06b6d4", c3: "#001a25", glow: "#22d3ee", bg1: "#000d10", bg2: "#00141a", accent: "#0891b2" },
    "إمبراطور": { c1: "#fcd34d", c2: "#d97706", c3: "#3a2000", glow: "#fbbf24", bg1: "#0d0800", bg2: "#1a0f00", accent: "#b45309" },
    "إله":      { c1: "#f9a8d4", c2: "#db2777", c3: "#3a0025", glow: "#ec4899", bg1: "#0f0010", bg2: "#1e0018", accent: "#be185d" },
    "خالد":     { c1: "#fca5a5", c2: "#dc2626", c3: "#3a0000", glow: "#ef4444", bg1: "#0f0000", bg2: "#1e0000", accent: "#b91c1c" },
  };
  return map[rank] || map["مبتدئ"];
}

function getRankLabel(rank, isDev) {
  if (isDev) return "SYSTEM LORD";
  const map = {
    "مبتدئ": "BEGINNER", "محارب": "WARRIOR", "فارس": "KNIGHT",
    "نخبة": "ELITE", "بطل": "HERO", "أسطورة": "LEGEND",
    "ملك": "KING", "إمبراطور": "EMPEROR", "إله": "GOD", "خالد": "IMMORTAL"
  };
  return map[rank] || "BEGINNER";
}

const RANKS_ORDER = ["مبتدئ","محارب","فارس","نخبة","بطل","أسطورة","ملك","إمبراطور","إله","خالد"];

function drawBackground(ctx, W, H, T) {
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, T.bg1);
  bg.addColorStop(0.5, T.bg2);
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const neb1 = ctx.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, H * 0.8);
  neb1.addColorStop(0, T.accent + "18");
  neb1.addColorStop(0.5, T.accent + "06");
  neb1.addColorStop(1, "transparent");
  ctx.fillStyle = neb1;
  ctx.fillRect(0, 0, W, H);

  const neb2 = ctx.createRadialGradient(80, H - 80, 0, 80, H - 80, 300);
  neb2.addColorStop(0, T.c2 + "28");
  neb2.addColorStop(1, "transparent");
  ctx.fillStyle = neb2;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = T.c2;
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 45) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 45) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();
}

function drawParticles(ctx, W, H, T) {
  let s = 99991;
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };

  for (let i = 0; i < 55; i++) {
    const px = rand() * W, py = rand() * H;
    const pr = rand() * 2 + 0.3;
    ctx.save();
    ctx.globalAlpha = rand() * 0.5 + 0.1;
    ctx.shadowColor = i % 4 === 0 ? "#ff0000" : T.c1;
    ctx.shadowBlur = 14;
    ctx.fillStyle = i % 5 === 0 ? "#ff2222" : i % 3 === 0 ? T.c1 : T.c2;
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  for (let i = 0; i < 25; i++) {
    const sx = rand() * W, sy = rand() * H;
    const len = rand() * 22 + 3;
    const angle = rand() * Math.PI * 2;
    ctx.save();
    ctx.globalAlpha = rand() * 0.35 + 0.05;
    ctx.shadowColor = T.c2; ctx.shadowBlur = 10;
    ctx.strokeStyle = rand() > 0.5 ? T.c1 : T.c2;
    ctx.lineWidth = rand() * 1.2 + 0.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
    ctx.stroke(); ctx.restore();
  }

  for (let i = 0; i < 8; i++) {
    const dx = rand() * W, dy = rand() * H * 0.6;
    const dr = rand() * 3 + 1.5;
    ctx.save();
    ctx.globalAlpha = rand() * 0.4 + 0.05;
    ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 12;
    ctx.fillStyle = "#8b0000";
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(dx - dr * 0.5, dy);
    ctx.quadraticCurveTo(dx, dy + dr * 3, dx + dr * 0.5, dy + dr * 0.5);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = 0.022;
  ctx.fillStyle = "#000000";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  ctx.restore();
}

function drawCircularProgress(ctx, cx, cy, radius, progress, T) {
  const start = -Math.PI / 2;
  const end = start + (progress / 100) * Math.PI * 2;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  if (progress > 0) {
    ctx.save();
    ctx.shadowColor = T.glow; ctx.shadowBlur = 25;
    ctx.lineWidth = 10; ctx.lineCap = "round";
    const g = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    g.addColorStop(0, T.c3 + "cc"); g.addColorStop(0.5, T.c2); g.addColorStop(1, T.c1);
    ctx.strokeStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, radius, start, end); ctx.stroke();
    ctx.restore();

    const ex = cx + radius * Math.cos(end), ey = cy + radius * Math.sin(end);
    ctx.save();
    ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 22;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawRankTimeline(ctx, x, y, w, currentRank, T) {
  const ranks = RANKS_ORDER;
  const isDev = !ranks.includes(currentRank);
  const currentIdx = isDev ? ranks.length - 1 : ranks.indexOf(currentRank);
  const spacing = w / (ranks.length - 1);

  ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  ctx.restore();

  if (currentIdx > 0) {
    ctx.save();
    ctx.shadowColor = T.glow; ctx.shadowBlur = 10;
    const pg = ctx.createLinearGradient(x, y, x + spacing * currentIdx, y);
    pg.addColorStop(0, T.c3 + "aa"); pg.addColorStop(1, T.c1);
    ctx.strokeStyle = pg; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + spacing * currentIdx, y); ctx.stroke();
    ctx.restore();
  }

  ranks.forEach((rank, i) => {
    const nx = x + i * spacing;
    const done = i <= currentIdx;
    const isCurrent = i === currentIdx;
    ctx.save();
    if (isCurrent) {
      ctx.shadowColor = T.glow; ctx.shadowBlur = 22;
      ctx.fillStyle = T.c1;
      ctx.beginPath(); ctx.arc(nx, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.35; ctx.strokeStyle = T.c1; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(nx, y, 12, 0, Math.PI * 2); ctx.stroke();
    } else if (done) {
      ctx.shadowColor = T.c2; ctx.shadowBlur = 8;
      ctx.fillStyle = T.c2;
      ctx.beginPath(); ctx.arc(nx, y, 4, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.globalAlpha = 0.2; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(nx, y, 3.5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    if (isCurrent || i === 0 || i === ranks.length - 1) {
      ctx.save();
      ctx.font = isCurrent ? "bold 11px sans-serif" : "9px sans-serif";
      ctx.fillStyle = isCurrent ? T.c1 : "rgba(255,255,255,0.3)";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      if (isCurrent) { ctx.shadowColor = T.glow; ctx.shadowBlur = 10; }
      ctx.fillText(rank, nx, y + 13);
      ctx.restore();
    }
  });
}

async function createCard(data) {
  const W = 980, H = 510;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const T = getTheme(data.rank, data.isDeveloper);
  const RI = getRankLabel(data.rank, data.isDeveloper);

  drawBackground(ctx, W, H, T);
  drawParticles(ctx, W, H, T);

  ctx.save();
  ctx.shadowColor = T.glow; ctx.shadowBlur = 50;
  ctx.strokeStyle = T.c2 + "70"; ctx.lineWidth = 2;
  rRect(ctx, 12, 12, W - 24, H - 24, 20); ctx.stroke();
  ctx.restore();

  ctx.save();
  const glass = ctx.createLinearGradient(0, 0, 0, H);
  glass.addColorStop(0, "rgba(255,255,255,0.03)");
  glass.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = glass;
  rRect(ctx, 12, 12, W - 24, H - 24, 20); ctx.fill();
  ctx.restore();

  ctx.save(); ctx.shadowColor = T.glow; ctx.shadowBlur = 18;
  const topLine = ctx.createLinearGradient(0, 0, W, 0);
  topLine.addColorStop(0, "transparent");
  topLine.addColorStop(0.25, T.c1);
  topLine.addColorStop(0.75, T.c1);
  topLine.addColorStop(1, "transparent");
  ctx.strokeStyle = topLine; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(70, 13); ctx.lineTo(W - 70, 13); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  rRect(ctx, 24, 22, 165, 36, 7); ctx.fill();
  ctx.strokeStyle = T.c2 + "55"; ctx.lineWidth = 1;
  rRect(ctx, 24, 22, 165, 36, 7); ctx.stroke();
  ctx.fillStyle = T.c1; ctx.shadowColor = T.glow; ctx.shadowBlur = 10;
  ctx.fillRect(33, 33, 6, 6);
  ctx.fillStyle = T.c2; ctx.fillRect(41, 33, 4, 4);
  ctx.fillStyle = T.c1 + "80"; ctx.fillRect(47, 35, 3, 3);
  ctx.font = "bold 17px monospace"; ctx.fillStyle = T.c1;
  ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.shadowBlur = 14;
  ctx.fillText("KIRA", 56, 40);
  ctx.fillStyle = "#ffffff"; ctx.shadowBlur = 0;
  ctx.fillText("BANK", 102, 40);
  ctx.restore();

  ctx.save();
  const rw = 145, rh = 36, rx = W - rw - 24;
  ctx.fillStyle = T.c3 + "bb"; rRect(ctx, rx, 22, rw, rh, 7); ctx.fill();
  ctx.shadowColor = T.glow; ctx.shadowBlur = 25; ctx.strokeStyle = T.c1 + "cc"; ctx.lineWidth = 1.5;
  rRect(ctx, rx, 22, rw, rh, 7); ctx.stroke();
  ctx.font = "bold 14px monospace"; ctx.fillStyle = T.c1;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(RI, rx + rw / 2, 40);
  ctx.restore();

  const AX = 120, AY = Math.floor(H / 2) - 20, AR = 118;

  try {
    const avatarURL = `https://graph.facebook.com/${data.userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const res = await axios.get(avatarURL, { responseType: "arraybuffer", timeout: 10000 });
    const avatar = await loadImage(Buffer.from(res.data));

    const ag = ctx.createRadialGradient(AX, AY, 0, AX, AY, AR * 2.8);
    ag.addColorStop(0, T.c2 + "35"); ag.addColorStop(0.5, T.c3 + "12"); ag.addColorStop(1, "transparent");
    ctx.fillStyle = ag; ctx.fillRect(AX - AR * 3, AY - AR * 3, AR * 6, AR * 6);

    for (let i = 3; i >= 1; i--) {
      ctx.save(); ctx.globalAlpha = 0.07 / i;
      ctx.strokeStyle = T.c1; ctx.lineWidth = 1; ctx.setLineDash([5, 10]);
      ctx.beginPath(); ctx.arc(AX, AY, AR + i * 18, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }

    ctx.save();
    ctx.beginPath(); ctx.arc(AX, AY, AR, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(avatar, AX - AR, AY - AR, AR * 2, AR * 2);
    ctx.restore();

    ctx.save(); ctx.shadowColor = T.glow; ctx.shadowBlur = 45;
    ctx.strokeStyle = T.c1; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(AX, AY, AR + 3, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.save(); ctx.strokeStyle = T.c2 + "45"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(AX, AY, AR + 13, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

  } catch (_) {
    ctx.save();
    const pg = ctx.createRadialGradient(AX, AY, 5, AX, AY, AR);
    pg.addColorStop(0, T.c3 + "ee"); pg.addColorStop(1, "#000000");
    ctx.fillStyle = pg; ctx.shadowColor = T.glow; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(AX, AY, AR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = T.c1; ctx.lineWidth = 4; ctx.stroke();
    ctx.font = "bold 60px monospace"; ctx.fillStyle = T.c1 + "80";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("?", AX, AY);
    ctx.restore();
  }

  ctx.save();
  const bw = 120, bh = 28, bx = AX - 60, by = AY + AR + 12;
  ctx.fillStyle = T.c3 + "cc"; rRect(ctx, bx, by, bw, bh, 14); ctx.fill();
  ctx.shadowColor = T.glow; ctx.shadowBlur = 20; ctx.strokeStyle = T.c1; ctx.lineWidth = 1.5;
  rRect(ctx, bx, by, bw, bh, 14); ctx.stroke();
  ctx.font = "bold 14px sans-serif"; ctx.fillStyle = T.c1;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(data.rank, AX, by + bh / 2);
  ctx.restore();

  const infoX = AX + AR + 45;
  const infoW = W - infoX - 30;

  ctx.save(); ctx.shadowColor = T.glow; ctx.shadowBlur = 28;
  let nfs = 46; ctx.font = `bold ${nfs}px sans-serif`;
  while (ctx.measureText(data.username).width > infoW && nfs > 26) {
    nfs--; ctx.font = `bold ${nfs}px sans-serif`;
  }
  const ng = ctx.createLinearGradient(infoX, 0, infoX + infoW, 0);
  ng.addColorStop(0, "#ffffff"); ng.addColorStop(0.5, T.c1); ng.addColorStop(1, T.c2);
  ctx.fillStyle = ng; ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(data.username, infoX, 68);
  ctx.restore();

  ctx.save(); ctx.shadowColor = T.glow; ctx.shadowBlur = 12;
  const ul = ctx.createLinearGradient(infoX, 0, infoX + 340, 0);
  ul.addColorStop(0, T.c1); ul.addColorStop(0.7, T.c2 + "55"); ul.addColorStop(1, "transparent");
  ctx.strokeStyle = ul; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(infoX, 122); ctx.lineTo(infoX + infoW, 122); ctx.stroke();
  ctx.restore();

  ctx.save(); ctx.font = "11px monospace"; ctx.fillStyle = T.c2 + "70";
  ctx.textAlign = "left"; ctx.fillText("ID: " + data.userID, infoX, 128);
  ctx.restore();

  const rowData = [
    { label: "الرصيد",  value: formatNum(data.money) + " $", c: T.c1 },
    { label: "الخبرة",  value: formatNum(data.exp) + " XP",  c: T.c2 },
    { label: "المستوى", value: "LV. " + data.level,          c: T.c1 },
    { label: "الرسائل", value: formatNum(data.msg),           c: T.c2 },
  ];

  const rowStartY = 146, rowH = 50;

  rowData.forEach((row, i) => {
    const ry = rowStartY + i * rowH;
    ctx.save();
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.2)";
    rRect(ctx, infoX, ry, infoW, rowH - 6, 10); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = row.c; ctx.shadowBlur = 18; ctx.fillStyle = row.c;
    rRect(ctx, infoX + infoW - 4, ry, 4, rowH - 6, 2); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillStyle = row.c + "cc"; ctx.shadowColor = row.c; ctx.shadowBlur = 10;
    ctx.fillText(row.label, infoX + infoW - 16, ry + (rowH - 6) / 2);
    ctx.restore();

    ctx.save();
    let fs2 = 22; ctx.font = `bold ${fs2}px monospace`;
    while (ctx.measureText(row.value).width > infoW * 0.5 && fs2 > 13) {
      fs2--; ctx.font = `bold ${fs2}px monospace`;
    }
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.shadowColor = row.c; ctx.shadowBlur = 16; ctx.fillStyle = "#ffffff";
    ctx.fillText(row.value, infoX + 14, ry + (rowH - 6) / 2);
    ctx.restore();
  });

  const progY = rowStartY + rowData.length * rowH + 6;
  const cR = 32, cX = infoX + cR + 6, cY = progY + cR + 2;

  drawCircularProgress(ctx, cX, cY, cR, data.progress, T);

  ctx.save(); ctx.font = "bold 14px monospace"; ctx.fillStyle = T.c1;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = T.glow; ctx.shadowBlur = 10;
  ctx.fillText(Math.round(data.progress) + "%", cX, cY);
  ctx.restore();

  ctx.save();
  ctx.font = "bold 11px monospace"; ctx.fillStyle = T.c2 + "cc";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText("LEVEL PROGRESS", cX + cR + 14, progY + 6);
  ctx.font = "bold 18px monospace"; ctx.fillStyle = T.c1;
  ctx.shadowColor = T.glow; ctx.shadowBlur = 12;
  ctx.fillText(formatNum(data.exp) + " XP", cX + cR + 14, progY + 24);
  ctx.restore();

  ctx.save(); ctx.shadowColor = T.glow; ctx.shadowBlur = 8;
  const dg = ctx.createLinearGradient(0, 60, 0, H - 80);
  dg.addColorStop(0, "transparent");
  dg.addColorStop(0.3, T.c2 + "45");
  dg.addColorStop(0.7, T.c2 + "45");
  dg.addColorStop(1, "transparent");
  ctx.strokeStyle = dg; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(infoX - 20, 60); ctx.lineTo(infoX - 20, H - 80); ctx.stroke();
  ctx.restore();

  const tlY = H - 45;
  const tlX = 30, tlW = W - 60;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  rRect(ctx, tlX - 12, tlY - 24, tlW + 24, 56, 10); ctx.fill();
  ctx.strokeStyle = T.c2 + "20"; ctx.lineWidth = 1;
  rRect(ctx, tlX - 12, tlY - 24, tlW + 24, 56, 10); ctx.stroke();
  ctx.restore();

  drawRankTimeline(ctx, tlX, tlY, tlW, data.rank, T);

  ctx.save(); ctx.strokeStyle = T.c2 + "60"; ctx.lineWidth = 2.5;
  ctx.shadowColor = T.c2; ctx.shadowBlur = 10;
  [
    [W-54,18,W-18,18,W-18,54],
    [18,H-54,18,H-18,54,H-18],
    [18,54,18,18,54,18],
    [W-54,H-18,W-18,H-18,W-18,H-54]
  ].forEach(([x1,y1,x2,y2,x3,y3]) => {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke();
  });
  ctx.restore();

  [[18,18],[W-18,18],[18,H-18],[W-18,H-18]].forEach(([px,py]) => {
    ctx.save(); ctx.fillStyle = T.c1; ctx.shadowColor = T.glow; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  });

  ctx.save(); ctx.font = "10px monospace"; ctx.fillStyle = T.c2 + "30";
  ctx.textAlign = "right"; ctx.textBaseline = "bottom";
  ctx.fillText("KIRA SYSTEM v8.0", W - 28, H - 10);
  ctx.restore();

  return canvas.toBuffer("image/png");
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID, type, messageReply, mentions } = event;

  try {
    let targetID = senderID;
    if (type === "message_reply") targetID = messageReply.senderID;
    else if (Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];

    // ── data.js ──────────────────────────────────────
    const db_inst = getDB();
    let wallet = {};
    let userRecord = {};
    if (db_inst) {
      wallet     = await db_inst.getWallet(targetID).catch(() => ({}));
      userRecord = await db_inst.getUser(targetID).catch(() => ({}));
    }

    const money    = wallet.money   || 0;
    const exp      = wallet.exp     || 0;
    const level    = wallet.level   || 1;
    const rank     = wallet.rank    || "مبتدئ";
    const msg      = userRecord.totalMessages || 0;
    const expNeeded = level * 100;
    const progress = Math.min(((exp % expNeeded) / expNeeded) * 100, 100);

    const userInfo = await api.getUserInfo(targetID).catch(() => ({}));
    const username = (userInfo[targetID]?.name || "USER").toUpperCase();
    const isDeveloper = !!(global.config?.ADMINBOT?.includes(targetID));
    const groupRank = currency.rank_position ? "#" + currency.rank_position : "#?";

    if (api.setMessageReaction) api.setMessageReaction("⌛", messageID, () => {}, true);

    const card = await createCard({
      userID: targetID,
      username,
      money,
      exp,
      level,
      msg,
      rank,
      progress,
      groupRank,
      isDeveloper
    });

    const cacheDir = path.join(process.cwd(), "cache");
    fs.ensureDirSync(cacheDir);
    const cachePath = path.join(cacheDir, `bank_${targetID}_${Date.now()}.png`);
    await fs.writeFile(cachePath, card);

    return api.sendMessage(
      { attachment: fs.createReadStream(cachePath) },
      threadID,
      () => {
        try { if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); } catch (_) {}
        if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
      },
      messageID
    );

  } catch (e) {
    console.error("❌ خطأ في البنك:", e);
    return api.sendMessage("❌ خطأ: " + e.message, threadID, messageID);
  }
};
