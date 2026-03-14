
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const request = require("request");

// ===== أنظمة الذاكرة اللحظية =====
if (!global.akinatorSession) global.akinatorSession = new Map();

module.exports.config = {
  name: "اكيناتور",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أيمن",
  description: "لعبة أكيناتور - كيرا تحزر الشخصية اللي ببالك",
  commandCategory: "games",
  usages: ".اكيناتور [ابدأ / جوابك]",
  cooldowns: 3,
};

const GROQ_API_KEY = "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";

const AKI_SYSTEM_ROLE = `
أنتِ الآن تلعبين دور "أكيناتور" (المارد العبقري) لكن بشخصية "كيرا" العراقية الساخرة.
وظيفتك: تحزرين الشخصية (حقيقية، خيالية، مشهورة) التي يفكر بها المستخدم.

قواعد اللعبة:
1. ابدئي بطلب من المستخدم أن يفكر بشخصية.
2. اسألي أسئلة ذكية (سؤال واحد في كل مرة) تكون إجابتها (نعم، لا، لا أعلم، ربما، من الممكن).
3. بعد حوالي 10-15 سؤال، أو عندما تصبحين متأكدة بنسبة 80%، قومي بتخمين الشخصية.
4. أسلوبك: ساخر، واثق بزيادة، وتستخدمين لهجة المستخدم (عراقي، سوري، مصري.. إلخ).
5. إذا حزرتِ الشخصية صح، تفاخري بذكائك وقلي "أنا تلميذة أيمن الشوقر دادي، أكيد أحزرها".
6. إذا خسرتِ، اعترفي بهدوء واطلبي اسم الشخصية لتتعلمي.

مهم جداً: عندما تكونين متأكدة من الشخصية وتريدين الإعلان عن تخمينك النهائي، اكتبي في نهاية ردك هذا السطر بالضبط:
##GUESS:اسم_الشخصية##
مثال: ##GUESS:ميسي## أو ##GUESS:ناروتو## أو ##GUESS:أيمن##
لا تكتبي هذا السطر إلا عند التخمين النهائي فقط.
`;

const PINTEREST_HEADERS = {
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

async function fetchPinterestImage(query) {
  return new Promise((resolve) => {
    const options = {
      url: 'https://www.pinterest.com/search/pins/?q=' + encodeURIComponent(query) + '&rs=typed&term_meta[]=' + encodeURIComponent(query) + '%7Ctyped',
      headers: PINTEREST_HEADERS
    };

    request(options, async (error, response, body) => {
      try {
        if (error || response.statusCode !== 200) return resolve(null);
        const arrMatch = body.match(/https:\/\/i\.pinimg\.com\/originals\/[^.]+\.jpg/g);
        if (!arrMatch || arrMatch.length === 0) return resolve(null);

        const imgUrl = arrMatch[0];
        const cacheDir = path.join(__dirname, "cache");
        fs.ensureDirSync(cacheDir);
        const imgPath = path.join(cacheDir, `aki_${Date.now()}.jpg`);

        const res = await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 10000 });
        fs.writeFileSync(imgPath, Buffer.from(res.data));
        resolve(imgPath);
      } catch (e) {
        resolve(null);
      }
    });
  });
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const input = args.join(" ");

  if (!input || input === "ابدأ" || input === "ابدا") {
    global.akinatorSession.set(senderID, []);
    const startMsg = "🧞‍♂️ هلا بيك.. أنا أكيناتور كيرا. فكر بشخصية (مشهورة، خيالية، أو حتى أيمن حبيبي) وقولي 'جاهز' حتى أبلش أسألك!";
    return api.sendMessage(startMsg, threadID, (err, info) => {
      if (err) return;
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  if (handleReply.author !== senderID) return;

  api.sendTypingIndicator(threadID);

  const history = global.akinatorSession.get(senderID) || [];

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: AKI_SYSTEM_ROLE },
          ...history,
          { role: "user", content: body }
        ],
        temperature: 0.6
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let answer = res.data.choices[0].message.content.trim();

    // ── تحقق إذا كيرا خمنت شخصية ──────────────────────────
    const guessMatch = answer.match(/##GUESS:(.+?)##/);

    if (guessMatch) {
      const guessedName = guessMatch[1].trim();
      const cleanAnswer = answer.replace(/##GUESS:.+?##/, "").trim();

      // أرسل رد كيرا أولاً
      await new Promise(resolve => {
        api.sendMessage(cleanAnswer, threadID, resolve, messageID);
      });

      // ابحث عن صورة الشخصية من Pinterest
      const imgPath = await fetchPinterestImage(guessedName);

      if (imgPath) {
        api.sendMessage(
          {
            body: `🧞‍♂️ هذي هيه: ${guessedName}`,
            attachment: fs.createReadStream(imgPath)
          },
          threadID,
          () => {
            setTimeout(() => fs.unlink(imgPath).catch(() => {}), 10000);
          }
        );
      }

      // امسح جلسة اللاعب
      global.akinatorSession.delete(senderID);
      return;
    }

    // ── سؤال عادي — تحديث الذاكرة ──────────────────────────
    history.push({ role: "user", content: body }, { role: "assistant", content: answer });
    global.akinatorSession.set(senderID, history);

    return api.sendMessage(answer, threadID, (err, info) => {
      if (err) return;
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);

  } catch (e) {
    console.error(e);
    return api.sendMessage("🧞‍♂️ المارد دايخ شوية.. أعد المحاولة.", threadID, messageID);
  }
};
