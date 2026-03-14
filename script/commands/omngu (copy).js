module.exports.config = {
  name: "انترو",
  version: "1.0.",
  hasPermssion: 0,
  credits: "عمر",
  description: "انترو",
  usePrefix: true,
  commandCategory: "صور",
  usages: "ننص",
  cooldowns: 2,
};

module.exports.run = async ({api, event, args }) => {
const axios = require('axios');
const fs = require('fs-extra');
 let { threadID, messageID } = event;
  let query = args.join(" ");
  if (!query) return api.sendMessage("انترو Anas \nهيك", threadID, messageID);
let path = __dirname + `/cache/pol14i.mp4`;

  

  const poli = (await axios.get(`https://faheem-vip-010.faheem001.repl.co/api/ephoto/intro2?text=${query}&type=video/mp4`, {
    responseType: "arraybuffer",
  })).data;
  fs.writeFileSync(path, Buffer.from(poli, "utf-8"));
  api.sendMessage({
    body: "❛ ━━━━･❪ 🕊️ ❫ ･━━━━ ❜\nالانترو تبعك 🪽\n❛ ━━━━･❪ 🕊️ ❫ ･━━━━ ❜",
    attachment: fs.createReadStream(path) }, threadID, () => fs.unlinkSync(path), messageID);
};
