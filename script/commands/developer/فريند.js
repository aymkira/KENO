module.exports.config = {
  name: "فريند",
  version: "2.3.0",
  hasPermssion: 2,
  credits: "ايمن",
  description: "إدارة قائمة الأصدقاء (حذف، بحث، تنظيف)",
  commandCategory: "developer",
  usages: "فريند [اسم أو بدون]",
  cooldowns: 5
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  // التحقق من أن صاحب الأمر هو من يرد
  if (String(senderID) !== String(handleReply.author)) return;

  const choice = body.toLowerCase();

  if (choice === "الغاء") {
    api.unsendMessage(handleReply.messageID);
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\nتم إلغاء العملية بنجاح.", threadID);
  }

  // حذف الكل في القائمة المعروضة
  if (choice === "الكل") {
    api.unsendMessage(handleReply.messageID);
    let count = 0;
    for (let uid of handleReply.uids) {
      try {
        await api.unfriend(uid);
        count++;
      } catch (e) { console.log(e) }
    }
    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n✅ تم تنظيف القائمة وحذف ${count} صديق.`, threadID);
  }

  // حذف رقم محدد
  const num = parseInt(choice);
  if (!isNaN(num) && num > 0 && num <= handleReply.uids.length) {
    const uid = handleReply.uids[num - 1];
    const name = handleReply.names[num - 1];
    
    try {
      await api.unfriend(uid);
      api.unsendMessage(handleReply.messageID);
      return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\n✅ تم حذف الصديق: ${name} بنجاح.`, threadID);
    } catch (e) {
      return api.sendMessage("❌ فشل الحذف، قد يكون الحساب معطلاً أساساً.", threadID);
    }
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // التحقق من المطور من ملف الكونفيج
  if (!global.config.ADMINBOT.includes(senderID)) return;

  try {
    const friends = await api.getFriendsList();
    if (!friends || friends.length === 0) {
        return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\nقائمة الأصدقاء فارغة.", threadID);
    }

    let search = args.join(" ").toLowerCase();
    let filtered = search ? friends.filter(f => f.fullName.toLowerCase().includes(search)) : friends.slice(0, 20);

    if (filtered.length === 0) return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\nلا توجد نتائج مطابقة لبحثك.", threadID);

    let msg = `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n`;
    let uids = [];
    let names = [];
    
    filtered.forEach((f, i) => {
      msg += `${i + 1}. ${f.fullName}\n`;
      uids.push(f.userID);
      names.push(f.fullName);
    });

    msg += `\n━━━━━━━━━━━━━━━\n💡 رد بـ [رقم] للحذف\n💡 رد بـ [الكل] لحذف القائمة أعلاه\n💡 رد بـ [الغاء] للإغلاق`;

    return api.sendMessage(msg, threadID, (err, info) => {
      if (err) return console.log(err);
      global.client.handleReply.push({
        name: this.config.name,
        author: senderID,
        messageID: info.messageID,
        uids: uids,
        names: names,
        type: "reply" // إضافة النوع لضمان عمل الـ handle
      });
    }, messageID);

  } catch (e) {
    console.log(e);
    return api.sendMessage("❌ خطأ: لم أستطع جلب قائمة الأصدقاء.", threadID);
  }
};
