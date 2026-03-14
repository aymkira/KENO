const fs = require("fs");

module.exports.config = {
	name: "adminUpdate",
	eventType: ["log:thread-admins","log:thread-name", "log:user-nickname", "log:thread-call","log:thread-icon", "log:thread-color", "log:link-status", "log:magic-words", "log:thread-approval-mode", "log:thread-poll"],
	version: "1.0.1",
	credits: "MrTomXxX",
	description: "Update group information quickly",
    envConfig: {
        autoUnsend: true,
        sendNoti: true,
        timeToUnsend: 10
    }
};

module.exports.run = async function ({ event, api, Threads, Users }) { 
    const { author, threadID, logMessageType, logMessageData } = event;
    const { setData, getData } = Threads;
	var iconPath = __dirname + "/emoji.json";
	if (!fs.existsSync(iconPath)) fs.writeFileSync(iconPath, JSON.stringify({}));
    if (author == threadID) return;

    try {
        let dataThread = (await getData(threadID)).threadInfo;
        switch (logMessageType) {

            case "log:thread-admins": {
                if (logMessageData.ADMIN_EVENT == "add_admin") {
                    dataThread.adminIDs.push({ id: logMessageData.TARGET_ID });
                    api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗣𝗗𝗔𝗧𝗘 ━━ ⌬\n» المستخدم ${logMessageData.TARGET_ID} أصبح مسؤول ⚜️`, threadID);
                } else if (logMessageData.ADMIN_EVENT == "remove_admin") {
                    dataThread.adminIDs = dataThread.adminIDs.filter(item => item.id != logMessageData.TARGET_ID);
                    api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗣𝗗𝗔𝗧𝗘 ━━ ⌬\n» تم إزالة ${logMessageData.TARGET_ID} من المسؤولين`, threadID);
                }
                break;
            }

            case "log:user-nickname": {
                dataThread.nicknames[logMessageData.participant_id] = logMessageData.nickname;
                api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗣𝗗𝗔𝗧𝗘 ━━ ⌬\n» ${(logMessageData.nickname.length == 0) ? `تمت إزالة كنية ${logMessageData.participant_id}` : `تم تحديث كنية ${logMessageData.participant_id} إلى: ${logMessageData.nickname}`}`, threadID);
                break;
            }

            case "log:thread-name": {
                dataThread.threadName = event.logMessageData.name || null;
                api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗣𝗗𝗔𝗧𝗘 ━━ ⌬\n» ${(dataThread.threadName) ? `اسم المجموعة صار: ${dataThread.threadName}` : 'تم حذف اسم المجموعة'}`, threadID);
                break;
            }

            case "log:thread-icon": {
            	let preIcon = JSON.parse(fs.readFileSync(iconPath));
            	dataThread.threadIcon = event.logMessageData.thread_icon || "👍";
                if (global.configModule[this.config.name].sendNoti) api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗣𝗗𝗔𝗧𝗘 ━━ ⌬\n» ${event.logMessageBody.replace("emoticon", "icon")}\n» الأيقونة السابقة: ${preIcon[threadID] || "غير معروفة"}`, threadID, async (error, info) => {
                	preIcon[threadID] = dataThread.threadIcon;
                	fs.writeFileSync(iconPath, JSON.stringify(preIcon));
                    if (global.configModule[this.config.name].autoUnsend) {
                        await new Promise(resolve => setTimeout(resolve, global.configModule[this.config.name].timeToUnsend * 1000));
                        return api.unsendMessage(info.messageID);
                    } else return;
                });
                break;
            }

            case "log:thread-call": {
                if (logMessageData.event == "group_call_started") {
                    const name = await Users.getNameUser(logMessageData.caller_id);
                    api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗣𝗗𝗔𝗧𝗘 ━━ ⌬\n» ${name} بدأ مكالمة ${(logMessageData.video) ? 'فيديو 📹' : 'صوتية 🎙️'}`, threadID);
                } else if (logMessageData.event == "group_call_ended") {
                    const callDuration = logMessageData.call_duration;
                    let hours = Math.floor(callDuration / 3600);
                    let minutes = Math.floor((callDuration - (hours * 3600)) / 60);
                    let seconds = callDuration - (hours * 3600) - (minutes * 60);
                    if (hours < 10) hours = "0" + hours;
                    if (minutes < 10) minutes = "0" + minutes;
                    if (seconds < 10) seconds = "0" + seconds;
                    api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗣𝗗𝗔𝗧𝗘 ━━ ⌬\n» انتهت المكالمة ${(logMessageData.video) ? 'الفيديو 📹' : 'الصوتية 🎙️'}\n» المدة: ${hours}:${minutes}:${seconds}`, threadID);
                } else if (logMessageData.joining_user) {
                    const name = await Users.getNameUser(logMessageData.joining_user);
                    api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗣𝗗𝗔𝗧𝗘 ━━ ⌬\n» ${name} انضم للمكالمة ${(logMessageData.group_call_type == '1') ? 'الفيديو 📹' : 'الصوتية 🎙️'}`, threadID);
                }
                break;
            }

            case "log:magic-words": {
                return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗣𝗗𝗔𝗧𝗘 ━━ ⌬\n» كلمة سحرية: ${event.logMessageData.magic_word}\n» السمة: ${event.logMessageData.theme_name}\n» الإيموجي: ${event.logMessageData.emoji_effect || "لا يوجد"}`, threadID);
            }

            case "log:thread-poll": {
                var obj = JSON.parse(event.logMessageData.question_json);
                if (event.logMessageData.event_type == "question_creation" || event.logMessageData.event_type == "update_vote") {
                    return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗣𝗗𝗔𝗧𝗘 ━━ ⌬\n» ${event.logMessageBody}`, threadID);
                }
            }

            case "log:thread-approval-mode": {
                return api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗣𝗗𝗔𝗧𝗘 ━━ ⌬\n» ${event.logMessageBody}`, threadID);
            }

            case "log:thread-color": {
            	dataThread.threadColor = event.logMessageData.thread_color || "🌤";
                if (global.configModule[this.config.name].sendNoti) api.sendMessage(`⌬ ━━ 𝗞𝗜𝗥𝗔 𝗨𝗣𝗗𝗔𝗧𝗘 ━━ ⌬\n» ${event.logMessageBody.replace("العنوان", "اللون")}`, threadID, async (error, info) => {
                    if (global.configModule[this.config.name].autoUnsend) {
                        await new Promise(resolve => setTimeout(resolve, global.configModule[this.config.name].timeToUnsend * 1000));
                        return api.unsendMessage(info.messageID);
                    } else return;
                });
                break;
            }
        }
        await setData(threadID, { threadInfo: dataThread });
    } catch (e) { console.log(e); }
};
        let dataThread = (await getData(threadID)).threadInfo;

        switch (logMessageType) {

            // ─── تغيير المشرفين ──────────────────────────────
            case "log:thread-admins": {
                if (logMessageData.ADMIN_EVENT == "add_admin") {
                    dataThread.adminIDs.push({ id: logMessageData.TARGET_ID });
                    api.sendMessage(
                        `${HEADER}\n\n⚜️ تم ترقية مستخدم إلى مشرف\n🆔 ID: ${logMessageData.TARGET_ID}`,
                        threadID
                    );
                } else if (logMessageData.ADMIN_EVENT == "remove_admin") {
                    dataThread.adminIDs = dataThread.adminIDs.filter(
                        item => item.id != logMessageData.TARGET_ID
                    );
                    api.sendMessage(
                        `${HEADER}\n\n🔻 تم إزالة صلاحية المشرف\n🆔 ID: ${logMessageData.TARGET_ID}`,
                        threadID
                    );
                }
                break;
            }

            // ─── تغيير كنية عضو ─────────────────────────────
            case "log:user-nickname": {
                dataThread.nicknames[logMessageData.participant_id] = logMessageData.nickname;
                const nickMsg = logMessageData.nickname.length === 0
                    ? `🗑️ تمت إزالة كنية المستخدم ${logMessageData.participant_id}`
                    : `✏️ تم تحديث الكنية\n👤 ID: ${logMessageData.participant_id}\n📛 الكنية الجديدة: ${logMessageData.nickname}`;
                api.sendMessage(`${HEADER}\n\n${nickMsg}`, threadID);
                break;
            }

            // ─── تغيير اسم المجموعة ──────────────────────────
            case "log:thread-name": {
                dataThread.threadName = logMessageData.name || null;
                const nameMsg = dataThread.threadName
                    ? `✏️ تم تغيير اسم المجموعة إلى:\n📌 ${dataThread.threadName}`
                    : `🗑️ تم حذف اسم المجموعة`;
                api.sendMessage(`${HEADER}\n\n${nameMsg}`, threadID);
                break;
            }

            // ─── تغيير أيقونة المجموعة ───────────────────────
            case "log:thread-icon": {
                let prevIcons = JSON.parse(fs.readFileSync(iconPath, "utf8"));
                dataThread.threadIcon = logMessageData.thread_icon || "👍";
                api.sendMessage(
                    `${HEADER}\n\n🎨 تم تغيير أيقونة المجموعة\n` +
                    `✨ الجديدة: ${dataThread.threadIcon}\n` +
                    `🕰️ السابقة: ${prevIcons[threadID] || "غير معروفة"}`,
                    threadID,
                    (err, info) => {
                        prevIcons[threadID] = dataThread.threadIcon;
                        fs.writeFileSync(iconPath, JSON.stringify(prevIcons));
                    }
                );
                break;
            }

            // ─── تغيير لون المجموعة ──────────────────────────
            case "log:thread-color": {
                dataThread.threadColor = logMessageData.thread_color || null;
                api.sendMessage(
                    `${HEADER}\n\n🎨 تم تغيير لون المجموعة\n💬 ${event.logMessageBody}`,
                    threadID
                );
                break;
            }

            // ─── المكالمات الجماعية ───────────────────────────
            case "log:thread-call": {
                if (logMessageData.event == "group_call_started") {
                    const name = await Users.getNameUser(logMessageData.caller_id);
                    api.sendMessage(
                        `${HEADER}\n\n📞 بدأ ${name} مكالمة ${logMessageData.video ? "فيديو 📹" : "صوتية 🎙️"}`,
                        threadID
                    );
                } else if (logMessageData.event == "group_call_ended") {
                    const dur = logMessageData.call_duration;
                    const h = String(Math.floor(dur / 3600)).padStart(2, "0");
                    const m = String(Math.floor((dur % 3600) / 60)).padStart(2, "0");
                    const s = String(dur % 60).padStart(2, "0");
                    api.sendMessage(
                        `${HEADER}\n\n📵 انتهت المكالمة ${logMessageData.video ? "الفيديو 📹" : "الصوتية 🎙️"}\n⏱️ المدة: ${h}:${m}:${s}`,
                        threadID
                    );
                } else if (logMessageData.joining_user) {
                    const name = await Users.getNameUser(logMessageData.joining_user);
                    api.sendMessage(
                        `${HEADER}\n\n📲 ${name} انضم إلى المكالمة ${logMessageData.group_call_type == "1" ? "الفيديو 📹" : "الصوتية 🎙️"}`,
                        threadID
                    );
                }
                break;
            }

            // ─── كلمات سحرية ─────────────────────────────────
            case "log:magic-words": {
                api.sendMessage(
                    `${HEADER}\n\n✨ كلمة سحرية: ${logMessageData.magic_word}\n` +
                    `🎭 السمة: ${logMessageData.theme_name}\n` +
                    `😄 الإيموجي: ${logMessageData.emoji_effect || "لا يوجد"}\n` +
                    `📊 إجمالي التأثيرات: ${logMessageData.new_magic_word_count}`,
                    threadID
                );
                break;
            }

            // ─── استطلاعات الرأي ─────────────────────────────
            case "log:thread-poll": {
                api.sendMessage(`${HEADER}\n\n📊 ${event.logMessageBody}`, threadID);
                break;
            }

            // ─── وضع الموافقة على الأعضاء ────────────────────
            case "log:thread-approval-mode": {
                api.sendMessage(`${HEADER}\n\n🔐 ${event.logMessageBody}`, threadID);
                break;
            }
        }

        await setData(threadID, { threadInfo: dataThread });
    } catch (e) {
        console.error("❌ خطأ في adminUpdate:", e.message);
    }
};
