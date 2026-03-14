module.exports.config = {
  name: "مي",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "عمر + تعديل GPT",
  description: "تعليق في منشور لك (يستخدم @napi-rs/canvas)",
  commandCategory: "صور",
  usages: "مي [نص]",
  cooldowns: 10,
  dependencies: {
    "@napi-rs/canvas": "",
    axios: "",
    "fs-extra": ""
  },
};

module.exports.wrapText = (ctx, text, maxWidth) => {
  return new Promise((resolve) => {
    if (ctx.measureText(text).width < maxWidth) return resolve([text]);
    if (ctx.measureText("W").width > maxWidth) return resolve(null);
    const words = text.split(" ");
    const lines = [];
    let line = "";
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
      if (ctx.measureText(`${line}${words[0]}`).width < maxWidth)
        line += `${words.shift()} `;
      else {
        lines.push(line.trim());
        line = "";
      }
      if (words.length === 0) lines.push(line.trim());
    }
    return resolve(lines);
  });
};

module.exports.run = async function ({ api, event, args, Users }) {
  const { senderID, threadID, messageID } = event;
  const fs = require("fs-extra");
  const axios = require("axios");
  const { createCanvas, loadImage } = require("@napi-rs/canvas");

  const text = args.join(" ");
  if (!text)
    return api.sendMessage("📝 اكتب شي حتى اضيفه للصورة", threadID, messageID);

  const userData = await Users.getData(senderID);
  const namee = userData.name;

  const pathImg = __dirname + "/cache/phub.png";
  const pathAva = __dirname + "/cache/avt.png";

  // تحميل الصورة الشخصية
  const avatarBuffer = (
    await axios.get(
      `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    )
  ).data;
  fs.writeFileSync(pathAva, Buffer.from(avatarBuffer, "utf-8"));

  // تحميل الخلفية
  const bgBuffer = (
    await axios.get("https://i.postimg.cc/9FX3QVXf/Picsart-22-07-31-17-43-49-198.jpg", {
      responseType: "arraybuffer",
    })
  ).data;
  fs.writeFileSync(pathImg, Buffer.from(bgBuffer, "utf-8"));

  const baseImage = await loadImage(pathImg);
  const baseAva = await loadImage(pathAva);
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext("2d");

  // رسم الخلفية
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

  // رسم الصورة الشخصية
  ctx.drawImage(baseAva, 40, 50, 122, 122);

  // اسم المستخدم
  ctx.font = "bold 40px Arial";
  ctx.fillStyle = "#FF9900";
  ctx.textAlign = "start";
  ctx.fillText(namee, 170, 97);

  // النص
  ctx.font = "700 75px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";

  let fontSize = 75;
  while (ctx.measureText(text).width > 1160) {
    fontSize--;
    ctx.font = `700 ${fontSize}px Arial`;
  }

  const lines = await this.wrapText(ctx, text, 1160);
  ctx.fillText(lines.join("\n"), 1250, 263);

  // إخراج الصورة
  const buffer = await canvas.encode("jpeg");
  fs.writeFileSync(pathImg, buffer);
  fs.removeSync(pathAva);

  // إرسال النتيجة فقط
  return api.sendMessage(
    { attachment: fs.createReadStream(pathImg) },
    threadID,
    () => fs.unlinkSync(pathImg),
    messageID
  );
};
