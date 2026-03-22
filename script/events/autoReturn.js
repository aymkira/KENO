// ============================================================
//  autoReturn.js — إعادة أي شخص يطلع من الكروب
//  © 2025 Ayman. All Rights Reserved.
//
//  ✅ إعادة أي شخص يغادر الكروب تلقائياً
//  ✅ تجاهل: البوت + المطرودين + المحظورين + المطورين
//  ✅ تجاهل: الكروبات التي autoReturn = false
//  ✅ تأخير بشري قبل الإعادة
// ============================================================

module.exports.config = {
  name:        "autoReturn",
  eventType:   ["log:unsubscribe"],
  version:     "1.0.0",
  credits:     "ayman",
  description: "إعادة أي شخص يطلع من الكروب تلقائياً",
  envConfig: {
    enable:        true,   // تفعيل/تعطيل عالمياً
    sendMessage:   true,   // إرسال رسالة عند الإعادة
    delayMs:       2000,   // تأخير قبل الإعادة (ms)
  },
};

module.exports.run = async function({ api, event, Threads, Users }) {
  const cfg = global.configModule?.autoReturn || {};

  // ── تحقق من التفعيل العالمي ──────────────────────────────────
  if (cfg.enable === false) return;

  const { threadID, logMessageData } = event;
  const botID    = String(api.getCurrentUserID());
  const ADMINBOT = (global.config?.ADMINBOT || []).map(String);

  const leftID = String(logMessageData?.leftParticipantFbId || "");
  if (!leftID) return;

  // ── تجاهل: البوت نفسه ────────────────────────────────────────
  if (leftID === botID) return;

  // ── تجاهل: المطورين ──────────────────────────────────────────
  if (ADMINBOT.includes(leftID)) return;

  // ── تجاهل: المطرودين الدائمين (_kickedUsers) ─────────────────
  if (global._kickedUsers?.has(leftID)) return;

  // ── تجاهل: المحظورين ─────────────────────────────────────────
  if (global.data?.userBanned?.has(leftID)) return;

  // ── تحقق من إعداد autoReturn للكروب ─────────────────────────
  try {
    const cached = global.data?.threadData?.get(String(threadID));
    // إذا الكروب عنده autoReturn = false → تجاهل
    if (cached?.autoReturn === false) return;
    if (cached?.autoReturn === undefined) {
      const td = await Threads.getData(threadID).catch(() => null);
      if (td?.data?.autoReturn === false) return;
    }
  } catch(_) {}

  // ── تأخير بشري ───────────────────────────────────────────────
  const delay = cfg.delayMs ?? 2000;
  await new Promise(r => setTimeout(r, delay));

  // ── محاولة الإعادة ────────────────────────────────────────────
  try {
    await new Promise((resolve, reject) => {
      api.addUserToGroup([leftID], threadID, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // ── رسالة الإعادة ────────────────────────────────────────────
    if (cfg.sendMessage !== false) {
      let name = global.data?.userName?.get(leftID);
      if (!name) {
        try { name = await Users.getNameUser(leftID); }
        catch(_) { name = leftID; }
      }

      const msgs = [
        `${name} وين تروح؟ 😂 الكروب ما يخليك تطلع! 🔒`,
        `يا ${name}.. ظننت تهرب؟ 😈 البوت أسرع منك!`,
        `${name} جاب رجله ورجعنا! 🔄`,
        `مستحيل تطلع يا ${name}! 😂 إحنا عيلة واحدة!`,
        `${name} حاول يطلع — فشل المهمة 😂✋`,
      ];

      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      api.sendMessage(msg, threadID, () => {});
    }

  } catch(err) {
    const msg = String(err?.message || err || "");

    // إذا البوت مو أدمن
    if (/not.*admin|permission|admin/i.test(msg)) {
      api.sendMessage(
        `⚠️ ما أقدر أرجع الأعضاء — أحتاج صلاحية أدمن في الكروب`,
        threadID, () => {}
      );
      return;
    }

    // إذا الشخص بلّك البوت — تجاهل صامت
    if (/blocked|privacy/i.test(msg)) return;
  }
};
