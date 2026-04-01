module.exports = function({ api, models }) {

  const Users      = require("./controllers/users")({ models, api });
  const Threads    = require("./controllers/threads")({ models, api });
  const Currencies = require("./controllers/currencies")({ models });
  const logger     = require("../utils/log.js");
  const fs         = require("fs");
  const moment     = require("moment-timezone");
  const axios      = require("axios");
  const path       = require("path");

  const db = require("./data.js");

  // ════════════════════════════════════════════════════════════════
  //  تحميل البيئة من data.js
  // ════════════════════════════════════════════════════════════════
  (async function loadEnvironment() {
    try {
      logger(global.getText("listen", "startLoadEnvironment") || "Proceed to load the environment variable ...", "[ DATABASE ]");

      const threadsRaw = await db.getAllThreads();
      for (const t of threadsRaw) {
        const id = String(t.threadID);
        if (!global.data.allThreadID.includes(id)) global.data.allThreadID.push(id);
        global.data.threadData.set(id, t.data || {});
        global.data.threadInfo.set(id, t.threadInfo || {});
        if (t.banned) {
          global.data.threadBanned.set(id, { reason: t.banReason || "", dateAdded: t.bannedAt || "" });
        }
        if (t.commandBanned?.length) global.data.commandBanned.set(id, t.commandBanned);
        if (t.NSFW) global.data.threadAllowNSFW.push(id);
      }
      logger.loader(global.getText("listen", "loadedEnvironmentThread") || "Loaded thread environment variable successfully");

      const usersRaw = await db.getAllUsers();
      for (const u of usersRaw) {
        const id = String(u.userID);
        if (!global.data.allUserID.includes(id)) global.data.allUserID.push(id);
        if (u.name) global.data.userName.set(id, u.name);
      }

      const bansRaw = await db.getAllBans();
      for (const b of bansRaw) {
        global.data.userBanned.set(String(b.userID), {
          reason: b.reason || "", dateAdded: b.bannedAt || "", expiresAt: b.expiresAt || null,
        });
      }

      const walletsRaw = await db.loadFile(db.FILES.WALLET);
      for (const id of Object.keys(walletsRaw))
        if (!global.data.allCurrenciesID.includes(id)) global.data.allCurrenciesID.push(id);

      logger.loader(global.getText("listen", "loadedEnvironmentUser") || "Loaded user environment variable successfully");
      logger(global.getText("listen", "successLoadEnvironment") || "Loaded environment variable successfully", "[ DATABASE ]");
    } catch(error) {
      logger.loader(`${global.getText("listen", "failLoadEnvironment", error) || "Failed: " + error}`, "error");
    }
  }());

  logger(`${api.getCurrentUserID()} - [ ${global.config.PREFIX} ] • ${global.config.BOTNAME || "KIRA"}`, "[ BOT INFO ]");

  // ════════════════════════════════════════════════════════════════
  //  handlers
  // ════════════════════════════════════════════════════════════════
  const handleCommand        = require("./handle/handleCommand")({ api, models, Users, Threads, Currencies });
  const handleCommandEvent   = require("./handle/handleCommandEvent")({ api, models, Users, Threads, Currencies });
  const handleReply          = require("./handle/handleReply")({ api, models, Users, Threads, Currencies });
  const handleReaction       = require("./handle/handleReaction")({ api, models, Users, Threads, Currencies });
  const handleEvent          = require("./handle/handleEvent")({ api, models, Users, Threads, Currencies });
  const handleCreateDatabase = require("./handle/handleCreateDatabase")({ api, Threads, Users, Currencies, models });

  logger.loader(`====== ${Date.now() - global.client.timeStart}ms ======`);

  // ════════════════════════════════════════════════════════════════
  //  datlich — مسار صحيح: script/commands/cache/datlich.json
  // ════════════════════════════════════════════════════════════════
  const datlichPath = path.join(process.cwd(), "script", "commands", "cache", "datlich.json");
  const tenMinutes  = 10 * 60 * 1000;

  const checkAndExecuteEvent = async () => {
    try {
      if (!fs.existsSync(datlichPath)) fs.writeFileSync(datlichPath, JSON.stringify({}, null, 4));
      const data  = JSON.parse(fs.readFileSync(datlichPath));
      const nowMS = Date.now();
      const temp  = [];

      for (const boxID in data) {
        for (const timeKey of Object.keys(data[boxID])) {
          try {
            const [datePart, timePart] = timeKey.split("_");
            if (!datePart || !timePart) continue;
            const [d, m, y]    = datePart.split("/").map(Number);
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
          const mentions = all.slice(0, body.length).map((id, i) => ({ tag: body[i] || " ", id, fromIndex: i }));
          const out      = { body, mentions };

          if (el.ATTACHMENT) {
            out.attachment = [];
            for (const a of el.ATTACHMENT) {
              const buf = (await axios.get(encodeURI(a.url), { responseType: "arraybuffer" })).data;
              const tmp = path.join(process.cwd(), "script", "commands", "cache", a.fileName);
              fs.writeFileSync(tmp, Buffer.from(buf));
              out.attachment.push(fs.createReadStream(tmp));
            }
          }

          if (el.BOX) await api.setTitle(el.BOX, el.TID);
          api.sendMessage(out, el.TID, () => {
            if (el.ATTACHMENT)
              el.ATTACHMENT.forEach(a => {
                try { fs.unlinkSync(path.join(process.cwd(), "script", "commands", "cache", a.fileName)); } catch(_) {}
              });
          });
        } catch(e) { console.error("[datlich]", e.message); }
      }
    } catch(e) { console.error("[datlich check]", e.message); }
  };

  setInterval(checkAndExecuteEvent, tenMinutes / 10);

  // ════════════════════════════════════════════════════════════════
  //  Router
  // ════════════════════════════════════════════════════════════════
  return (event) => {
    switch (event.type) {
      case "message":
      case "message_reply":
        handleCreateDatabase({ event });
        handleCommand({ event });
        handleReply({ event });
        // handleCommandEvent هنا فقط لأوامر تحتاج تستمع للرسائل بدون prefix (مثل تحميل روابط تلقائي)
        handleCommandEvent({ event });
        break;
      case "message_unsend":
        handleEvent({ event });
        break;
      case "event":
        handleEvent({ event });
        break;
      case "message_reaction":
        handleReaction({ event });
        handleCommandEvent({ event });
        if (event.reaction === "👎" && event.senderID === api.getCurrentUserID())
          api.unsendMessage(event.messageID);
        break;
      default:
        break;
    }
  };
};
