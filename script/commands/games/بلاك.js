const { createCanvas } = require("@napi-rs/canvas");
const fs = require("fs-extra");
const path = require("path");
const { getUserData, addMoney, removeMoney, ensureUser } = require(path.join(process.cwd(), "includes", "mongodb.js"));

module.exports.config = {
  name: "بلاك",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "العب بلاك جاك ضد الكازينو",
  commandCategory: "games",
  usages: "بلاك [رهان] — لبدء اللعبة\nبلاك سحب — تسحب ورقة\nبلاك وقف — توقف وترى النتيجة",
  cooldowns: 3
};

// ══════════════════════════════════════════
//   CARD DATA
// ══════════════════════════════════════════
const SUITS = ["♠","♥","♦","♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function newDeck() {
  const deck = [];
  for (const s of SUITS)
    for (const v of VALUES)
      deck.push({ suit: s, value: v });
  return deck.sort(() => Math.random() - 0.5);
}

function cardVal(card) {
  if (["J","Q","K"].includes(card.value)) return 10;
  if (card.value === "A") return 11;
  return parseInt(card.value);
}

function handTotal(hand) {
  let total = hand.reduce((sum, c) => sum + cardVal(c), 0);
  let aces = hand.filter(c => c.value === "A").length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isRed(suit) { return suit === "♥" || suit === "♦"; }

// ══════════════════════════════════════════
//   DRAW SINGLE CARD
// ══════════════════════════════════════════
function drawCard(ctx, x, y, card, hidden = false) {
  const CW = 72, CH = 104, CR = 8;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 12; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4;

  if (hidden) {
    // ظهر الورقة
    const bg = ctx.createLinearGradient(x, y, x+CW, y+CH);
    bg.addColorStop(0, "#1e3a5f"); bg.addColorStop(1, "#0f1e30");
    ctx.fillStyle = bg;
    roundRect(ctx, x, y, CW, CH, CR); ctx.fill();
    ctx.strokeStyle = "rgba(100,150,220,0.4)"; ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, CW, CH, CR); ctx.stroke();
    // نقش على الظهر
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = "#4a90d9"; ctx.lineWidth = 1;
    for (let i = 5; i < CW - 5; i += 10) {
      ctx.beginPath(); ctx.moveTo(x+i, y+5); ctx.lineTo(x+i, y+CH-5); ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // وجه الورقة
  ctx.fillStyle = "#fefefe";
  roundRect(ctx, x, y, CW, CH, CR); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 1;
  roundRect(ctx, x, y, CW, CH, CR); ctx.stroke();
  ctx.restore();

  const color = isRed(card.suit) ? "#dc2626" : "#1a1a1a";

  // أعلى يسار
  ctx.save();
  ctx.font = "bold 14px monospace"; ctx.fillStyle = color;
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(card.value, x + 6, y + 5);
  ctx.font = "13px monospace";
  ctx.fillText(card.suit, x + 6, y + 20);
  ctx.restore();

  // أسفل يمين (مقلوب)
  ctx.save();
  ctx.translate(x + CW - 6, y + CH - 5);
  ctx.rotate(Math.PI);
  ctx.font = "bold 14px monospace"; ctx.fillStyle = color;
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(card.value, 0, 0);
  ctx.font = "13px monospace";
  ctx.fillText(card.suit, 0, 15);
  ctx.restore();

  // الرمز في المنتصف
  ctx.save();
  ctx.font = `bold ${card.value === "10" ? 28 : 34}px monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (isRed(card.suit)) { ctx.shadowColor = "#dc2626"; ctx.shadowBlur = 8; }
  ctx.fillText(card.suit, x + CW/2, y + CH/2);
  ctx.restore();
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
  ctx.strokeStyle = color+"55"; ctx.lineWidth = 2.5;
  ctx.shadowColor = color; ctx.shadowBlur = 8;
  [[W-50,18,W-18,18,W-18,50],[18,H-50,18,H-18,50,H-18],[18,50,18,18,50,18],[W-50,H-18,W-18,H-18,W-18,H-50]]
    .forEach(([x1,y1,x2,y2,x3,y3])=>{ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke(); });
  ctx.restore();
}

// ══════════════════════════════════════════
//   DRAW FULL TABLE
// ══════════════════════════════════════════
function drawTable(game, phase) {
  const W = 900, H = 540;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // خلفية طاولة القمار
  const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.8);
  bg.addColorStop(0, "#0d2e1a");
  bg.addColorStop(0.6, "#071a0f");
  bg.addColorStop(1, "#030d06");
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  // نمط الطاولة
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = "#4ade80"; ctx.lineWidth = 0.5;
  for (let x=0; x<W; x+=35) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y=0; y<H; y+=35) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.restore();

  // جسيمات
  let s = 54321;
  const rand = () => { s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff; };
  for (let i=0;i<40;i++) {
    ctx.save();
    ctx.globalAlpha = rand()*0.3+0.05;
    ctx.shadowColor = "#4ade80"; ctx.shadowBlur = 8;
    ctx.fillStyle = "#4ade80";
    ctx.beginPath(); ctx.arc(rand()*W,rand()*H,rand()*1.5+0.2,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // ── إطار وعنوان ──
  ctx.save();
  ctx.shadowColor = "#4ade80"; ctx.shadowBlur = 30;
  ctx.strokeStyle = "#4ade8050"; ctx.lineWidth = 2;
  roundRect(ctx, 12, 12, W-24, H-24, 18); ctx.stroke();
  ctx.restore();

  // عنوان
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  roundRect(ctx, W/2-120, 18, 240, 38, 8); ctx.fill();
  ctx.strokeStyle = "#4ade8040"; ctx.lineWidth = 1;
  roundRect(ctx, W/2-120, 18, 240, 38, 8); ctx.stroke();
  ctx.font = "bold 20px monospace"; ctx.fillStyle = "#4ade80";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "#4ade80"; ctx.shadowBlur = 15;
  ctx.fillText("♠ BLACK JACK ♠", W/2, 37);
  ctx.restore();

  // ── يد الكازينو ──
  const dealerTotal = phase === "playing"
    ? cardVal(game.dealer[0])
    : handTotal(game.dealer);

  ctx.save();
  ctx.font = "bold 15px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(phase === "playing" ? `الكازينو: ${dealerTotal}+?` : `الكازينو: ${dealerTotal}`, W/2, 68);
  ctx.restore();

  const dStartX = W/2 - (game.dealer.length * 40)/2;
  game.dealer.forEach((card, i) => {
    drawCard(ctx, dStartX + i*40, 90, card, phase === "playing" && i > 0);
  });

  // ── فاصل ──
  ctx.save();
  const divG = ctx.createLinearGradient(50, 0, W-50, 0);
  divG.addColorStop(0, "transparent"); divG.addColorStop(0.3, "#4ade8040"); divG.addColorStop(0.7, "#4ade8040"); divG.addColorStop(1, "transparent");
  ctx.strokeStyle = divG; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(50, 215); ctx.lineTo(W-50, 215); ctx.stroke();
  ctx.restore();

  // ── يد اللاعب ──
  const playerTotal = handTotal(game.player);
  const bust = playerTotal > 21;

  ctx.save();
  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = bust ? "#ef4444" : "rgba(255,255,255,0.5)";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(`يدك: ${playerTotal}${bust ? " 💀 تجاوزت!" : ""}`, W/2, 222);
  ctx.restore();

  const pStartX = W/2 - (game.player.length * 40)/2;
  game.player.forEach((card, i) => {
    drawCard(ctx, pStartX + i*40, 244, card, false);
  });

  // ── لوحة السفلى ──
  const botY = 370;

  // الرهان
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(ctx, 28, botY, 200, 60, 10); ctx.fill();
  ctx.strokeStyle = "#f5c84250"; ctx.lineWidth = 1;
  roundRect(ctx, 28, botY, 200, 60, 10); ctx.stroke();
  ctx.font = "bold 12px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("الرهان", 128, botY+8);
  ctx.font = "bold 24px monospace"; ctx.fillStyle = "#f5c842";
  ctx.shadowColor = "#f5c842"; ctx.shadowBlur = 15;
  ctx.textBaseline = "bottom";
  ctx.fillText(game.bet.toLocaleString() + " $", 128, botY+54);
  ctx.restore();

  // الرصيد
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(ctx, W-228, botY, 200, 60, 10); ctx.fill();
  ctx.strokeStyle = "#4ade8050"; ctx.lineWidth = 1;
  roundRect(ctx, W-228, botY, 200, 60, 10); ctx.stroke();
  ctx.font = "bold 12px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("الرصيد", W-128, botY+8);
  ctx.font = "bold 22px monospace"; ctx.fillStyle = "#4ade80";
  ctx.shadowColor = "#4ade80"; ctx.shadowBlur = 15;
  ctx.textBaseline = "bottom";
  ctx.fillText(game.money.toLocaleString() + " $", W-128, botY+54);
  ctx.restore();

  // ── أزرار الأوامر ──
  if (phase === "playing" && !bust) {
    const btns = [
      { label: "بلاك سحب", color: "#3b82f6", glow: "#60a5fa" },
      { label: "بلاك وقف", color: "#ef4444", glow: "#f87171" },
    ];
    btns.forEach((btn, i) => {
      const bx = W/2 - 170 + i*180, by = botY;
      ctx.save();
      ctx.fillStyle = btn.color + "30";
      roundRect(ctx, bx, by, 160, 60, 10); ctx.fill();
      ctx.shadowColor = btn.glow; ctx.shadowBlur = 20;
      ctx.strokeStyle = btn.color; ctx.lineWidth = 1.5;
      roundRect(ctx, bx, by, 160, 60, 10); ctx.stroke();
      ctx.font = "bold 16px sans-serif"; ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(btn.label, bx+80, by+30);
      ctx.restore();
    });
  }

  // ── نتيجة نهائية ──
  if (phase === "result") {
    const pT = handTotal(game.player);
    const dT = handTotal(game.dealer);
    let resultText, resultColor, profit;

    if (pT > 21) {
      resultText = "💀 تجاوزت 21 — خسرت!";
      resultColor = "#ef4444"; profit = -game.bet;
    } else if (dT > 21) {
      resultText = "🏆 الكازينو تجاوز — فزت!";
      resultColor = "#22c55e"; profit = game.bet;
    } else if (pT > dT) {
      resultText = "🏆 فزت!";
      resultColor = "#22c55e"; profit = game.bet;
    } else if (pT < dT) {
      resultText = "💀 خسرت!";
      resultColor = "#ef4444"; profit = -game.bet;
    } else {
      resultText = "🤝 تعادل!";
      resultColor = "#f5c842"; profit = 0;
    }

    ctx.save();
    ctx.shadowColor = resultColor; ctx.shadowBlur = 50;
    ctx.fillStyle = resultColor + "20";
    roundRect(ctx, W/2-200, botY, 400, 65, 14); ctx.fill();
    ctx.strokeStyle = resultColor; ctx.lineWidth = 2;
    roundRect(ctx, W/2-200, botY, 400, 65, 14); ctx.stroke();
    ctx.font = "bold 17px sans-serif"; ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText(resultText, W/2, botY+8);
    ctx.font = "bold 28px monospace"; ctx.fillStyle = resultColor;
    ctx.shadowBlur = 20;
    ctx.textBaseline = "bottom";
    ctx.fillText((profit >= 0 ? "+" : "") + profit.toLocaleString() + " $", W/2, botY+60);
    ctx.restore();
  }

  // توقيع
  ctx.save();
  ctx.font = "10px monospace"; ctx.fillStyle = "#4ade8030";
  ctx.textAlign = "right"; ctx.textBaseline = "bottom";
  ctx.fillText("KIRA BLACKJACK v1.0", W-28, H-12);
  ctx.restore();

  drawCorners(ctx, W, H, "#4ade80");

  return canvas.toBuffer("image/png");
}

// ══════════════════════════════════════════
//   GAME STATE STORAGE
// ══════════════════════════════════════════
const games = new Map();

async function sendImage(api, game, phase, threadID, messageID) {
  const img = drawTable(game, phase);
  const cacheDir = path.join(process.cwd(), "cache");
  fs.ensureDirSync(cacheDir);
  const cachePath = path.join(cacheDir, `bj_${game.playerID}_${Date.now()}.png`);
  await fs.writeFile(cachePath, img);
  return api.sendMessage(
    { attachment: fs.createReadStream(cachePath) },
    threadID,
    () => { try { if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); } catch(_){} },
    messageID
  );
}

// ══════════════════════════════════════════
//   RUN
// ══════════════════════════════════════════
module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID, body } = event;
  const args = body.trim().split(/\s+/).slice(1);
  const cmd = args[0]?.toLowerCase();

  // ── سحب ──
  if (cmd === "سحب") {
    const game = games.get(senderID);
    if (!game) return api.sendMessage("❌ ما عندك لعبة جارية! اكتب: بلاك [رهان]", threadID, messageID);

    game.deck = game.deck || newDeck();
    game.player.push(game.deck.pop());

    const total = handTotal(game.player);
    if (total > 21) {
      // خسر — اشيل الرهان
      await removeMoney(senderID, game.bet);
      game.money -= game.bet;
      games.delete(senderID);
      return sendImage(api, game, "result", threadID, messageID);
    }
    if (total === 21) {
      // 21 تلقائي — وقف ولعب الكازينو
      dealerPlay(game);
      await calcFinalAndSave(game, senderID);
      games.delete(senderID);
      return sendImage(api, game, "result", threadID, messageID);
    }
    return sendImage(api, game, "playing", threadID, messageID);
  }

  // ── وقف ──
  if (cmd === "وقف") {
    const game = games.get(senderID);
    if (!game) return api.sendMessage("❌ ما عندك لعبة جارية!", threadID, messageID);

    dealerPlay(game);
    await calcFinalAndSave(game, senderID);
    games.delete(senderID);
    return sendImage(api, game, "result", threadID, messageID);
  }

  // ── لعبة جديدة ──
  const bet = parseInt(args[0]);
  if (isNaN(bet) || bet < 10)
    return api.sendMessage("❌ اكتب رهاناً صحيحاً (أدنى 10 $)\nمثال: بلاك 200", threadID, messageID);

  if (games.has(senderID))
    return api.sendMessage("❌ عندك لعبة جارية! اكتب: بلاك سحب أو بلاك وقف", threadID, messageID);

  // ── جلب الرصيد من MongoDB ──
  await ensureUser(senderID);
  const userData = await getUserData(senderID);
  const money = userData?.currency?.money ?? 0;

  if (money < bet)
    return api.sendMessage(`❌ رصيدك غير كافٍ! رصيدك: ${money.toLocaleString()} $`, threadID, messageID);

  const deck = newDeck();
  const game = {
    playerID: senderID,
    bet,
    money,
    deck,
    player: [deck.pop(), deck.pop()],
    dealer: [deck.pop(), deck.pop()],
  };

  // بلاك جاك فوري (21 من أول ورقتين)
  if (handTotal(game.player) === 21) {
    const bonus = Math.floor(bet * 1.5);
    await addMoney(senderID, bonus);
    game.money = money + bonus;
    return sendImage(api, game, "result", threadID, messageID);
  }

  games.set(senderID, game);

  // حذف اللعبة بعد 3 دقائق (انتهت المهلة = خسر الرهان)
  setTimeout(async () => {
    if (games.has(senderID)) {
      games.delete(senderID);
      await removeMoney(senderID, bet);
    }
  }, 3 * 60 * 1000);

  return sendImage(api, game, "playing", threadID, messageID);
};

function dealerPlay(game) {
  game.deck = game.deck || newDeck();
  while (handTotal(game.dealer) < 17) {
    game.dealer.push(game.deck.pop());
  }
}

async function calcFinalAndSave(game, userID) {
  const pT = handTotal(game.player);
  const dT = handTotal(game.dealer);
  const bet = game.bet;

  if (pT > 21) {
    // خسر
    await removeMoney(userID, bet);
    game.money = game.money - bet;
  } else if (dT > 21 || pT > dT) {
    // فاز
    await addMoney(userID, bet);
    game.money = game.money + bet;
  } else if (pT < dT) {
    // خسر
    await removeMoney(userID, bet);
    game.money = game.money - bet;
  }
  // تعادل — ما يتغير شيء
}

async function updateMoney(userID, newMoney) {
  try {
    const userData = await getUserData(userID);
    const current = userData?.currency?.money ?? 0;
    const diff = newMoney - current;
    if (diff > 0) await addMoney(userID, diff);
    else if (diff < 0) await removeMoney(userID, Math.abs(diff));
  } catch (_) {}
}
