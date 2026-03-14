const questions = [
  { q: "من هو كابتن قراصنة قبعة القش؟", a: "لوفي" },
  { q: "ما اسم قرية ناروتو؟", a: "كونوها" },
  { q: "من هو خصم غوكو اللدود؟", a: "فيجيتا" },
  { q: "من هو قاتل إيتاتشي؟", a: "ساسكي" },
  { q: "في أنمي ديث نوت، ما اسم صاحب الدفتر؟", a: "لايت" },
  { q: "ما اسم صديق غون المقرب؟", a: "كيلوا" },
  { q: "من هو ملك القراصنة؟", a: "جول دي روجر" },
  { q: "ما اسم السيف الخاص بزورو؟", a: "وادو إيتشيمونجي" },
  { q: "من هو مدرب ناروتو الأول؟", a: "كاكاشي" },
  { q: "ما اسم شخصية الأنمي ذات الشعر الوردي في فايري تيل؟", a: "ناتسو" },
  { q: "ما اسم المنظمة في هجوم العمالقة؟", a: "فيلق الاستطلاع" },
  { q: "من هو المستخدم الأصلي للرينغان؟", a: "ناغاتو" },
  { q: "من هو العبقري في ديث نوت الذي يواجه لايت؟", a: "إل" },
  { q: "ما اسم والد إيتاتشي؟", a: "فوجاكو" },
  { q: "من هو قائد فرقة الشينوبي الطبية؟", a: "تسونادي" },
  { q: "في أنمي بلاك كلوفر، من يملك كتاب السحر الأسود؟", a: "أستا" },
  { q: "من هو صانع أسلحة زورو؟", a: "تينساي" },
  { q: "من هو أول شخص امتلك الشارينغان؟", a: "اندرا" },
  { q: "من هو سايان النقي الذي أحب الأرض؟", a: "غوكو" },
  { q: "من هو صديق إيتاتشي المقرب؟", a: "شيسوي" }
];

module.exports.config = {
  name: "تحدي",
  version: "1.4",
  hasPermssion: 0,
  credits: "ChatGPT + أنت",
  description: "تحدي أنمي بنظام نقاط",
  commandCategory: "🎮 ألعاب",
  usages: "تحدي @عضو | تحدي (لإنهاء التحدي)",
  cooldowns: 5
};

let ongoingChallenges = {};

module.exports.run = async function({ api, event }) {
  const threadID = event.threadID;

  if (!event.mentions || Object.keys(event.mentions).length === 0) {
    if (ongoingChallenges[threadID]) {
      delete ongoingChallenges[threadID];
      return api.sendMessage("❌ تم إنهاء التحدي الحالي.", threadID);
    } else {
      return api.sendMessage("⚠️ لا يوجد تحدي جاري لإنهائه.", threadID);
    }
  }

  const opponentID = Object.keys(event.mentions)[0];
  const challengerID = event.senderID;

  if (challengerID === opponentID)
    return api.sendMessage("❗ لا يمكنك تحدي نفسك!", threadID);

  if (ongoingChallenges[threadID])
    return api.sendMessage("⚠️ يوجد تحدي جاري حاليًا، انتظر حتى ينتهي.", threadID);

  const names = {
    [challengerID]: (await api.getUserInfo(challengerID))[challengerID].name,
    [opponentID]: (await api.getUserInfo(opponentID))[opponentID].name
  };

  ongoingChallenges[threadID] = {
    players: [challengerID, opponentID],
    scores: { [challengerID]: 0, [opponentID]: 0 },
    names,
    currentQuestionIndex: 0,
    currentPlayerIndex: 0,
    status: "waiting_start"
  };

  return api.sendMessage(
    `🔥 بدأ التحدي بين ${names[challengerID]} و ${names[opponentID]}!\n` +
    `الأسئلة 20 عن أنمي بالتناوب.\n` +
    `كل إجابة صحيحة = +100 نقطة.\n\n` +
    `اكتب "ابدأ" أو "انسحب" الآن.`,
    threadID
  );
};

module.exports.handleEvent = async function({ api, event }) {
  const threadID = event.threadID;
  const senderID = event.senderID;
  const msg = (event.body || "").trim().toLowerCase();

  if (!ongoingChallenges[threadID]) return;

  const game = ongoingChallenges[threadID];

  if (game.status === "waiting_start") {
    if (msg === "ابدأ") {
      game.status = "ongoing";
      return api.sendMessage(
        `✅ تم بدء التحدي!\nالسؤال 1 لـ ${game.names[game.players[0]]}:\n${questions[0].q}`,
        threadID
      );
    }
    if (msg === "انسحب") {
      delete ongoingChallenges[threadID];
      return api.sendMessage("🚫 تم إلغاء التحدي.", threadID);
    }
    return;
  }

  if (game.status === "ongoing") {
    const currentPlayer = game.players[game.currentPlayerIndex];
    const currentQ = questions[game.currentQuestionIndex];

    if (senderID !== currentPlayer) return;
    if (!event.messageReply || !event.messageReply.messageID) return;

    if (msg === currentQ.a.toLowerCase()) {
      game.scores[currentPlayer] += 100;
      await api.sendMessage(`🎉 مبروك، الإجابة صح يا ${game.names[currentPlayer]}! حصل على 100 نقطة.`, threadID);
    } else {
      await api.sendMessage(`❌ غلط يا ${game.names[currentPlayer]}! الجواب الصحيح: ${currentQ.a}`, threadID);
    }

    game.currentQuestionIndex++;
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 2;

    if (game.currentQuestionIndex >= questions.length) {
      let result = `🏁 انتهى التحدي!\n\n`;
      result += `${game.names[game.players[0]]}: ${game.scores[game.players[0]]} نقطة\n`;
      result += `${game.names[game.players[1]]}: ${game.scores[game.players[1]]} نقطة\n\n`;

      if (game.scores[game.players[0]] > game.scores[game.players[1]])
        result += `🏆 الفائز: ${game.names[game.players[0]]}`;
      else if (game.scores[game.players[1]] > game.scores[game.players[0]])
        result += `🏆 الفائز: ${game.names[game.players[1]]}`;
      else
        result += `🤝 تعادل بين اللاعبين!`;

      await api.sendMessage(result, threadID);
      delete ongoingChallenges[threadID];
    } else {
      await api.sendMessage(
        `السؤال ${game.currentQuestionIndex + 1} لـ ${game.names[game.players[game.currentPlayerIndex]]}:\n${questions[game.currentQuestionIndex].q}`,
        threadID
      );
    }
  }
};
