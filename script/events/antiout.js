

const fs   = require("fs");
const axios = require("axios");

module.exports.config = {
    name: "antiout",
    eventType: ["log:subscribe", "log:unsubscribe"],
    version: "2.0.0",
    credits: "KIRA",
    description: "ترحيب بالأعضاء الجدد بصورهم + إرجاع من يغادر مع رسائل بزخرفة KIRA"
};

const HEADER_WELCOME = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 ━━ ⌬";
const HEADER_LEAVE   = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬";
const HEADER_KICK    = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗞𝗜𝗖𝗞 ━━ ⌬";

module.exports.run = async function ({ api, event, Users }) {
    const { threadID, logMessageType, logMessageData, author } = event;

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName  = threadInfo.threadName || "المجموعة";

    // ════════════════════════════════════════════════════════
    // 🌟 انضمام عضو جديد
    // ════════════════════════════════════════════════════════
    if (logMessageType === "log:subscribe") {
        const addedUsers = logMessageData.addedParticipants;

        for (const user of addedUsers) {
            const userID = user.userFbId;

            // تجاهل إذا البوت هو اللي انضاف
            if (userID == api.getCurrentUserID()) continue;

            const name = global.data.userName.get(userID) || (await Users.getNameUser(userID));
            const avatarURL = `https://graph.facebook.com/${userID}/picture?width=720&height=720`;
            const imgPath   = __dirname + `/welcome_${userID}.png`;

            try {
                const imgData = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;
                fs.writeFileSync(imgPath, Buffer.from(imgData));

                await api.sendMessage(
                    {
                        body:
                            `${HEADER_WELCOME}\n\n` +
                            `🌸 أهلاً وسهلاً يا ${name} 🌸\n` +
                            `✨ نوّرت جروب ${groupName}\n\n` +
                            `📌 اقرأ قوانين المجموعة واستمتع بوجودك 🔥`,
                        attachment: fs.createReadStream(imgPath)
                    },
                    threadID,
                    () => { try { fs.unlinkSync(imgPath); } catch (_) {} }
                );
            } catch (_) {
                // إذا فشل تحميل الصورة → رسالة بدون صورة
                await api.sendMessage(
                    `${HEADER_WELCOME}\n\n` +
                    `🌸 أهلاً وسهلاً يا ${name} 🌸\n` +
                    `✨ نوّرت جروب ${groupName} 🔥`,
                    threadID
                );
            }
        }
        return;
    }

    // ════════════════════════════════════════════════════════
    // 🚪 مغادرة عضو
    // ════════════════════════════════════════════════════════
    if (logMessageType === "log:unsubscribe") {
        const leftID = logMessageData.leftParticipantFbId;

        // تجاهل إذا البوت هو اللي غادر
        if (leftID == api.getCurrentUserID()) return;

        const name = global.data.userName.get(leftID) || (await Users.getNameUser(leftID));

        // طلع بنفسه → نرجّعه
        if (author == leftID) {
            api.addUserToGroup(leftID, threadID, (err) => {
                if (err) {
                    return api.sendMessage(
                        `${HEADER_LEAVE}\n\n🚪 ${name} غادر ولم نتمكن من إرجاعه`,
                        threadID
                    );
                }
                api.sendMessage(
                    `${HEADER_LEAVE}\n\n😘 تعال يا ${name}!\n💬 لا تهرب مرة ثانية يا قلبي 🔥`,
                    threadID
                );
            });
        }
        // تم طرده من قِبل شخص آخر
        else {
            const gifURL  = "https://i.ibb.co/7NRn0Tcn/d98f24daea4c.gif";
            const imgPath = __dirname + `/kick_${leftID}.gif`;

            try {
                const imgData = (await axios.get(gifURL, { responseType: "arraybuffer" })).data;
                fs.writeFileSync(imgPath, Buffer.from(imgData));

                await api.sendMessage(
                    {
                        body:
                            `${HEADER_KICK}\n\n` +
                            `🚫 تم طرد ${name} بنجاح 😂🔥\n` +
                            `🐶 لا أحب نباح الكلاب!`,
                        attachment: fs.createReadStream(imgPath)
                    },
                    threadID,
                    () => { try { fs.unlinkSync(imgPath); } catch (_) {} }
                );
            } catch (_) {
                await api.sendMessage(
                    `${HEADER_KICK}\n\n🚫 تم طرد ${name} بنجاح 😂🔥`,
                    threadID
                );
            }
        }
    }
};
