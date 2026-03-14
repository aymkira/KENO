module.exports.config = {
  name: "ضيفي",
  version: "2.6.0",
  hasPermssion: 2, // للمطور والأدمن فقط حسب إعدادات بوتك
  credits: "ايمن",
  description: "إضافة مستخدم عبر الرابط أو الرد (للمطور فقط)",
  commandCategory: "developer",
  usages: "ضيفي [رابط الحساب] أو بالرد على رسالة بها رابط",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const axios = require("axios");
  const { threadID, messageID, senderID, type, messageReply } = event;

  // 1. التحقق من أن المرسل هو المطور (الأدمن)
  if (!global.config.ADMINBOT.includes(senderID)) {
    return api.sendMessage("❌ هذا الأمر خاص بمطوري أيمن فقط!", threadID, messageID);
  }

  let input = args[0];

  // 2. التحقق إذا كان هناك رد على رسالة تحتوي على رابط
  if (type === "message_reply" && messageReply.body) {
    const regex = /(https?:\/\/[^\s]+)/g;
    const found = messageReply.body.match(regex);
    if (found) input = found[0];
    else if (!isNaN(messageReply.senderID)) input = messageReply.senderID; // إذا كان رد عادي بدون رابط
  }

  if (!input) {
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\nيرجى وضع رابط حساب الشخص أو الرد على رسالته.", threadID, messageID);
  }

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    let idToAdd;

    // 3. استخراج الـ ID إذا كان المدخل رابطاً
    if (input.includes("facebook.com") || input.includes("fb.com")) {
      try {
        // استخدام API خارجي مجاني لتحويل الرابط إلى ID
        const res = await axios.get(`https://share-v2.onrender.com/findid?url=${encodeURIComponent(input)}`);
        idToAdd = res.data.id;
      } catch (e) {
        // محاولة بديلة إذا تعطل الـ API الأول
        const resAlt = await axios.get(`https://id.traodoisub.com/api.php?link=${encodeURIComponent(input)}`);
        idToAdd = resAlt.data.id;
      }
    } else {
      idToAdd = input; // إذا كان المدخل ID جاهز
    }

    if (!idToAdd || isNaN(idToAdd)) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ تعذر استخراج ID الحساب من هذا الرابط.", threadID, messageID);
    }

    // 4. جلب معلومات المجموعة والتأكد من عدم وجود الشخص
    const threadInfo = await api.getThreadInfo(threadID);
    const participantIDs = threadInfo.participantIDs;

    if (participantIDs.includes(idToAdd)) {
      api.setMessageReaction("⚠️", messageID, () => {}, true);
      return api.sendMessage("⚠️ هذا المستخدم موجود بالفعل في المجموعة!", threadID, messageID);
    }

    // 5. محاولة الإضافة
    await api.addUserToGroup(idToAdd, threadID);
    api.setMessageReaction("✅", messageID, () => {}, true);

    if (threadInfo.approvalMode && !threadInfo.adminIDs.some(e => e.id == api.getCurrentUserID())) {
      return api.sendMessage("✅ تم إرسال طلب الإضافة إلى قائمة انتظار الإدارة.", threadID, messageID);
    } else {
      return api.sendMessage("✅ تمت إضافة المستخدم بنجاح إلى المجموعة.", threadID, messageID);
    }

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ تعذر إضافة المستخدم.\n💡 الأسباب المحتملة:\n1. الحساب مغلق (Private).\n2. البوت محظور من إضافة هذا الشخص.\n3. الشخص قام بإلغاء خاصية الإضافة للمجموعات.`, threadID, messageID);
  }
};
