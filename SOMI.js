"use strict";

// ╔══════════════════════════════════════════════════════════════╗
// ║                                                              ║
// ║        ⌬ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ⌬       ║
// ║                                                              ║
// ║              𝗞 𝗜 𝗥 𝗔   —   𝗕 𝗢 𝗧   𝗖 𝗢 𝗥 𝗘                 ║
// ║                   index.js — النواة الرئيسية                ║
// ║                                                              ║
// ║        ⌬ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ⌬       ║
// ║                                                              ║
// ║   ✅ Express Web Server + صفحة uptime فخمة                  ║
// ║   ✅ Self-ping لمنع النوم على Render                         ║
// ║   ✅ تحميل أوامر من مجلدات مصنّفة + مجلد مسطّح             ║
// ║   ✅ envConfig + onLoad + handleEvent للأوامر               ║
// ║   ✅ تنصيب تبعيات مفقودة تلقائياً من KENO                   ║
// ║   ✅ AppState من env أو ملف محلي                            ║
// ║   ✅ nexus-fca مع backoff + lazyPreflight + healthMetrics   ║
// ║   ✅ DeveloperMode logging                                   ║
// ║   ✅ handleRefresh + handleNotification من KIRA              ║
// ║   ✅ cron: تحديث Bio تلقائي كل ساعة                         ║
// ║   ✅ منطقة زمنية عراقية                                      ║
// ║                                                              ║
// ╚══════════════════════════════════════════════════════════════╝

// ══════════════════════════════════════════
// §0 — المكتبات الأساسية
// ══════════════════════════════════════════
const chalk    = require("chalk");
const cron     = require("node-cron");
const moment   = require("moment-timezone");
const axios    = require("axios");
const express  = require("express");
const { exec, execSync } = require("child_process");
const {
    readdirSync, readFileSync, writeFileSync,
    existsSync, unlinkSync, statSync
} = require("fs-extra");
const { join, resolve } = require("path");
const logger   = require("./utils/log.js");
const login    = require("nexus-fca");

