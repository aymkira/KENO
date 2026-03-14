module.exports.config = {
	name: 'checkwarns',
	eventType: ['log:subscribe'],
	version: '1.0.0',
	credits: 'NTKhang',
	description: 'Listen events',
	dependencies: ''
};

module.exports.run = async function({ api, event, client }) {
	if (event.logMessageType == 'log:subscribe') {
		const fs = require('fs-extra');
		let { threadID, messageID } = event;
		if (!fs.existsSync(__dirname + `/../commands/cache/datawarn.json`)) return;
		var datawarn = JSON.parse(fs.readFileSync(__dirname + `/../commands/cache/datawarn.json`));
		var listban = datawarn.banned[threadID];
		if (!listban) return;
		const allUserThread = (await api.getThreadInfo(event.threadID)).participantIDs;
		for (let info of allUserThread) {
			if (listban.includes(parseInt(info))) {
				api.removeUserFromGroup(parseInt(info), threadID, e => {
					if (e) return api.sendMessage(e, threadID);
					api.sendMessage(
						`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗕𝗔𝗡 ━━ ⌬\n\n⚠️ [${info}]\nتجاوز حد التحذيرات — ممنوع من الدخول`,
						threadID
					);
				});
			}
		}
	}
};
