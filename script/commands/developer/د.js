module.exports = {
  config: {
    name: "د",
    version: "1.0.0",
    hasPermssion: 2, // للمطور فقط لضمان أمان البوت
    author: "Kira AI",
    category: "developer",
    description: "تنفيذ أكواد جافا سكريبت مباشرة",
    guide: { ar: ".د [الكود البرمجي]" }
  },

  onStart: async function ({ api, event, args, Users, Threads, Currencies, models }) {
    const { threadID, messageID, senderID } = event;
    const bold = (text) => global.utils.toBoldSans(text);
    
    // تأكد من أن المطور هو فقط من يستخدم الأمر
    if (senderID !== global.config.ADMINBOT[0]) {
      return api.sendMessage("⚠️ هذا الأمر مخصص لمالك البوت فقط!", threadID, messageID);
    }

    const content = args.join(" ");
    if (!content) return api.sendMessage("💡 يرجى كتابة الكود المراد تنفيذه.", threadID, messageID);

    try {
      // دالة التنفيذ
      const evaled = await eval(`(async () => { ${content} })()`);
      
      // تحويل النتيجة إلى نص منسق
      let output = typeof evaled !== "string" ? require("util").inspect(evaled, { depth: 1 }) : evaled;

      return api.sendMessage(
        `⌬ ━━━ ${bold("KIRA EVAL")} ━━━ ⌬\n\n✅ ${bold("الـنـتـيـجـة:")}\n\n${output}\n\n⌬ ━━━━━━━━━━━━━━ ⌬`,
        threadID,
        messageID
      );
    } catch (err) {
      return api.sendMessage(
        `⌬ ━━━ ${bold("EVAL ERROR")} ━━━ ⌬\n\n❌ ${bold("الـخـطـأ:")}\n\n${err.message}\n\n⌬ ━━━━━━━━━━━━━━ ⌬`,
        threadID,
        messageID
      );
    }
  }
};
