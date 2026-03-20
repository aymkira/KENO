const axios = require("axios");

module.exports.config = {
  name:            "ترجمة",
  aliases:         ["translate", "trans"],
  version:         "1.0.0",
  hasPermssion:    0,
  credits:         "ayman",
  description:     "ترجمة النصوص لأي لغة",
  commandCategory: "utility",
  usages:          ".ترجمة [نص] -> [لغة]\nأو رد على مسج + .ترجمة en",
  cooldowns:       3,
};

const LANGS = {
  'عربي':'ar','ar':'ar','انجليزي':'en','en':'en','فرنسي':'fr','fr':'fr',
  'تركي':'tr','tr':'tr','اسباني':'es','es':'es','ياباني':'ja','ja':'ja',
  'كوري':'ko','ko':'ko','صيني':'zh','zh':'zh','روسي':'ru','ru':'ru',
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, type, messageReply, body } = event;

  let text = "", targetLang = "en";

  if (type === "message_reply" && messageReply) {
    text       = messageReply.body || "";
    targetLang = LANGS[args[0]?.toLowerCase()] || args[0] || "en";
  } else {
    const full = body.replace(/^\.[\S]+\s*/u, "").trim();
    if (full.includes("->")) {
      const [t, l] = full.split("->");
      text = t.trim(); targetLang = LANGS[l?.trim().toLowerCase()] || l?.trim() || "en";
    } else { text = full; }
  }

  if (!text) return api.sendMessage(
    "📝 .ترجمة [نص] -> [لغة]\nمثال: .ترجمة مرحبا -> en",
    threadID, messageID
  );

  try {
    const res = await axios.get("https://translate.googleapis.com/translate_a/single", {
      params: { client: "gtx", sl: "auto", tl: targetLang, dt: "t", q: text },
      timeout: 10000,
    });
    const translated = res.data[0]?.map(s => s[0]).join("") || "";
    const from       = res.data[2] || "auto";
    return api.sendMessage(
      `🌐 ترجمة\n${from} → ${targetLang}\n\n📝 ${text}\n✅ ${translated}`,
      threadID, messageID
    );
  } catch(e) {
    return api.sendMessage(`❌ ${e.message}`, threadID, messageID);
  }
};