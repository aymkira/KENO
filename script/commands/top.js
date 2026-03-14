module.exports.config = {
  name: "توب",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "انس (تحسين ChatGPT)",
  description: "عرض توب [المجموعات / الاموال / المستوى]",
  commandCategory: "ترفيه",
  usages: "[المجموعات/الاموال/المستوى] [عدد]",
  cooldowns: 5
};

module.exports.run = async ({ event, api, args, Currencies, Users }) => {
  const { threadID, messageID } = event;
  const type = args[0];
  const limit = parseInt(args[1]) || 10;

  if (limit <= 0 || isNaN(limit)) {
    return api.sendMessage("❌ يجب أن يكون العدد رقمًا صحيحًا أكبر من صفر.", threadID, messageID);
  }

  // توب المجموعات حسب عدد الرسائل
  if (type === "المجموعات" || type === "thread") {
    try {
      const data = await api.getThreadList(limit, null, ["INBOX"]);
      const threads = data
        .filter(thread => thread.isGroup)
        .map(thread => ({ name: thread.name || "بدون اسم", count: thread.messageCount }))
        .sort((a, b) => b.count - a.count);

      let msg = "🏆 أعلى المجموعات من حيث عدد الرسائل:\n\n";
      threads.forEach((group, i) => {
        msg += `${i + 1}. ${group.name}: ${group.count} رسالة\n`;
      });

      return api.sendMessage(msg, threadID, messageID);
    } catch (err) {
      console.log(err);
      return api.sendMessage("❌ حدث خطأ أثناء جلب بيانات المجموعات.", threadID, messageID);
    }
  }

  // توب المستخدمين حسب المال
  if (type === "الاموال" || type === "money") {
    try {
      let data = await Currencies.getAll(["userID", "money"]);
      const botIDs = [global.data.botID, global.data.userID];

      data = data.filter(u => !botIDs.includes(u.userID));
      data.sort((a, b) => b.money - a.money);
      if (data.length < limit) limit = data.length;

      let msg = `💰 أعلى ${limit} مستخدمين من حيث المال:\n\n`;
      for (let i = 0; i < limit; i++) {
        const name = (await Users.getData(data[i].userID)).name || "مستخدم غير معروف";
        msg += `${i + 1}. ${name} : ${data[i].money}$\n`;
      }

      return api.sendMessage(msg, threadID, messageID);
    } catch (err) {
      console.log(err);
      return api.sendMessage("❌ حدث خطأ أثناء جلب بيانات المستخدمين.", threadID, messageID);
    }
  }

  // توب المستخدمين حسب المستوى (exp)
  if (type === "المستوى" || type === "user") {
    try {
      let data = await Currencies.getAll(["userID", "exp"]);
      const botIDs = [global.data.botID, global.data.userID];

      data = data.filter(u => !botIDs.includes(u.userID));
      data.sort((a, b) => b.exp - a.exp);
      if (data.length < limit) limit = data.length;

      let msg = `📊 أعلى ${limit} مستخدمين من حيث المستوى:\n\n`;
      for (let i = 0; i < limit; i++) {
        const name = (await Users.getData(data[i].userID)).name || "مستخدم غير معروف";
        msg += `${i + 1}. ${name} : ${data[i].exp} نقطة\n`;
      }

      return api.sendMessage(msg, threadID, messageID);
    } catch (err) {
      console.log(err);
      return api.sendMessage("❌ حدث خطأ أثناء جلب بيانات المستوى.", threadID, messageID);
    }
  }

  // إذا لم يكتب المستخدم النوع الصحيح
  return api.sendMessage(
    "❗ استخدم الأمر بالشكل التالي:\n" +
    "توب المجموعات [عدد]\n" +
    "توب الاموال [عدد]\n" +
    "توب المستوى [عدد]\n" +
    "\n📌 العدد اختياري (الافتراضي 10)",
    threadID, messageID
  );
};
