const path = require("path");

function getDB() {
  try { return require(path.join(process.cwd(), "includes", "data.js")); }
  catch { return null; }
}

module.exports.config = {
  name:            "اكسو",
  aliases:         ["ttt", "xo"],
  version:         "1.0.0",
  hasPermssion:    0,
  credits:         "ayman",
  description:     "لعبة XO ضد الذكاء الاصطناعي",
  commandCategory: "games",
  usages:          ".اكسو — ابدأ اللعبة ثم رد برقم (1-9)",
  cooldowns:       5,
};

const REWARD = 200;

// ── منطق اللعبة ──────────────────────────────────────────────
function emptyBoard() { return Array(9).fill(null); }

function checkWin(b, p) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return wins.some(w => w.every(i => b[i] === p));
}

function minimax(b, isMax) {
  if (checkWin(b, "O")) return 10;
  if (checkWin(b, "X")) return -10;
  if (b.every(c => c)) return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = "O";
        best = Math.max(best, minimax(b, false));
        b[i] = null;
      }
    }
    return best;
  }
  let best = Infinity;
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = "X";
      best = Math.min(best, minimax(b, true));
      b[i] = null;
    }
  }
  return best;
}

function aiMove(board) {
  let best = -Infinity, idx = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = "O";
      const score = minimax(board, false);
      board[i] = null;
      if (score > best) { best = score; idx = i; }
    }
  }
  return idx;
}

function drawBoard(b) {
  const sym = i => b[i] === "X" ? "❌" : b[i] === "O" ? "⭕" : `${i+1}️⃣`;
  return `${sym(0)}${sym(1)}${sym(2)}\n${sym(3)}${sym(4)}${sym(5)}\n${sym(6)}${sym(7)}${sym(8)}`;
}

// ── Run ───────────────────────────────────────────────────────
module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, senderID } = event;
  const name = await Users.getNameUser(senderID).catch(() => senderID);

  const board = emptyBoard();
  const msg = await api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗫𝗢 ━━ ⌬\n\n👤 ${name} = ❌\n🤖 KIRA = ⭕\n\n${drawBoard(board)}\n\n📩 رد برقم (1-9)`,
    threadID, messageID
  );

  global.client.handleReply.push({
    name:     module.exports.config.name,
    messageID: msg.messageID,
    author:   senderID,
    board,
  });
};

// ── handleReply ───────────────────────────────────────────────
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (String(senderID) !== String(handleReply.author))
    return api.sendMessage("⚠️ مو دورك!", threadID, messageID);

  const pos = parseInt(body.trim()) - 1;
  if (isNaN(pos) || pos < 0 || pos > 8)
    return api.sendMessage("📝 رد برقم من 1 إلى 9", threadID, messageID);

  const board = handleReply.board;

  if (board[pos]) return api.sendMessage("⚠️ هذا المكان محجوز!", threadID, messageID);

  // حركة اللاعب
  board[pos] = "X";

  if (checkWin(board, "X")) {
    const db = getDB();
    if (db) { await db.ensureUser(senderID).catch(()=>{}); await db.addMoney(senderID, REWARD).catch(()=>{}); }
    try { api.unsendMessage(handleReply.messageID); } catch(_) {}
    api.setMessageReaction("🏆", messageID, () => {}, true);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗫𝗢 ━━ ⌬\n\n${drawBoard(board)}\n\n🏆 فزت!\n💰 +${REWARD}$`,
      threadID, messageID
    );
  }

  if (board.every(c => c)) {
    try { api.unsendMessage(handleReply.messageID); } catch(_) {}
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗫𝗢 ━━ ⌬\n\n${drawBoard(board)}\n\n🤝 تعادل!`,
      threadID, messageID
    );
  }

  // حركة الـ AI
  const ai = aiMove(board);
  board[ai] = "O";

  if (checkWin(board, "O")) {
    try { api.unsendMessage(handleReply.messageID); } catch(_) {}
    api.setMessageReaction("😅", messageID, () => {}, true);
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗫𝗢 ━━ ⌬\n\n${drawBoard(board)}\n\n🤖 KIRA فازت!`,
      threadID, messageID
    );
  }

  if (board.every(c => c)) {
    try { api.unsendMessage(handleReply.messageID); } catch(_) {}
    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗫𝗢 ━━ ⌬\n\n${drawBoard(board)}\n\n🤝 تعادل!`,
      threadID, messageID
    );
  }

  // أكمل اللعبة
  try { api.unsendMessage(handleReply.messageID); } catch(_) {}

  const newMsg = await api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗫𝗢 ━━ ⌬\n\n${drawBoard(board)}\n\n📩 دورك — رد برقم (1-9)`,
    threadID, messageID
  );

  global.client.handleReply.push({
    name:      module.exports.config.name,
    messageID: newMsg.messageID,
    author:    senderID,
    board,
  });
};