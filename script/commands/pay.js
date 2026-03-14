module.exports.config = {
  name: "تحويل",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "عمر & Somi",
  description: "حول الفلوس - رد على رسالة الشخص واكتب المبلغ",
  commandCategory: "الاموال",
  usages: "دفع [ رد على الشخص + المبلغ ]",
  cooldowns: 5
};

module.exports.run = async function ({ api, args, event, Currencies, Users }) {
  const fs = require("fs-extra");
  const axios = require("axios");
  const moment = require("moment-timezone");
  const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

  const { threadID, messageID, senderID } = event;
  const time = moment.tz("Asia/Baghdad").format("HH:mm");
  const day = moment.tz("Asia/Baghdad").format("DD/MM/YYYY");

  const info = await api.getUserInfo(senderID);
  const userName = info[senderID]?.name || "مستخدم";

  // 🔹 تحميل الخطوط مرة واحدة
  const fontDir = __dirname + "/cache";
  const font1 = fontDir + "/SplineSans-Medium.ttf";
  const font2 = fontDir + "/SplineSans.ttf";

  if (!fs.existsSync(font1)) {
    const data = (await axios.get("https://drive.google.com/u/0/uc?id=102B8O3_0vTn_zla13wzSzMa-vdTZOCmp&export=download", { responseType: "arraybuffer" })).data;
    fs.writeFileSync(font1, Buffer.from(data));
  }
  if (!fs.existsSync(font2)) {
    const data = (await axios.get("https://drive.google.com/u/0/uc?id=1--V7DANKLsUx57zg8nLD4b5aiPfHcmwD&export=download", { responseType: "arraybuffer" })).data;
    fs.writeFileSync(font2, Buffer.from(data));
  }

  // تسجيل الخطوط
  GlobalFonts.registerFromPath(font1, "SplineSans-Medium");
  GlobalFonts.registerFromPath(font2, "SplineSans");

  // 🔹 معالجة الرد
  if (event.type !== "message_reply") return api.sendMessage("💸 رد على رسالة الشخص الذي تريد تحويل المال له.", threadID, messageID);

  const mention = event.messageReply.senderID;
  const name = (await Users.getData(mention)).name;
  if (isNaN(args[0])) return api.sendMessage("💰 اكتب المبلغ الذي تريد تحويله بعد الأمر.", threadID, messageID);

  const coins = (parseInt(args[0]) * 85) / 100;
  const balance = (await Currencies.getData(senderID)).money;
  if (coins <= 0) return api.sendMessage("⚠️ المبلغ غير صالح.", threadID, messageID);
  if (coins > balance) return api.sendMessage("❌ المبلغ الذي تريد تحويله أكبر من رصيدك.", threadID, messageID);

  // 🔹 تحميل الخلفية
  const bgURL = "https://scontent.xx.fbcdn.net/v/t1.15752-9/575501409_803649095805068_5418244573878361442_n.jpg?stp=dst-jpg_p480x480_tt6&_nc_cat=101&ccb=1-7&_nc_sid=9f807c&_nc_ohc=X5lvuv-k9g4Q7kNvwGLjEVK&_nc_oc=AdmV879nhKICchEK8BkD5kbIb5hmkGR_3IrTSeLHxInmyc-Nrt0D4bo27UoRRzpP-8c&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.xx&oh=03_Q7cD3wHMaO6t3QRh55tiJvL-RBVkHVjOcx-UVcLiFBU10n5iKg&oe=693885B1";
  const bgPath = __dirname + "/cache/transfer-bg.jpg";
  if (!fs.existsSync(bgPath)) {
    const bgData = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(bgPath, Buffer.from(bgData));
  }

  // 🔹 رسم الصورة
  const background = await loadImage(bgPath);
  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // نصوص
  const formattedAmount = args[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sdtList = ["334819875", "334819873", "334819969", "334819439", "334819666", "364819282", "352842956", "334819999", "372842941"];
  const sdt = sdtList[Math.floor(Math.random() * sdtList.length)];

  ctx.fillStyle = "#000";
  ctx.font = "22px SplineSans-Medium";
  ctx.textAlign = "start";
  ctx.fillText(`-${formattedAmount}$`, 88, 1217);
  ctx.fillText(`-${formattedAmount}$`, 320, 370);

  const content = args.slice(1).join(" ") || "بدون ملاحظة";
  ctx.font = "25px SplineSans";
  ctx.fillText(content, 377, 430);

  ctx.font = "23px SplineSans-Medium";
  ctx.textAlign = "right";
  ctx.fillText(userName, 582, 230);

  ctx.fillStyle = "#000";
  ctx.font = "24px SplineSans-Medium";
  ctx.textAlign = "start";
  ctx.fillText(`+84${sdt}`, 297, 265);

  ctx.font = "19px SplineSans-Medium";
  ctx.textAlign = "right";
  ctx.fillText(`${time} - ${day}`, 300, 440);

  // حفظ الصورة
  const outPath = __dirname + `/cache/transfer_${senderID}.png`;
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

  // إرسال الرد
  api.sendMessage("⏳ جاري معالجة التحويل...", threadID, async (err, info) => {
    await new Promise(r => setTimeout(r, 3000));
    await Currencies.increaseMoney(mention, parseInt(coins));
    await Currencies.decreaseMoney(senderID, parseInt(coins));
    api.unsendMessage(info.messageID);

    return api.sendMessage(
      { body: "✅ تم التحويل بنجاح 💸", attachment: fs.createReadStream(outPath) },
      threadID,
      () => fs.unlinkSync(outPath),
      messageID
    );
  });
};