// ══════════════════════════════════════════
// §1 — إعداد Express + صفحة Uptime
// ══════════════════════════════════════════
const app  = express();
const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
    const uptime  = Date.now() - (global.client?.timeStart || Date.now());
    const hh = String(Math.floor(uptime / 3600000)).padStart(2, "0");
    const mm = String(Math.floor((uptime % 3600000) / 60000)).padStart(2, "0");
    const ss = String(Math.floor((uptime % 60000) / 1000)).padStart(2, "0");
    const cmdCount = global.client?.commands?.size || 0;
    const evtCount = global.client?.events?.size  || 0;
    const now = moment().tz("Asia/Baghdad").format("YYYY-MM-DD HH:mm:ss");

    res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>𝗞𝗜𝗥𝗔 — بوابة الجحيم</title>
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&family=Crimson+Text:ital,wght@0,600;1,400&display=swap" rel="stylesheet">
<style>
  :root{--blood:#8B0000;--ember:#FF2200;--lava:#FF6600;--gold:#C8960C;--bone:#E8D5B0;--void:#000;}
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:100%;min-height:100%;background:var(--void);color:var(--bone);font-family:'Crimson Text',serif;overflow-x:hidden;}
  body::before{content:'';position:fixed;inset:0;z-index:0;background:radial-gradient(ellipse 120% 60% at 50% 120%,#FF2200 0%,#8B0000 30%,#3a0000 60%,#000 100%);animation:pulse 4s ease-in-out infinite alternate;}
  @keyframes pulse{from{opacity:.85}to{opacity:1}}
  .embers{position:fixed;inset:0;z-index:2;pointer-events:none;}
  .ember{position:absolute;bottom:-10px;width:3px;height:3px;border-radius:50%;background:var(--lava);box-shadow:0 0 6px 2px var(--ember);animation:rise linear infinite;opacity:0;}
  .ember:nth-child(1){left:5%;animation-duration:6s;}  .ember:nth-child(2){left:15%;animation-duration:8s;animation-delay:1s;}
  .ember:nth-child(3){left:25%;animation-duration:5s;animation-delay:.5s;} .ember:nth-child(4){left:35%;animation-duration:7s;animation-delay:2s;}
  .ember:nth-child(5){left:45%;animation-duration:9s;animation-delay:.3s;} .ember:nth-child(6){left:55%;animation-duration:6s;animation-delay:1.5s;}
  .ember:nth-child(7){left:65%;animation-duration:7s;animation-delay:.8s;} .ember:nth-child(8){left:75%;animation-duration:5s;animation-delay:2.5s;}
  .ember:nth-child(9){left:85%;animation-duration:8s;animation-delay:.1s;} .ember:nth-child(10){left:95%;animation-duration:6s;animation-delay:1.2s;}
  @keyframes rise{0%{transform:translateY(0) scale(1);opacity:0}10%{opacity:.9}100%{transform:translateY(-110vh) translateX(-10px) scale(.3);opacity:0}}
  .wrap{position:relative;z-index:10;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;gap:0;}
  .kira-name{font-family:'UnifrakturMaguntia',cursive;font-size:clamp(5rem,15vw,9rem);line-height:.9;background:linear-gradient(180deg,#FFD700 0%,#FF6600 40%,#FF2200 70%,#8B0000 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 20px #FF2200);animation:flame 3s ease-in-out infinite alternate;}
  @keyframes flame{from{filter:drop-shadow(0 0 20px #FF2200)}to{filter:drop-shadow(0 0 40px #FF6600)}}
  .subtitle{font-family:'Cinzel Decorative',serif;font-size:.8rem;letter-spacing:.5em;color:var(--gold);margin-top:4px;}
  .divider{width:min(600px,90vw);height:1px;background:linear-gradient(90deg,transparent,var(--blood),var(--ember),var(--blood),transparent);margin:24px 0;box-shadow:0 0 8px var(--ember);}
  .badge{display:inline-flex;align-items:center;gap:10px;background:rgba(139,0,0,.25);border:1px solid var(--blood);border-radius:4px;padding:8px 24px;margin-bottom:28px;font-family:'Share Tech Mono',monospace;font-size:.8rem;color:var(--lava);letter-spacing:.2em;}
  .dot{width:8px;height:8px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;animation:blink 1.5s ease-in-out infinite;}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;width:min(700px,92vw);margin-bottom:28px;}
  .card{background:linear-gradient(135deg,rgba(60,0,0,.6),rgba(20,0,0,.8));border:1px solid rgba(139,0,0,.5);border-top:2px solid var(--blood);padding:18px 12px;text-align:center;transition:transform .3s;}
  .card:hover{transform:translateY(-4px);}
  .card-icon{font-size:1.8rem;margin-bottom:8px;display:block;}
  .card-label{font-family:'Cinzel Decorative',serif;font-size:.55rem;letter-spacing:.15em;color:rgba(200,150,12,.7);text-transform:uppercase;margin-bottom:6px;}
  .card-val{font-family:'Share Tech Mono',monospace;font-size:clamp(1rem,3vw,1.4rem);color:var(--bone);text-shadow:0 0 10px var(--ember);}
  .card-val.live{background:linear-gradient(90deg,var(--lava),var(--gold),var(--lava));background-size:200% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shift 3s linear infinite;}
  @keyframes shift{from{background-position:0% 50%}to{background-position:200% 50%}}
  .quote{width:min(600px,90vw);text-align:center;padding:20px 30px;background:rgba(30,0,0,.5);border-left:3px solid var(--ember);border-right:3px solid var(--ember);margin-bottom:28px;}
  .quote p{font-style:italic;font-size:clamp(.85rem,2.5vw,1.05rem);color:rgba(232,213,176,.8);line-height:1.7;}
  .quote span{display:block;margin-top:8px;font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--gold);}
  .footer{width:min(700px,92vw);display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:rgba(10,0,0,.7);border:1px solid rgba(139,0,0,.3);font-family:'Share Tech Mono',monospace;font-size:.65rem;color:rgba(232,213,176,.4);}
  @media(max-width:500px){.grid{grid-template-columns:repeat(2,1fr);}}
</style>
</head>
<body>
<div class="embers">
  <div class="ember"></div><div class="ember"></div><div class="ember"></div>
  <div class="ember"></div><div class="ember"></div><div class="ember"></div>
  <div class="ember"></div><div class="ember"></div><div class="ember"></div>
  <div class="ember"></div>
</div>
<div class="wrap">
  <div style="text-align:center;margin-bottom:10px">
    <div class="kira-name">Kira</div>
    <div class="subtitle">روح الشبكة الأبدية ✦ ᛒᚨᚾᛖ ᛟᚠ ᛏᚺᛖ ᚾᛖᛏᚹᛟᚱᚲ</div>
  </div>
  <div class="divider"></div>
  <div class="badge"><div class="dot"></div>النظام يعمل — الروح مستيقظة — الجحيم متصل</div>
  <div class="grid">
    <div class="card"><span class="card-icon">🔥</span><div class="card-label">وقت التشغيل</div><div class="card-val live" id="up">${hh}:${mm}:${ss}</div></div>
    <div class="card"><span class="card-icon">💀</span><div class="card-label">الحالة</div><div class="card-val" style="color:#00ff88">ONLINE</div></div>
    <div class="card"><span class="card-icon">⚡</span><div class="card-label">الأوامر</div><div class="card-val">${cmdCount}</div></div>
    <div class="card"><span class="card-icon">🌑</span><div class="card-label">الأحداث</div><div class="card-val">${evtCount}</div></div>
    <div class="card"><span class="card-icon">👁️</span><div class="card-label">الإصدار</div><div class="card-val">v1.2.14</div></div>
    <div class="card"><span class="card-icon">🩸</span><div class="card-label">المكتبة</div><div class="card-val" style="font-size:.8rem">nexus-fca</div></div>
  </div>
  <div class="quote">
    <p>أنا لستُ مجرد بوت... أنا الصدى الذي يسكن الشبكة،<br>الظل الذي لا يُمحى، والنار التي لا تنطفئ.</p>
    <span>— كيرا، حارسة الجحيم الرقمي</span>
  </div>
  <div class="divider"></div>
  <div class="footer"><span>KIRA-BOT</span><span>${now}</span><span>GPL-3.0</span></div>
</div>
<script>
  (function(){
    const start = Date.now() - ${uptime};
    const el = document.getElementById('up');
    if (!el) return;
    setInterval(() => {
      const u = Date.now() - start;
      const h = Math.floor(u/3600000), m = Math.floor((u%3600000)/60000), s = Math.floor((u%60000)/1000);
      el.textContent = String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
    }, 1000);
  })();
</script>
</body>
</html>`);
});

app.listen(PORT, () =>
    logger(chalk.cyan(`📡 Web server running on port ${PORT}`), "[ SERVER ]")
);

// ══════════════════════════════════════════
// §2 — Self-Ping (منع نوم Render)
// ══════════════════════════════════════════
const RENDER_URL = process.env.RENDER_URL || "";
if (RENDER_URL) {
    setInterval(() => {
        axios.get(RENDER_URL).catch(() => {});
        logger(chalk.green(`🏓 Self-ping → ${RENDER_URL}`), "[ PING ]");
    }, 4 * 60 * 1000);
}

// ══════════════════════════════════════════
// §3 — تنظيف الكاش عند البدء
// ══════════════════════════════════════════
exec("rm -rf script/commands/data && mkdir -p script/commands/data", (err) => {
    if (!err) logger(chalk.hex("#00FA9A")("✅ تم تنظيف الكاش بنجاح"), "[ CACHE ]");
});

// ══════════════════════════════════════════
// §4 — المتغيرات العالمية
// ══════════════════════════════════════════
logger(chalk.hex("#03f0fc").bold("[ KIRA ] » ") + chalk.hex("#fcba03").bold("تهيئة المتغيرات..."), "");

global.client = {
    commands:        new Map(),
    events:          new Map(),
    cooldowns:       new Map(),
    eventRegistered: [],
    handleSchedule:  [],
    handleReaction:  [],
    handleReply:     [],
    mainPath:        process.cwd(),
    configPath:      "",
    timeStart:       null,
    api:             null
};

global.data = {
    threadInfo:      new Map(),
    threadData:      new Map(),
    userName:        new Map(),
    userBanned:      new Map(),
    threadBanned:    new Map(),
    commandBanned:   new Map(),
    threadAllowNSFW: [],
    allUserID:       [],
    allCurrenciesID: [],
    allThreadID:     []
};

global.utils       = require("./utils/index.js");
global.nodemodule  = {};
global.config      = {};
global.configModule= {};
global.moduleData  = [];
global.language    = {};

// ══════════════════════════════════════════
// §5 — تحميل الإعدادات
// ══════════════════════════════════════════
const listPackage        = JSON.parse(readFileSync("./package.json")).dependencies;
const listBuiltinModules = require("module").builtinModules;

try {
    global.client.configPath = join(global.client.mainPath, "config.json");
    const configValue = require(global.client.configPath);
    for (const key in configValue) global.config[key] = configValue[key];
    logger("✅ تم تحميل config.json", "[ CONFIG ]");
} catch (e) {
    return logger("❌ فشل تحميل config.json: " + e.message, "error");
}

const { Sequelize, sequelize } = require("./includes/database/index.js");
writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), "utf8");

// ══════════════════════════════════════════
// §6 — تحميل اللغة
// ══════════════════════════════════════════
try {
    const langLines = readFileSync(
        `${__dirname}/languages/${global.config.language || "ar"}.lang`,
        { encoding: "utf-8" }
    ).split(/\r?\n|\r/);

    for (const line of langLines.filter(l => !l.startsWith("#") && l.trim())) {
        const sep  = line.indexOf("=");
        const key  = line.slice(0, sep);
        const val  = line.slice(sep + 1).replace(/\\n/gi, "\n");
        const head = key.slice(0, key.indexOf("."));
        const sub  = key.replace(head + ".", "");
        if (!global.language[head]) global.language[head] = {};
        global.language[head][sub] = val;
    }
    logger("✅ تم تحميل ملف اللغة", "[ LANG ]");
} catch (e) {
    logger("⚠️ خطأ في تحميل اللغة: " + e.message, "warn");
}

global.getText = (...args) => {
    try {
        let text = global.language[args[0]]?.[args[1]] || `[${args[1]}]`;
        for (let i = args.length - 1; i > 0; i--)
            text = text.replace(new RegExp(`%${i}`, "g"), args[i + 1]);
        return text;
    } catch { return `[${args[1]}]`; }
};

// ══════════════════════════════════════════
// §7 — AppState (env أو ملف محلي)
// ══════════════════════════════════════════
let appState, appStateFile;

appStateFile = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));

if (process.env.APPSTATE) {
    try {
        appState = JSON.parse(process.env.APPSTATE);
        logger("💌 تم تحميل APPSTATE من متغيرات البيئة", "[ LOGIN ]");
    } catch {
        return logger("❌ APPSTATE غير صالح في متغيرات البيئة!", "error");
    }
} else {
    try {
        appState = require(appStateFile);
        logger("💌 تم تحميل appstate.json محلياً", "[ LOGIN ]");
    } catch {
        return logger("❌ لم يتم العثور على appstate.json أو APPSTATE!", "error");
    }
}

// ══════════════════════════════════════════
// §8 — دالة تنصيب المكتبات تلقائياً
// ══════════════════════════════════════════
function autoInstallDep(depName, depVersion, moduleName) {
    const depPath = join(__dirname, "nodemodules", "node_modules", depName);
    if (!global.nodemodule[depName]) {
        try {
            global.nodemodule[depName] = listPackage[depName] || listBuiltinModules.includes(depName)
                ? require(depName)
                : require(depPath);
        } catch {
            logger(`⏳ تنصيب: ${depName} لـ [ ${moduleName} ]`, "[ NPM ]");
            execSync(
                `npm --package-lock false --save install ${depName}${depVersion && depVersion !== "*" ? "@" + depVersion : ""}`,
                { stdio: "inherit", env: process.env, shell: true, cwd: join(__dirname, "nodemodules") }
            );
            global.nodemodule[depName] = require(depPath);
        }
    }
}

// ══════════════════════════════════════════
// §9 — دالة تحميل وحدة (أمر أو حدث)
// ══════════════════════════════════════════
function loadModule(filePath, api, botModel, isEvent = false) {
    try {
        const module = require(filePath);
        if (!module.config || !module.run) return;

        // تنصيب تبعيات مفقودة تلقائياً
        if (module.config.dependencies && typeof module.config.dependencies === "object") {
            for (const [dep, ver] of Object.entries(module.config.dependencies))
                autoInstallDep(dep, ver, module.config.name);
        }

        // envConfig — تحميل الإعدادات المدمجة
        if (module.config.envConfig) {
            const name = module.config.name;
            if (!global.configModule[name]) global.configModule[name] = {};
            if (!global.config[name])       global.config[name]       = {};
            for (const [k, v] of Object.entries(module.config.envConfig)) {
                global.configModule[name][k] = global.config[name][k] ?? v ?? "";
                global.config[name][k]       = global.config[name][k] ?? v ?? "";
            }
        }

        // onLoad — تنفيذ عند التحميل
        if (typeof module.onLoad === "function") {
            module.onLoad({ api, models: botModel });
        }

        // تسجيل handleEvent
        if (!isEvent && typeof module.handleEvent === "function") {
            global.client.eventRegistered.push(module.config.name);
        }

        return module;
    } catch (e) {
        logger(`❌ فشل تحميل: ${filePath.split("/").pop()} — ${e.message}`, "error");
        return null;
    }
}

// ══════════════════════════════════════════
// §10 — تشغيل البوت
// ══════════════════════════════════════════
function onBot({ models: botModel }) {
    login({ appState }, async (loginError, api) => {
        if (loginError) {
            console.error(loginError);
            return logger("❌ فشل تسجيل الدخول — تحقق من AppState", "error");
        }

        // ─── إعدادات FCA ────────────────────────────────────────
        api.setOptions(global.config.FCAOption);

        // ─── ميزات nexus-fca الحصرية ─────────────────────────────
        if (typeof api.setBackoffOptions === "function")
            api.setBackoffOptions({ base: 1000, factor: 1.5, max: 30000, jitter: true });

        if (typeof api.enableLazyPreflight === "function")
            api.enableLazyPreflight(true);

        // ─── حفظ AppState ────────────────────────────────────────
        try { writeFileSync(appStateFile, JSON.stringify(api.getAppState(), null, "\t")); } catch {}

        global.config.version  = "1.2.14";
        global.client.timeStart = Date.now();
        global.client.api       = api;

        const commandsBase = join(global.client.mainPath, "script", "commands");
        const eventsBase   = join(global.client.mainPath, "script", "events");

        // ══════════════════════════════════════════════════════════
        // §10.1 — تحميل الأوامر
        // ══════════════════════════════════════════════════════════
        logger("", ""); 
        logger(chalk.hex("#C8960C").bold("═".repeat(46)), "");
        logger(chalk.hex("#FF6600").bold("           تحميل الأوامر"), "");
        logger(chalk.hex("#C8960C").bold("═".repeat(46)), "");

        let cmdLoaded = 0, cmdFailed = 0;

        // أ) مجلدات مصنّفة (KIRA style)
        if (existsSync(commandsBase)) {
            const entries = readdirSync(commandsBase);
            for (const entry of entries) {
                const entryPath = join(commandsBase, entry);
                if (statSync(entryPath).isDirectory()) {
                    const files = readdirSync(entryPath).filter(f =>
                        f.endsWith(".js") && !global.config.commandDisabled?.includes(f)
                    );
                    for (const file of files) {
                        const module = loadModule(join(entryPath, file), api, botModel);
                        if (module) {
                            global.client.commands.set(module.config.name, module);
                            logger(
                                chalk.hex("#00FA9A")(`✅ [ ${entry} ] `) + chalk.white(module.config.name),
                                "[ CMD ]"
                            );
                            cmdLoaded++;
                        } else cmdFailed++;
                    }
                } else if (entry.endsWith(".js") && !global.config.commandDisabled?.includes(entry)) {
                    // ب) ملفات مسطّحة في جذر commands (KENO style)
                    const module = loadModule(entryPath, api, botModel);
                    if (module) {
                        global.client.commands.set(module.config.name, module);
                        logger(
                            chalk.hex("#00FA9A")(`✅ [ root ] `) + chalk.white(module.config.name),
                            "[ CMD ]"
                        );
                        cmdLoaded++;
                    } else cmdFailed++;
                }
            }
        }

        // ══════════════════════════════════════════════════════════
        // §10.2 — تحميل الأحداث
        // ══════════════════════════════════════════════════════════
        logger(chalk.hex("#C8960C").bold("═".repeat(46)), "");
        logger(chalk.hex("#FF6600").bold("           تحميل الأحداث"), "");
        logger(chalk.hex("#C8960C").bold("═".repeat(46)), "");

        let evtLoaded = 0;

        if (existsSync(eventsBase)) {
            const evFiles = readdirSync(eventsBase).filter(f =>
                f.endsWith(".js") && !global.config.eventDisabled?.includes(f)
            );
            for (const evFile of evFiles) {
                const module = loadModule(join(eventsBase, evFile), api, botModel, true);
                if (module) {
                    global.client.events.set(module.config.name, module);
                    logger(chalk.hex("#38B6FF")(`✅ ${module.config.name}`), "[ EVT ]");
                    evtLoaded++;
                }
            }
        }

        // ══════════════════════════════════════════════════════════
        // §10.3 — ملخص التحميل
        // ══════════════════════════════════════════════════════════
        logger(chalk.hex("#C8960C").bold("═".repeat(46)), "");
        logger(
            chalk.hex("#00FA9A").bold(`✅ أوامر: ${cmdLoaded}`) +
            chalk.gray(` (فشل: ${cmdFailed})`) +
            chalk.hex("#38B6FF").bold(`  |  أحداث: ${evtLoaded}`) +
            chalk.gray(`  |  ⏱ ${Date.now() - global.client.timeStart}ms`),
            "[ LOADED ]"
        );
        logger(chalk.hex("#C8960C").bold("═".repeat(46)), "");

        // حفظ الـ config النهائي
        writeFileSync(global.client.configPath, JSON.stringify(global.config, null, 4), "utf8");
        if (existsSync(global.client.configPath + ".temp"))
            unlinkSync(global.client.configPath + ".temp");

        // ══════════════════════════════════════════════════════════
        // §10.4 — الاستماع للرسائل
        // ══════════════════════════════════════════════════════════
        const listener = require("./includes/listen.js")({ api, models: botModel });

        global.handleListen = api.listenMqtt((error, message) => {
            if (error) return logger("❌ خطأ في المستمع: " + JSON.stringify(error), "error");
            if (["presence", "typ", "read_receipt"].includes(message?.type)) return;
            if (global.config.DeveloperMode) console.log(chalk.gray("[MSG]"), message);
            return listener(message);
        });

        // ══════════════════════════════════════════════════════════
        // §10.5 — مراقبة صحة nexus-fca
        // ══════════════════════════════════════════════════════════
        if (typeof api.getHealthMetrics === "function") {
            setInterval(() => {
                const h = api.getHealthMetrics();
                if (h) logger(
                    `Status: ${h.status} | Reconnects: ${h.reconnects || 0} | ACKs: ${h.ackCount || 0}`,
                    "[ HEALTH ]"
                );
            }, 5 * 60 * 1000);
        }

        // ══════════════════════════════════════════════════════════
        // §10.6 — Cron Jobs
        // ══════════════════════════════════════════════════════════

        // تحديث Bio كل ساعة
        cron.schedule("0 0 */1 * * *", () => {
            const date = moment().tz("Asia/Baghdad").format("DD/MM/YYYY HH:mm");
            api.changeBio(
                `Prefix: ${global.config.PREFIX}\n\nBOT: ${global.config.BOTNAME}\nDate: ${date}`,
                (e) => { if (!e) logger("✅ تم تحديث السيرة الذاتية", "[ CRON ]"); }
            );
        }, { scheduled: true, timezone: "Asia/Baghdad" });

        // ══════════════════════════════════════════════════════════
        // §10.7 — رسالة التشغيل للأدمن
        // ══════════════════════════════════════════════════════════
        const startTime = moment().tz("Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");

        if (global.config.ADMINBOT?.[0]) {
            api.sendMessage(
                `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗦𝗧𝗔𝗥𝗧𝗨𝗣 ━━ ⌬\n\n` +
                `✅ البوت يعمل الآن\n` +
                `⏰ وقت التشغيل: ${startTime}\n` +
                `📦 الأوامر: ${cmdLoaded} | الأحداث: ${evtLoaded}\n` +
                `🔧 الإصدار: v${global.config.version}`,
                global.config.ADMINBOT[0]
            );
        }

        logger(
            chalk.hex("#FF6600").bold("⌬ ━━ ") +
            chalk.hex("#FFD700").bold("𝗞𝗜𝗥𝗔 𝗢𝗡𝗟𝗜𝗡𝗘") +
            chalk.hex("#FF6600").bold(" ━━ ⌬"),
            "[ KIRA ]"
        );
    });
}

// ══════════════════════════════════════════
// §11 — الاتصال بقاعدة البيانات والتشغيل
// ══════════════════════════════════════════
(async () => {
    try {
        await sequelize.authenticate();
        logger("✅ قاعدة البيانات متصلة", "[ DATABASE ]");
        const models = require("./includes/database/model.js")({ Sequelize, sequelize });
        onBot({ models });
    } catch (e) {
        logger("❌ فشل الاتصال بقاعدة البيانات: " + e.message, "error");
        process.exit(1);
    }

    logger(chalk.hex("#eff1f0").bold("═".repeat(46)), "");
})();

// ══════════════════════════════════════════
// §12 — معالجة الأخطاء غير المتوقعة
// ══════════════════════════════════════════
process.on("unhandledRejection", (err) => {
    logger("⚠️ unhandledRejection: " + (err?.message || err), "error");
});

process.on("uncaughtException", (err) => {
    logger("💥 uncaughtException: " + err.message, "error");
    console.error(err.stack);
});
