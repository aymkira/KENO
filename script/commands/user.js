module.exports.config = {
	name: "يوزر",
	version: "1.0.0",
	hasPermssion: 2,
	credits: "yassine",
	description: "حظر أو إلغاء حظر مستخدم من البوت",
	commandCategory: "المطور",
	usages: "[بان/نوبان] [ID أو بالرد]",
	cooldowns: 3
};

module.exports.run = async function({ api, event, args, Users }) {
	const { threadID, messageID, senderID, type, messageReply } = event;
	const action = args[0];
	let targetID;
	if (messageReply) {
		targetID = messageReply.senderID;
	} else if (args[1] && !isNaN(args[1])) {
		targetID = args[1];
	} else {
		targetID = senderID;
	}

	const data = (await Users.getData(targetID)).data || {};

	if (action === "بان") {
		if (global.data.userBanned.has(targetID))
			return api.sendMessage(`❗ المستخدم ${targetID} محظور بالفعل.`, threadID, messageID);

		data.banned = true;
		data.reason = "تم الحظر بواسطة الأمر المبسط";
		data.dateAdded = new Date().toLocaleString("ar-EG");

		await Users.setData(targetID, { data });
		global.data.userBanned.set(targetID, {
			reason: data.reason,
			dateAdded: data.dateAdded
		});

		return api.sendMessage(`✅ تم حظر المستخدم ${targetID} من استخدام البوت.`, threadID, messageID);
	}

	if (action === "نوبان") {
		if (!global.data.userBanned.has(targetID))
			return api.sendMessage(`❗ المستخدم ${targetID} غير محظور.`, threadID, messageID);

		data.banned = false;
		data.reason = null;
		data.dateAdded = null;

		await Users.setData(targetID, { data });
		global.data.userBanned.delete(targetID);

		return api.sendMessage(`✅ تم رفع الحظر عن المستخدم ${targetID}.`, threadID, messageID);
	}

	return api.sendMessage("❌ استخدم:\nيوزر بان [ID أو رد]\nأو\nيوزر نوبان [ID أو رد]", threadID, messageID);
};