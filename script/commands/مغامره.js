module.exports.config = {
  name: "مغامره",
  version: "2.0",
  credits: "ChatGPT + لوفي",
  cooldowns: 5,
  hasPermission: 0,
  description: "مغامرة طويلة ومتشعبة داخل بيت العائلة آدامز",
  commandCategory: "🎮 العاب",
  usePrefix: true
};

module.exports.run = async function ({ api, event }) {
  const { threadID, senderID } = event;

  return api.sendMessage(
    `🏚️ *مرحبًا بك في مغامرة بيت العائلة آدامز!*\n\nهل ترغب بدخول القصر المسكون؟ 👻\n\n🟢 1. نعم\n🔴 2. لا\n\n✍️ أرسل رقم الخيار.`,
    threadID,
    (err, info) => {
      if (!err) {
        global.client.handleReply.push({
          name: "مغامره",
          messageID: info.messageID,
          author: senderID,
          step: 1,
          path: []
        });
      }
    }
  );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, senderID, body } = event;
  const { author, step, messageID, path } = handleReply;

  if (senderID != author) return api.sendMessage("🚫 هذه ليست مغامرتك!", threadID);

  const reply = body.trim();

  api.unsendMessage(messageID); // حذف الرد السابق

  path.push(reply);

  // 🧩 خطوات القصة حسب المرحلة
  const respond = (text, nextStep = null) => {
    api.sendMessage(text, threadID, (err, info) => {
      if (!err && nextStep) {
        global.client.handleReply.push({
          name: "مغامره",
          messageID: info.messageID,
          author: senderID,
          step: nextStep,
          path
        });
      }
    });
  };

  // 👇 مراحل القصة المتفرعة
  if (step === 1) {
    if (reply === "1") {
      respond(`🚪 دخلت القصر وأغلق الباب خلفك...\n\nأمامك ممر طويل ونيران خافتة على الجدران.\n\n1️⃣ تتقدم ببطء\n2️⃣ تنادي: هل من أحد هنا؟`, 2);
    } else {
      respond(`😨 قررت الهرب، لكن الباب أُغلق تلقائيًا! و... سقطت في حفرة! 💀\n\n🔴 نهاية حزينة.`);
    }
  }

  else if (step === 2) {
    if (reply === "1") {
      respond(`🕯️ وجدت لوحة غريبة مكتوب عليها "من يفتح هذا السر، لا عودة له"...\n\n1️⃣ تلمس اللوحة\n2️⃣ تتجاهلها وتكمل`, 3);
    } else {
      respond(`🕸️ صوت في الظلام ردّ عليك "أنت لست مرحبًا هنا"... ثم سقط السقف عليك!\n\n🔴 نهاية مأساوية.`);
    }
  }

  else if (step === 3) {
    if (reply === "1") {
      respond(`🌀 تم امتصاصك داخل اللوحة إلى عالم موازي... ترى نفسك طفلاً مجددًا! 😵‍💫\n\n🟡 نهاية غريبة.`);
    } else {
      respond(`🎻 وجدت باباً سرياً يؤدي إلى قبو.\n\n1️⃣ تدخل القبو\n2️⃣ تتجه للطابق العلوي`, 4);
    }
  }

  else if (step === 4) {
    if (reply === "1") {
      respond(`🔦 في القبو تسمع أصوات همسات وأقدام...\n\n1️⃣ تختبئ خلف برميل\n2️⃣ تواجه الصوت`, 5);
    } else {
      respond(`👁️ في الأعلى، ترى مرآة تعكس شكلك لكن تتحرك من تلقاء نفسها!\n\n1️⃣ تقترب منها\n2️⃣ تكسرها`, 6);
    }
  }

  else if (step === 5) {
    if (reply === "1") {
      respond(`👀 رأيت شخصًا غريبًا يبحث عنك، لكنه لم يرك... ترك شيئًا وراءه.\n\n1️⃣ تلتقطه\n2️⃣ تتراجع`, 7);
    } else {
      respond(`💥 الكائن اقترب منك، ولم تملك فرصة للهروب...\n\n🔴 نهاية حزينة.`);
    }
  }

  else if (step === 6) {
    if (reply === "1") {
      respond(`🪞 المرآة تسحبك داخلها، وتستيقظ في نفس المكان لكن بعد 100 سنة! 👴\n\n🟡 نهاية غريبة.`);
    } else {
      respond(`🩸 عند كسرها، ظهر مفتاح غريب من بين الزجاج...\n\n1️⃣ تأخذه\n2️⃣ تتركه`, 7);
    }
  }

  else if (step === 7) {
    if (reply === "1") {
      respond(`🗝️ المفتاح فتح لك بوابة سرية تؤدي لمكتبة مخفية.\n\n1️⃣ تبحث عن أسرار\n2️⃣ تبحث عن مخرج`, 8);
    } else {
      respond(`😨 تجاهلت المفتاح، لكن سمعت صوتًا يقول: "لقد ضيعت فرصتك"...\n\n🔴 نهاية حزينة.`);
    }
  }

  else if (step === 8) {
    if (reply === "1") {
      respond(`📖 وجدت كتاب تعاويذ فيه سر العائلة، مع تعويذة تفتح بابًا سريًا أخيرًا...\n\n1️⃣ تقرأ التعويذة\n2️⃣ تغلق الكتاب`, 9);
    } else {
      respond(`🚪 وجدت بابًا للخروج، لكن لا يمكنك فتحه بدون مفتاح.\n\n1️⃣ تعود للمفتاح\n2️⃣ تحاول كسره بالقوة`, 9);
    }
  }

  else if (step === 9) {
    if (reply === "1") {
      respond(`🌟 الباب يُفتح، وتجد كنز العائلة آدامز، مخفي منذ قرون!\n\n🟢 *مبروك! فزت بالمغامرة!* 🏆`);
    } else {
      respond(`😱 انفجر الباب، وانهار القصر بالكامل فوقك...\n\n🔴 نهاية حزينة.`);
    }
  }
};
