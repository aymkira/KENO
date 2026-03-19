module.exports.config = {
  name:        "antijoin",
  eventType:   ["log:subscribe"],
  version:     "2.0.0",
  credits:     "ayman",
  description: "منع إضافة أعضاء جدد للمجموعة",
};

module.exports.run = async function({ event, api, Threads, Users }) {
  const { threadID, logMessageData } = event;
  const botID    = String(api.getCurrentUserID());
  const ADMINBOT = (global.config?.ADMINBOT || []).map(String);

  // لو البوت نفسه أُضيف — تجاهل
  if (logMessageData.addedParticipants?.some(i => String(i.userFbId) === botID)) return;

  // جيب إعدادات الكروب
  let data = {};
  try {
    const td = await Threads.getData(threadID);
    data = td?.data || {};
  } catch(_) {}

  // الحماية مفعلة فقط لو antiJoin == true
  if (!data.antiJoin) return;

  const added       = logMessageData.addedParticipants || [];
  const adderID     = String(logMessageData.addedBy || added[0]?.userFbId || "");
  const adderIsAdmin = ADMINBOT.includes(adderID);

  // لو المطور أضاف — اسمح
  if (adderIsAdmin) return;

  // جيب اسم الشخص اللي أضاف
  const adderName = await Users.getNameUser(adderID).catch(() => adderID);

  // اطرد كل الأعضاء الجدد
  const failed = [];
  for (const member of added) {
    const uid = String(member.userFbId);
    if (uid === botID) continue;

    await new Promise(r => setTimeout(r, 1000));
    await new Promise(resolve => {
      api.removeUserFromGroup(uid, threadID, (err) => {
        if (err) failed.push(uid);
        resolve();
      });
    });
  }

  const names = await Promise.all(
    added.map(m => Users.getNameUser(m.userFbId).catch(() => m.userFbId))
  );

  const msg = failed.length
    ? `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗡𝗧𝗜 ━━ ⌬\n\n🚫 وضع مضاد الإضافة مفعّل!\n👤 أضاف: ${adderName}\n👥 ${names.join("، ")}\n⚠️ فشل طرد بعضهم — قد لا أكون أدمن`
    : `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗡𝗧𝗜 ━━ ⌬\n\n🚫 وضع مضاد الإضافة مفعّل!\n👤 أضاف: ${adderName}\n👥 تم طرد: ${names.join("، ")}`;

  return api.sendMessage(msg, threadID);
};
