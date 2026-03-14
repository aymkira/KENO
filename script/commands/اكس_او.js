const axios = require("axios");
const fs = require("fs");
const games = new Map();

function generateBoard(board) {
  const display = board.map(cell => cell || '🔲');
  return `${display[0]}${display[1]}${display[2]}\n${display[3]}${display[4]}${display[5]}\n${display[6]}${display[7]}${display[8]}`;
}

function checkWin(board, symbol) {
  const winCombos = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  return winCombos.some(combo => combo.every(i => board[i] === symbol));
}

module.exports.config = {
  name: "اكس_او",
  version: "2.5",
  hasPermission: 0,
  credits: "SOMI + تعديل عشقي اليمن",
  description: "🎮 لعبة إكس أو ضد صديق أو ضد البوت",
  commandCategory: "🎮 الألعاب",
  usages: "[منشن إن أردت]",
  cooldowns: 5,
  handleReply: true
};

module.exports.run = async function({ api, event }) {
  try {
    const mention = Object.keys(event.mentions);
    const player1 = event.senderID;
    let player2;
    let player1Name = (await api.getUserInfo(player1))[player1].name;

    // تحديد الخصم
    if (mention.length === 0) {
      player2 = "bot";
    } else if (mention.length === 1) {
      player2 = mention[0];
    } else {
      return api.sendMessage("⚠️ منشن شخص واحد فقط للعب معه.", event.threadID, event.messageID);
    }

    let player2Name = player2 === "bot" ? "🤖 سومي" : (await api.getUserInfo(player2))[player2].name;

    // تحميل صورة المقدمة
    const imgPath = __dirname + "/xo_intro.jpg";
    const imgURL = "https://i.ibb.co/xSX23BbD/temp-1764460758251.jpg"; // يمكنك تغييرها لأي صورة مقدمة تحب
    const img = (await axios.get(imgURL, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(imgPath, Buffer.from(img, "binary"));

    const board = Array(9).fill(null);
    const symbols = { [player1]: "❌", [player2]: "⭕", bot: "⭕" };

    const introMsg = {
      body: `🎮 **تحدي جديد في لعبة إكس أو!**\n\n👤 ${player1Name} تحدى ${player2Name}!\n\n✨ أرسل رقمًا من 1 إلى 9 لتحديد مكان لعبك:\n\n${generateBoard(board)}\n\n👈 من يبدأ أولًا: ${player1Name}`,
      attachment: fs.createReadStream(imgPath)
    };

    const msg = await api.sendMessage(introMsg, event.threadID);
    fs.unlinkSync(imgPath);

    games.set(`${event.threadID}_${msg.messageID}`, {
      board,
      players: [player1, player2],
      turn: player1,
      symbols,
      messageID: msg.messageID
    });

    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID: msg.messageID,
      threadID: event.threadID,
      players: [player1, player2],
      board,
      turn: player1,
      symbols
    });

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ حدث خطأ أثناء بدء اللعبة.", event.threadID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { players, board, turn, symbols, threadID } = handleReply;
  const player1 = players[0];
  const player2 = players[1];
  const player1Name = (await api.getUserInfo(player1))[player1].name;
  const player2Name = player2 === "bot" ? "🤖 سومي" : (await api.getUserInfo(player2))[player2].name;

  // تجاهل إذا مش لاعب
  if (![player1, player2].includes(event.senderID))
    return api.sendMessage("😴 مش دورك أو مش داخل اللعبة.", event.threadID, event.messageID);

  // تأكد من أن الدور صحيح
  if (event.senderID !== turn)
    return api.sendMessage("⌛ مش دورك، استنى شوي.", event.threadID, event.messageID);

  const num = parseInt(event.body);
  if (isNaN(num) || num < 1 || num > 9) return;
  const index = num - 1;
  if (board[index]) return api.sendMessage("❌ هذه الخانة مأخوذة!", event.threadID, event.messageID);

  // تحديث اللوح
  board[index] = symbols[event.senderID];
  api.unsendMessage(event.messageID);

  // فحص الفوز
  if (checkWin(board, symbols[event.senderID])) {
    return api.sendMessage(`🏆 ${player1 === event.senderID ? player1Name : player2Name} فاز باللعبة! 👑\n\n${generateBoard(board)}`, event.threadID);
  }

  // تعادل
  if (!board.includes(null)) {
    return api.sendMessage(`🤝 تعادل! ما في فائز 😅\n\n${generateBoard(board)}`, event.threadID);
  }

  // تغيير الدور
  let nextTurn;
  if (player2 === "bot") {
    // دور البوت
    const empty = board.map((v, i) => v ? null : i).filter(v => v !== null);
    const randomIndex = empty[Math.floor(Math.random() * empty.length)];
    board[randomIndex] = symbols["bot"];

    if (checkWin(board, symbols["bot"])) {
      return api.sendMessage(`🤖 البوت فاز عليك يا ${player1Name}! 😂\n\n${generateBoard(board)}`, event.threadID);
    }

    if (!board.includes(null)) {
      return api.sendMessage(`🤝 تعادل بينك وبين البوت!\n\n${generateBoard(board)}`, event.threadID);
    }

    nextTurn = player1;
  } else {
    nextTurn = event.senderID === player1 ? player2 : player1;
  }

  const nextTurnName = nextTurn === player1 ? player1Name : player2Name;
  const newMsg = await api.sendMessage(
    `🎮 الدور الآن على: ${nextTurnName}\n\n${generateBoard(board)}\n\n👈 أرسل رقم من 1 إلى 9.`,
    event.threadID
  );

  global.client.handleReply.push({
    name: module.exports.config.name,
    messageID: newMsg.messageID,
    threadID,
    players,
    board,
    turn: nextTurn,
    symbols
  });
};
