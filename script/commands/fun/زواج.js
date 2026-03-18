const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");
const jimp  = require("jimp");

module.exports.config = {
  name: "زواج",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "زوجيني من شخص بمنشن أو رد",
  commandCategory: "fun",
  usages: "زواج [@منشن/رد]",
  cooldowns: 5,
};

async function makeCircle(imgPath) {
  const img = await jimp.read(imgPath);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function getAvatar(uid, savePath) {
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
  fs.writeFileSync(savePath, Buffer.from(res.data));
}

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;

  let targetID;
  const mentionIDs = Object.keys(mentions || {});

  if (mentionIDs.length > 0) {
    targetID = mentionIDs[0];
  } else if (type === "message_reply") {
    targetID = messageReply.senderID;
  } else if (args[0] && !isNaN(args[0])) {
    targetID = args[0];
  }

  if (!targetID) return api.sendMessage(
    "⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\n💍 منشن شخص أو رد على رسالته",
    threadID, messageID
  );

  if (targetID === senderID) return api.sendMessage(
    "⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\n😂 ما تقدر تتزوج نفسك!",
    threadID, messageID
  );

  const cacheDir = path.join(__dirname, "cache", "canvas");
  fs.mkdirpSync(cacheDir);

  const bgPath  = path.join(cacheDir, "marry_bg.png");
  const av1Path = path.join(cacheDir, `av1_${senderID}.png`);
  const av2Path = path.join(cacheDir, `av2_${targetID}.png`);
  const outPath = path.join(cacheDir, `marry_${senderID}_${targetID}.png`);

  const cleanup = () => [av1Path, av2Path, outPath].forEach(f => { try { fs.unlinkSync(f); } catch(_){} });

  try {
    const [n1, n2] = await Promise.all([
      Users.getNameUser(senderID).catch(() => "الأول"),
      Users.getNameUser(targetID).catch(() => "الثاني"),
    ]);

    if (!fs.existsSync(bgPath)) {
      const r = await axios.get("https://files.catbox.moe/j8x894.jpg", { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(bgPath, Buffer.from(r.data));
    }

    await Promise.all([getAvatar(senderID, av1Path), getAvatar(targetID, av2Path)]);

    const base = await jimp.read(bgPath);
    const W = base.getWidth(), H = base.getHeight();
    const size = Math.round(W * 0.22);
    const y    = Math.round(H * 0.18);

    const c1 = await jimp.read(await makeCircle(av1Path));
    const c2 = await jimp.read(await makeCircle(av2Path));

    base
      .composite(c1.resize(size, size), Math.round(W * 0.08), y)
      .composite(c2.resize(size, size), Math.round(W * 0.68), y);

    fs.writeFileSync(outPath, await base.getBufferAsync("image/png"));

    return api.sendMessage({
      body: `⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\n💍 ألف مبروك الزواج!\n👨 ${n1}\n        +\n👩 ${n2}\n\n🌹 بالرفاه والبنين 🌹`,
      attachment: fs.createReadStream(outPath),
    }, threadID, () => cleanup(), messageID);

  } catch (e) {
    cleanup();
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 FUN ━━ ⌬\n\n❌ " + e.message, threadID, messageID);
  }
};
