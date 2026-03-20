module.exports = function({ api, models }) {

  const Users      = require("./controllers/users")({ models, api });
  const Threads    = require("./controllers/threads")({ models, api });
  const Currencies = require("./controllers/currencies")({ models });
  const logger     = require("../utils/log.js");
  const fs         = require("fs");
  const moment     = require("moment-timezone");
  const axios      = require("axios");
  const path       = require("path");

  // ── تحميل data.js مرة واحدة ──────────────────────────────────
  const db = require("./data.js");

  // ════════════════════════════════════════════════════════════════
  //  تحميل البيئة من data.js (بدل Sequelize)
  // ════════════════════════════════════════════════════════════════
  (async function loadEnvironment() {
    try {
      logger(global.getText("listen", "startLoadEnvironment"), "[ DATABASE ]");

      // ── المجموعات ───────────────────────────────────────────
      const threadsRaw = await db.getAllThreads();
      for (const t of threadsRaw) {
        const id = String(t.threadID);
        global.data.allThreadID.push(id);
        global.data.threadData.set(id, t.data || {});
        global.data.threadInfo.set(id, t.threadInfo || {});

        if (t.banned) {
          global.data.threadBanned.set(id, {
            reason:    t.banReason  || "",
            dateAdded: t.bannedAt   || "",
          });
        }
        if (t.commandBanned?.length)
          global.data.commandBanned.set(id, t.commandBanned);
        if (t.NSFW)
          global.data.threadAllowNSFW.push(id);
      }
      logger.loader(global.getText("listen", "loadedEnvironmentThread"));

      // ── المستخدمون ───────────────────────────────────────────
      const usersRaw = await db.getAllUsers();
      for (const u of usersRaw) {
        const id = String(u.userID);
        global.data.allUserID.push(id);
        if (u.name) global.data.userName.set(id, u.name);
      }

      // ── الحظر (من bans.json) ─────────────────────────────────
      const bansRaw = await db.getAllBans();
      for (const b of bansRaw) {
        const id = String(b.userID);
        global.data.userBanned.set(id, {
          reason:    b.reason    || "",
          dateAdded: b.bannedAt  || "",
          expiresAt: b.expiresAt || null,
        });
      }

      // ── المحافظ — allCurrenciesID (توافق مع الكود القديم) ────
      const walletsRaw = await db.loadFile(db.FILES.WALLET);
      for (const id of Object.keys(walletsRaw))
        global.data.allCurrenciesID.push(id);

      logger.loader(global.getText("listen", "loadedEnvironmentUser"));
      logger(global.getText("listen", "successLoadEnvironment"), "[ DATABASE ]");
    } catch(error) {
      logger.loader(global.getText("listen", "failLoadEnvironment", error), "error");
    }
  }());

  logger(`${api.getCurrentUserID()} - [ ${global.config.PREFIX} ] • ${global.config.BOTNAME || "KIRA"}`, "[ BOT INFO ]");

  // ════════════════════════════════════════════════════════════════
  //  تحميل الـ handlers
  // ════════════════════════════════════════════════════════════════
  const handleCommand        = require("./handle/handleCommand")({ api, models, Users, Threads, Currencies });
  const handleCommandEvent   = require("./handle/handleCommandEvent")({ api, models, Users, Threads, Currencies });
  const handleReply          = require("./handle/handleReply")({ api, models, Users, Threads, Currencies });
  const handleReaction       = require("./handle/handleReaction")({ api, models, Users, Threads, Currencies });
  const handleEvent          = require("./handle/handleEvent")({ api, models, Users, Threads, Currencies });
  const handleCreateDatabase = require("./handle/handleCreateDatabase")({ api, Threads, Users, Currencies, models });

  logger.loader(`====== ${Date.now() - global.client.timeStart}ms ======`);

  // ════════════════════════════════════════════════════════════════
  //  نظام datlich (مواعيد المجموعات) — محافَظ عليه
  // ════════════════════════════════════════════════════════════════
  const datlichPath  = path.join(__dirname, "../modules/commands/cache/datlich.json");
  const tenMinutes   = 10 * 60 * 1000;

  const checkAndExecuteEvent = async () => {
    if (!fs.existsSync(datlichPath)) fs.writeFileSync(datlichPath, JSON.stringify({}, null, 4));
    const data    = JSON.parse(fs.readFileSync(datlichPath));
    const nowMS   = Date.now();
    const temp    = [];

    for (const boxID in data) {
      for (const timeKey of Object.keys(data[boxID])) {
        try {
          const [datePart, timePart] = timeKey.split("_");
          const [d, m, y]   = datePart.split("/").map(Number);
          const [hh, mm, ss] = timePart.split(":").map(Number);
          const eventMS = new Date(y, m - 1, d, hh, mm, ss).getTime();
          const diff    = nowMS - eventMS;

          if (diff > 0 && diff < tenMinutes) {
            data[boxID][timeKey].TID = boxID;
            temp.push(data[boxID][timeKey]);
            delete data[boxID][timeKey];
          } else if (diff >= tenMinutes) {
            delete data[boxID][timeKey];
          }
        } catch(_) {}
      }
    }

    fs.writeFileSync(datlichPath, JSON.stringify(data, null, 4));

    for (const el of temp) {
      try {
        const all = (await Threads.getInfo(el.TID)).participantIDs
          .filter(id => id !== api.getCurrentUserID());

        const body     = el.REASON || "تنبيه!";
        const mentions = all.slice(0, body.length).map((id, i) => ({
          tag: body[i] || " ", id, fromIndex: i,
        }));

        const out = { body, mentions };

        if (el.ATTACHMENT) {
          out.attachment = [];
          for (const a of el.ATTACHMENT) {
            const buf = (await axios.get(encodeURI(a.url), { responseType: "arraybuffer" })).data;
            const tmp = path.join(__dirname, "../modules/commands/cache/", a.fileName);
            fs.writeFileSync(tmp, Buffer.from(buf));
            out.attachment.push(fs.createReadStream(tmp));
          }
        }

        if (el.BOX) await api.setTitle(el.BOX, el.TID);
        api.sendMessage(out, el.TID, () => {
          if (el.ATTACHMENT)
            el.ATTACHMENT.forEach(a => {
              try { fs.unlinkSync(path.join(__dirname, "../modules/commands/cache/", a.fileName)); } catch(_) {}
            });
        });
      } catch(e) { console.error("[datlich]", e.message); }
    }
  };

  setInterval(checkAndExecuteEvent, tenMinutes / 10);

  // ════════════════════════════════════════════════════════════════
  //  Router الرئيسي
  // ════════════════════════════════════════════════════════════════
  return (event) => {
    switch (event.type) {
      case "message":
      case "message_reply":
      case "message_unsend":
        handleCreateDatabase({ event });
        handleCommand({ event });
        handleReply({ event });
        handleCommandEvent({ event });
        handleEvent({ event });
        break;

      case "event":
        handleEvent({ event });
        break;

      case "message_reaction":
        handleReaction({ event });
        handleCommandEvent({ event });
        if (event.reaction === "👎" && event.senderID === api.getCurrentUserID()) {
          api.unsendMessage(event.messageID);
        }
        break;

      default:
        break;
    }
  };
};
