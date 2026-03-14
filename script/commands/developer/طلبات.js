module.exports.config = {
  name: "طلبات",
  version: "1.2.0",
  hasPermssion: 2,
  credits: "ايمن",
  description: "إدارة طلبات المجموعات بشكل مختصر",
  commandCategory: "developer",
  usages: "طلبات",
  cooldowns: 5
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (senderID != handleReply.author) return;

  const args = body.split(" ");
  const action = args[0].toLowerCase();
  const nums = args.slice(1).map(n => parseInt(n));

  if (!["قبول", "رفض", "اوافق", "ارفض"].includes(action) || nums.length === 0) return;

  let msg = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n";
  try {
    for (let num of nums) {
      let item = handleReply.listRequest[num - 1];
      if (!item) continue;

      if (action === "قبول" || action === "اوافق") {
        await api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\nتم قبول المجموعة بنجاح! شكراً لإضافتي.", item.threadID);
        msg += `✅ تم قبول: ${item.name}\n`;
      } else {
        await api.deleteThread(item.threadID);
        msg += `❌ تم رفض: ${item.name}\n`;
      }
    }
    api.unsendMessage(handleReply.messageID);
    return api.sendMessage(msg, threadID, messageID);
  } catch (e) {
    return api.sendMessage(`❌ خطأ: ${e.message}`, threadID);
  }
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // التحقق من المطور
  if (!global.config.ADMINBOT.includes(senderID)) return;

  const spam = await api.getThreadList(50, null, ["OTHER"]) || [];
  const pending = await api.getThreadList(50, null, ["PENDING"]) || [];
  const all = [...spam, ...pending].filter(t => t.isGroup && t.isSubscribed);

  if (all.length === 0) return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\nلا توجد طلبات مجموعات حالياً.", threadID, messageID);

  let msg = `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗥𝗘𝗤𝗨𝗘𝗦𝗧𝗦 ━━ ⌬\n\n`;
  let listRequest = [];

  for (let i = 0; i < all.length; i++) {
    const t = all[i];
    // تنسيق الطلب كما طلبت (الاسم + عدد الأعضاء)
    msg += `${i + 1}.${t.name || "مجموعة مجهولة"} (${t.participantIDs.length} عضو)\n`;
    listRequest.push({ threadID: t.threadID, name: t.name });
  }

  msg += `\nرد بـ [قبول/رفض] + رقم المجموعة`;

  return api.sendMessage(msg, threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID,
      listRequest: listRequest
    });
  }, messageID);
};
