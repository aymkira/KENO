module.exports.config = {
	name: "ثريد",
	version: "1.1.0",
	hasPermssion: 2,
	credits: "yassine",
	description: "حظر أو إلغاء حظر مجموعة من استخدام البوت (الحالية أو بإدخال ID)",
	commandCategory: "المطور",
	usages: "[بان/نوبان] [id اختياري]",
	cooldowns: 3
};

module.exports.run = async function({ api, event, args, Threads }) {
	const { threadID: currentThreadID, messageID } = event;
	const action = args[0];
	const targetThreadID = args[1] && !isNaN(args[1]) ? args[1] : currentThreadID;

	const threadData = (await Threads.getData(targetThreadID)).data || {};

	if (action === "بان") {
		if (global.data.threadBanned.has(targetThreadID))
			return api.sendMessage(`❗ المجموعة ${targetThreadID} محظورة بالفعل.`, currentThreadID, messageID);

		threadData.banned = true;
		threadData.reason = "تم الحظر بواسطة الأمر المبسط";
		threadData.dateAdded = new Date().toLocaleString("ar-EG");

		await Threads.setData(targetThreadID, { data: threadData });
		global.data.threadBanned.set(targetThreadID, {
			reason: threadData.reason,
			dateAdded: threadData.dateAdded
		});

		return api.sendMessage(`✅ تم حظر المجموعة ${targetThreadID} من استخدام البوت.`, currentThreadID, messageID);
	}

	if (action === "نوبان") {
		if (!global.data.threadBanned.has(targetThreadID))
			return api.sendMessage(`❗ المجموعة ${targetThreadID} غير محظورة.`, currentThreadID, messageID);

		threadData.banned = false;
		threadData.reason = null;
		threadData.dateAdded = null;

		await Threads.setData(targetThreadID, { data: threadData });
		global.data.threadBanned.delete(targetThreadID);

		return api.sendMessage(`✅ تم رفع الحظر عن المجموعة ${targetThreadID}.`, currentThreadID, messageID);
	}

	return api.sendMessage("❌ استخدم:\nثريد بان [id]\nأو\nثريد نوبان [id]", currentThreadID, messageID);
};