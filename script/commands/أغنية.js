const axios = require('axios');
const FormData = require('form-data');

module.exports.config = {
    name: "ذكي",
    version: "1.9",
    hasPermssion: 0,
    credits: "همم",
    description: "ا",
    commandCategory: "ذكاء",
    usages: "ه",
    cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
    let prompt = args.join(" ");
    let imageUrl;

    if (!prompt && !(event.messageReply && event.messageReply.attachments?.length > 0)) {
        return api.sendMessage("امر ونص", event.threadID, event.messageID);
    }

    if (event.messageReply && event.messageReply.attachments?.length > 0) {
        imageUrl = event.messageReply.attachments[0].url;
    }

    async function askText(message) {
        try {
            const res = await axios.post(
                "https://nobro9735-hv31qyxo.leapcell.dev/chat/direct",
                { message, model: "glm-4.5" }
            );
            return res.data.response;
        } catch {
            return "حصل خطأ";
        }
    }

    async function askImage(message, url) {
        try {
            const form = new FormData();
            const img = await axios.get(url, { responseType: "stream" });
            form.append("image", img.data, { filename: "image.jpg" });
            form.append("message", message || "صف هذه الصورة");
            form.append("model", "glm-4.5v");

            const res = await axios.post(
                "https://nobro9735-hv31qyxo.leapcell.dev/chat/direct-with-image",
                form,
                { headers: form.getHeaders() }
            );
            return res.data.response;
        } catch {
            return "حصل خطأ";
        }
    }

    let replyText;
    if (imageUrl) {
        replyText = await askImage(prompt, imageUrl);
    } else {
        replyText = await askText(prompt);
    }

    api.sendMessage(replyText, event.threadID, (err, info) => {
        global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: "text"
        });
    }, event.messageID);
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    if (event.senderID != handleReply.author) return;
    let prompt = event.body || "";
    let replyText;

    try {
        const res = await axios.post(
            "https://nobro9735-hv31qyxo.leapcell.dev/chat/direct",
            { message: prompt, model: "glm-4.5" }
        );
        replyText = res.data.response;
    } catch {
        replyText = "حصل خطأ";
    }

    api.sendMessage(replyText, event.threadID, (err, info) => {
        global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: "text"
        });
    }, event.messageID);
};
