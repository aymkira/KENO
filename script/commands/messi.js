module.exports.config = {
	name: "ميسي",
	version: "1.0.2",
	hasPermssion: 0,
	credits: "عمر + تعديل GPT",
	description: "الكتابة على منشور مزيف لميسي باستخدام مكتبة @napi-rs/canvas",
	commandCategory: "صور",
	usages: "ميسي [نص]",
	cooldowns: 10,
	dependencies: {
		"@napi-rs/canvas": "",
		"axios": "",
		"fs-extra": ""
	}
};

module.exports.wrapText = (ctx, text, maxWidth) => {
	return new Promise(resolve => {
		if (ctx.measureText(text).width < maxWidth) return resolve([text]);
		if (ctx.measureText('W').width > maxWidth) return resolve(null);
		const words = text.split(' ');
		const lines = [];
		let line = '';
		while (words.length > 0) {
			let split = false;
			while (ctx.measureText(words[0]).width >= maxWidth) {
				const temp = words[0];
				words[0] = temp.slice(0, -1);
				if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
				else {
					split = true;
					words.splice(1, 0, temp.slice(-1));
				}
			}
			if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
			else {
				lines.push(line.trim());
				line = '';
			}
			if (words.length === 0) lines.push(line.trim());
		}
		return resolve(lines);
	});
};

module.exports.run = async function({ api, event, args }) {
	const { threadID, messageID } = event;
	const fs = require("fs-extra");
	const axios = require("axios");
	const { createCanvas, loadImage } = require("@napi-rs/canvas");

	const text = args.join(" ");
	if (!text) return api.sendMessage("✍️ | قم بكتابة شيء ليظهر على منشور ميسي.", threadID, messageID);

	const pathImg = __dirname + "/cache/messi_fake.jpg";
	const background = (await axios.get("https://i.postimg.cc/SNz6vxYx/Picsart-22-10-16-21-04-30-217.jpg", { responseType: "arraybuffer" })).data;
	fs.writeFileSync(pathImg, Buffer.from(background, "utf-8"));

	const base = await loadImage(pathImg);
	const canvas = createCanvas(base.width, base.height);
	const ctx = canvas.getContext("2d");

	ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
	ctx.font = "bold 45px Arial";
	ctx.fillStyle = "#ffffff";
	ctx.textAlign = "start";

	let fontSize = 45;
	while (ctx.measureText(text).width > 1160) {
		fontSize--;
		ctx.font = `bold ${fontSize}px Arial`;
	}

	const lines = await this.wrapText(ctx, text, 1160);
	ctx.fillText(lines.join('\n'), 60, 170);

	const buffer = await canvas.encode("jpeg");
	fs.writeFileSync(pathImg, buffer);

	return api.sendMessage(
		{ attachment: fs.createReadStream(pathImg) },
		threadID,
		() => fs.unlinkSync(pathImg),
		messageID
	);
};
