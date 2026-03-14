const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const request = require("request");

module.exports.config = {
  name: "صور",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "ايمن",
  description: "البحث في بنترست بـ Headers أصلية (رد بمزيد أو 👍)",
  commandCategory: "pic",
  usages: "صور [نص البحث]",
  cooldowns: 5
};

// --- نظام التفاعل (Reaction) ---
module.exports.handleReaction = async function ({ api, event, handleReaction }) {
  const { threadID, messageID, reaction, userID } = event;
  if (reaction !== "👍") return;

  const { query, offset } = handleReaction;
  return this.run({ api, event, args: [query], isAction: true, newOffset: offset + 10 });
};

// --- نظام الرد (Reply) ---
module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, body } = event;
  if (body.toLowerCase() !== "مزيد") return;

  const { query, offset } = handleReply;
  return this.run({ api, event, args: [query], isAction: true, newOffset: offset + 10 });
};

// --- الأمر الرئيسي ---
module.exports.run = async function({ api, event, args, isAction, newOffset }) {
  const { threadID, messageID } = event;
  const name = args.join(" ").trim();

  if (!name) {
    api.setMessageReaction("⚠️", messageID, () => {}, true);
    return api.sendMessage("⌬ ━━ 𝗞𝗜𝗥𝗔 ━━ ⌬\n\nيرجى كتابة ما تريد البحث عنه!", threadID, messageID);
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);

  // الـ Headers الأصلية اللي طلبتها
  const headers = {
    'authority': 'www.pinterest.com',
    'cache-control': 'max-age=0',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
    'sec-gpc': '1',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'same-origin',
    'sec-fetch-dest': 'empty',
    'accept-language': 'en-US,en;q=0.9',
    'cookie': 'csrftoken=92c7c57416496066c4cd5a47a2448e28; g_state={"i_l":0}; _auth=1; _pinterest_sess=TWc9PSZBMEhrWHJZbHhCVW1OSzE1MW0zSkVid1o4Uk1laXRzdmNwYll3eEFQV0lDSGNRaDBPTGNNUk5JQTBhczFOM0ZJZ1ZJbEpQYlIyUmFkNzlBV2kyaDRiWTI4THFVUWhpNUpRYjR4M2dxblJCRFhESlBIaGMwbjFQWFc2NHRtL3RUcTZna1c3K0VjVTgyejFDa1VqdXQ2ZEQ3NG91L1JTRHZwZHNIcDZraEp1L0lCbkJWUytvRis2ckdrVlNTVytzOFp3ZlpTdWtCOURnbGc3SHhQOWJPTzArY3BhMVEwOTZDVzg5VDQ3S1NxYXZGUEEwOTZBR21LNC9VZXRFTkErYmtIOW9OOEU3ektvY3ZhU0hZWVcxS0VXT3dTaFpVWXNuOHhiQWdZdS9vY24wMnRvdjBGYWo4SDY3MEYwSEtBV2JxYisxMVVsV01McmpKY0VOQ3NYSUt2ZDJaWld6T0RacUd6WktITkRpZzRCaWlCTjRtVXNMcGZaNG9QcC80Ty9ZZWFjZkVGNURNZWVoNTY4elMyd2wySWhtdWFvS2dQcktqMmVUYmlNODBxT29XRWx5dWZSc1FDY0ZONlZJdE9yUGY5L0p3M1JXYkRTUDAralduQ2xxR3VTZzBveUc2Ykx3VW5CQ0FQeVo5VE8wTEVmamhwWkxwMy9SaTNlRUpoQmNQaHREbjMxRlRrOWtwTVI5MXl6cmN1K2NOTFNyU1cyMjREN1ZFSHpHY0ZCR1RocWRjVFZVWG9VcVpwbXNGdlptVzRUSkNadVc1TnlBTVNGQmFmUmtrNHNkVEhXZytLQjNUTURlZXBUMG9GZ3YwQnVNcERDak16Nlp0Tk13dmNsWG82U2xIKyt5WFhSMm1QUktYYmhYSDNhWnB3RWxTUUttQklEeGpCdE4wQlNNOVRzRXE2NkVjUDFKcndvUzNMM2pMT2dGM05WalV2QStmMC9iT055djFsYVBKZjRFTkRtMGZZcWFYSEYvNFJrYTZSbVRGOXVISER1blA5L2psdURIbkFxcTZLT3RGeGswSnRHdGNpN29KdGFlWUxtdHNpSjNXQVorTjR2NGVTZWkwPSZzd3cwOXZNV3VpZlprR0VBempKdjZqS00ybWM9; _b="AV+pPg4VpvlGtL+qN4q0j+vNT7JhUErvp+4TyMybo+d7CIZ9QFohXDj6+jQlg9uD6Zc="; _routing_id="d5da9818-8ce2-4424-ad1e-d55dfe1b9aed"; sessionFunnelEventLogged=1'
  };

  const options = {
    url: 'https://www.pinterest.com/search/pins/?q=' + (encodeURIComponent(name)) + '&rs=typed&term_meta[]=' + (encodeURIComponent(name)) + '%7Ctyped',
    headers: headers
  };

  request(options, async (error, response, body) => {
    try {
      if (error || response.statusCode !== 200) throw new Error("Pinterest Connection Failed");

      const arrMatch = body.match(/https:\/\/i\.pinimg\.com\/originals\/[^.]+\.jpg/g);
      if (!arrMatch || arrMatch.length === 0) {
        api.setMessageReaction("❎", messageID, () => {}, true);
        return api.sendMessage("❌ لم يتم العثور على صور.", threadID, messageID);
      }

      const start = isAction ? newOffset : 0;
      const selected = arrMatch.slice(start, start + 10);
      const attachments = [];
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

      for (let i = 0; i < selected.length; i++) {
        const pathImg = path.join(cacheDir, `kira_${Date.now()}_${i}.jpg`);
        const res = await axios.get(selected[i], { responseType: "arraybuffer" });
        fs.writeFileSync(pathImg, Buffer.from(res.data));
        attachments.push(fs.createReadStream(pathImg));
      }

      return api.sendMessage({
        body: `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗣𝗜𝗖 ━━ ⌬\n\n✅ تم جلب ${attachments.length} صور لـ: ${name}\n\n💡 رد بـ "مزيد" أو 👍 للمزيد.`,
        attachment: attachments
      }, threadID, (err, info) => {
        // حذف الكاش بعد الإرسال
        attachments.forEach(s => { if (fs.existsSync(s.path)) fs.unlinkSync(s.path); });
        api.setMessageReaction("✅", messageID, () => {}, true);

        const data = { name: this.config.name, messageID: info.messageID, query: name, offset: start };
        global.client.handleReply.push(data);
        global.client.handleReaction.push(data);
      }, messageID);

    } catch (e) {
      console.error(e);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ حدث خطأ في الاتصال ببنترست.", threadID, messageID);
    }
  });
};
