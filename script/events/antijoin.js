module.exports.config = {
  name:        "antijoin",
  eventType:   ["log:subscribe"],
  version:     "2.1.0",
  credits:     "ayman",
  description: "منع إضافة أعضاء جدد للمجموعة",
};

module.exports.run = async function({ event, api, Threads, Users }) {
  const { threadID, logMessageData } = event;
  const botID    = String(api.getCurrentUserID());
  const ADMINBOT = (global.config?.ADMINBOT || []).map(String);

  // لو البوت أُضيف — تجاهل
  const added = logMessageData.addedParticipants || [];
  if (added.some(i => String(i.userFbId) === botID)) return;
  if (!added.length) return;

  // جيب إعدادات الكروب من الذاكرة أولاً
  let antiJoin = false;
  try {
    const cached = global.data?.threadData?.get(String(threadID));
    antiJoin = cached?.antiJoin === true;
    if (!antiJoin) {
      const td = await Threads.getData(threadID);
      antiJoin = td?.data?.antiJoin === true;
    }
  } catch(_) {}

  if (!antiJoin) return;

  // المطور أضاف — اسمح
  const adderID = String(added[0]?.addedBy || logMessageData.addedBy || "");
  if (ADMINBOT.includes(adderID)) return;

  // اطرد الأعضاء الجدد
  let kicked = 0, failed = 0;
  for (const member of added) {
    const uid = String(member.userFbId);
    if (uid === botID) continue;
    await new Promise(r => setTimeout(r, 800));
    await new Promise(resolve => {
      api.removeUserFromGroup(uid, threadID, err => {
        err ? failed++ : kicked++;
        resolve();
      });
    });
  }

  const adderName = await Users.getNameUser(adderID).catch(() => adderID);

  let msg = `🚫 مضاد الإضافة\n👤 ${adderName}`;
  if (kicked)  msg += `\n✅ طُرد: ${kicked}`;
  if (failed)  msg += `\n❌ فشل: ${failed} — تأكد إن البوت أدمن`;

  return api.sendMessage(msg, threadID);
};
