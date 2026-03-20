const axios  = require("axios");
const crypto = require("crypto");
const fs     = require("fs-extra");
const path   = require("path");

module.exports.config = {
    name: "برومبت",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أيمن",
    description: "استخرج الـ Prompt من أي صورة AI",
    commandCategory: "utility",
    usages: "برومبت — رد على صورة أو أرسل رابط",
    cooldowns: 15
};

const BASE_URL = "https://pixai-labs-pixai-tagger-demo.hf.space/gradio_api";

async function startSession(imgUrl) {
    const sessionID = crypto.randomBytes(4).toString("hex").toUpperCase();
    const res = await axios.post(`${BASE_URL}/queue/join?__theme=system`, {
        data: [null, null, imgUrl, 0.3, 0.85, "threshold", 25, 10, false, false],
        event_data: null, fn_index: 2, trigger_id: 26, session_hash: sessionID
    }, {
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0",
            "x-zerogpu-uuid": crypto.randomBytes(4).toString("hex").toUpperCase(),
            "origin": BASE_URL.split("/gradio_api")[0],
            "referer": BASE_URL.split("/gradio_api")[0] + "/?__theme=system"
        },
        timeout: 30000
    });
    return { data: res.data, sessionID };
}

async function getResult(sessionID) {
    const res = await axios.get(`${BASE_URL}/queue/data?session_hash=${sessionID}`, {
        headers: {
            "Accept": "text/event-stream",
            "User-Agent": "Mozilla/5.0",
            "origin": BASE_URL.split("/gradio_api")[0],
            "referer": BASE_URL.split("/gradio_api")[0] + "/?__theme=system"
        },
        responseType: "text",
        timeout: 60000
    });

    const lines = res.data.split("\n");
    for (const line of lines) {
        if (line.startsWith("data:")) {
            try {
                const json = JSON.parse(line.slice(5).trim());
                if (json.msg === "process_completed" && json.output?.data) {
                    return json.output.data;
                }
            } catch (_) {}
        }
    }
    return null;
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const H = "⌬ ━━ 𝗞𝗘𝗡𝗢 UTILITY ━━ ⌬";
    const B = "⌬ ━━━━━━━━━━━━ ⌬";

    // ── جلب رابط الصورة ────────────────────────────────
    let imageUrl = null;
    if (event.type === "message_reply" && event.messageReply?.attachments?.[0]) {
        const att = event.messageReply.attachments[0];
        if (att.type === "photo" || att.type === "image") imageUrl = att.url;
    } else if (event.attachments?.[0]) {
        const att = event.attachments[0];
        if (att.type === "photo" || att.type === "image") imageUrl = att.url;
    } else if (args[0]?.startsWith("http")) {
        imageUrl = args[0];
    }

    if (!imageUrl)
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n🖼️ استخراج الـ Prompt من صورة AI!\n\n📌 الاستخدام:\n⪼ رد على صورة\n⪼ أو أرسل صورة مع الأمر\n⪼ أو ضع رابط الصورة\n\n${B}`,
            threadID, messageID
        );

    api.sendMessage(`${B}\n${H}\n${B}\n\n🔍 جاري استخراج الـ Prompt...\n⪼ قد يستغرق بضع ثوان\n\n${B}`, threadID, messageID);

    try {
        const { sessionID } = await startSession(imageUrl);

        // ── انتظر النتيجة ──────────────────────────────
        await new Promise(r => setTimeout(r, 3000));
        const output = await getResult(sessionID);

        if (!output)
            return api.sendMessage(
                `${B}\n${H}\n${B}\n\n❌ ما قدرت استخرج الـ Prompt!\n⪼ تأكد إن الصورة واضحة\n\n${B}`,
                threadID, messageID
            );

        // output[0] = tags, output[1] = prompt نص
        const tags   = output[0] || "";
        const prompt = output[1] || tags;

        const cleanPrompt = typeof prompt === "string"
            ? prompt.trim().slice(0, 1500)
            : JSON.stringify(prompt).slice(0, 1500);

        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n✨ الـ Prompt المستخرج:\n\n${cleanPrompt}\n\n${B}`,
            threadID, messageID
        );

    } catch (e) {
        console.error("برومبت:", e);
        return api.sendMessage(
            `${B}\n${H}\n${B}\n\n❌ حدث خطأ: ${e.message}\n\n${B}`,
            threadID, messageID
        );
    }
};