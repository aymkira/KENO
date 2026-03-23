"use strict";

const chalk = require("chalk");
var cron    = require("node-cron");
const { exec } = require("child_process");
const fs_native = require("fs");

exec("rm -rf script/commands/data && mkdir -p script/commands/data && rm -rf script/commands/tad/*", err => {
    if (err) console.log(`cache clear error: ${err.message}`);
    else console.log(chalk.bold.hex("#00FA9A")("[ AUTO CLEAR CACHE ] 🪽❯ ") + chalk.hex("#00FA9A")("Successfully delete cache"));
});

const DateAndTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Baghdad" });
console.log(chalk.bold.hex("#059242").bold(DateAndTime));

const { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } = require("fs-extra");
const { join, resolve } = require("path");
const { execSync } = require("child_process");
const logger = require("./utils/log.js");
const login  = require("ayman-fca");
const https  = require("https");


const listPackage        = JSON.parse(readFileSync("./package.json")).dependencies;
const listbuiltinModules = require("module").builtinModules;

const cacheDir = join(process.cwd(), "script", "commands", "cache");
if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

console.log(chalk.bold.hex("#03f0fc").bold("[ KIRA ] » ") + chalk.bold.hex("#fcba03").bold("Initializing..."));

const CircuitBreaker = {
    failures: 0, open: false, openAt: 0,
    THRESHOLD: 7, RESET_MS: 5 * 60 * 1000,
    record() {
        this.failures++;
        if (this.failures >= this.THRESHOLD && !this.open) {
            this.open = true; this.openAt = Date.now();
            logger(`⚡ Circuit OPEN — ${this.failures} فشل. توقف ${this.RESET_MS/60000} دقيقة`, "[ CIRCUIT ]");
            setTimeout(() => { this.open = false; this.failures = 0; logger("⚡ Circuit CLOSED ✅", "[ CIRCUIT ]"); }, this.RESET_MS);
        }
    },
    reset() { this.failures = 0; this.open = false; },
    isOpen() {
        if (!this.open) return false;
        if (Date.now() - this.openAt >= this.RESET_MS) { this.reset(); return false; }
        logger(`⚡ Circuit مفتوح — ${Math.round((this.RESET_MS-(Date.now()-this.openAt))/1000)}s متبقي`, "[ CIRCUIT ]");
        return true;
    }
};

const RateLimiter = {
    _map: new Map(), _global: [],
    PER_MAX: 20, GLB_MAX: 60, WIN: 60000,
    canSend(threadID) {
        const now = Date.now();
        this._global = this._global.filter(t => now - t < this.WIN);
        if (this._global.length >= this.GLB_MAX) {
            logger(`🚫 Rate Limit عالمي (${this._global.length}/min)`, "[ RATE ]"); return false;
        }
        if (threadID) {
            const key  = String(threadID);
            const list = (this._map.get(key) || []).filter(t => now - t < this.WIN);
            if (list.length >= this.PER_MAX) {
                logger(`🚫 Rate Limit thread ${key} (${list.length}/min)`, "[ RATE ]"); return false;
            }
            list.push(now); this._map.set(key, list);
        }
        this._global.push(now); return true;
    },
    cleanup() {
        const now = Date.now();
        for (const [k, v] of this._map) {
            const f = v.filter(t => now - t < this.WIN);
            if (!f.length) this._map.delete(k); else this._map.set(k, f);
        }
    }
};
setInterval(() => RateLimiter.cleanup(), 5 * 60 * 1000);

const MemoryWatchdog = {
    CRIT_MB: 480, WARN_MB: 380,
    _history: [], _timer: null,
    _usedMB()  { return Math.round(process.memoryUsage().heapUsed  / 1024 / 1024); },
    _totalMB() { return Math.round(process.memoryUsage().heapTotal / 1024 / 1024); },
    _cleanup() {
        if (typeof global.gc === "function") { try { global.gc(); logger("🧹 GC ✅", "[ MEMORY ]"); } catch(_) {} }
        try {
            if (global.client?.cooldowns instanceof Map) {
                const now = Date.now();
                for (const [k, v] of global.client.cooldowns) if (now - v > 30000) global.client.cooldowns.delete(k);
            }
            if (Array.isArray(global.client?.handleReaction) && global.client.handleReaction.length > 200)
                global.client.handleReaction = global.client.handleReaction.slice(-100);
            if (Array.isArray(global.client?.handleReply) && global.client.handleReply.length > 200)
                global.client.handleReply = global.client.handleReply.slice(-100);
            if (global.data?.threadInfo instanceof Map && global.data.threadInfo.size > 500) global.data.threadInfo.clear();
            if (global.data?.userName instanceof Map && global.data.userName.size > 1000) global.data.userName.clear();
        } catch(_) {}
        RateLimiter.cleanup();
    },
    start() {
        if (this._timer) return;
        this._timer = setInterval(() => {
            const mb = this._usedMB(), total = this._totalMB(), pct = Math.round(mb/total*100);
            this._history.push({ mb, ts: Date.now() });
            if (this._history.length > 10) this._history.shift();
            if (mb >= this.CRIT_MB) { logger(`🔴 RAM حرجة ${mb}MB/${total}MB (${pct}%) — تنظيف`, "[ MEMORY ]"); this._cleanup(); }
            else if (mb >= this.WARN_MB) logger(`🟡 RAM مرتفعة ${mb}MB/${total}MB (${pct}%)`, "[ MEMORY ]");
            else logger(`🟢 RAM سليمة ${mb}MB/${total}MB (${pct}%)`, "[ MEMORY ]");
        }, 30 * 1000);
        logger("🧠 MemoryWatchdog ✅", "[ MEMORY ]");
    },
    stop() { if (this._timer) { clearInterval(this._timer); this._timer = null; } }
};

function isNetworkErr(err) {
    return /econnreset|etimedout|enotfound|eai_again|epipe|econnrefused|socket hang up|fetch failed/i.test(String(err?.message || err?.code || err || ""));
}
function isSessionErr(err) {
    return /not logged in|invalid session|expired|checkpoint|account_inactive|blocked the login/i.test(String(err?.message || err?.error || err || ""));
}
function isMqttInitErr(err) {
    return /mqtt.*not.*init|not.*connected|mqtt client is not/i.test(String(err?.message || err || ""));
}

global.client = { commands: new Map(), events: new Map(), cooldowns: new Map(), eventRegistered: [], handleSchedule: [], handleReaction: [], handleReply: [], mainPath: process.cwd(), configPath: "", api: null, keeper: null };
global.data   = { threadInfo: new Map(), threadData: new Map(), userName: new Map(), userBanned: new Map(), threadBanned: new Map(), commandBanned: new Map(), threadAllowNSFW: [], allUserID: [], allCurrenciesID: [], allThreadID: [] };
global.utils        = require("./utils/index.js");
global.nodemodule   = {};
global.config       = {};
global.configModule = {};
global.moduleData   = [];
global.language     = {};

var configValue;
try {
    global.client.configPath = join(global.client.mainPath, "config.json");
    configValue = require(global.client.configPath);
    logger.loader("Found file config: config.json");
} catch {
    if (existsSync(global.client.configPath.replace(/\.json/g, "") + ".temp")) {
        configValue = JSON.parse(readFileSync(global.client.configPath.replace(/\.json/g, "") + ".temp"));
        logger.loader("Found: config.json.temp");
    } else return logger.loader("config.json not found!", "error");
}
try { for (const k in configValue) global.config[k] = configValue[k]; logger.loader("Config Loaded!"); }
catch { return logger.loader("Can't load file config!", "error"); }
writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), "utf8");

const langFile = readFileSync(`${__dirname}/languages/${global.config.language || "ar"}.lang`, { encoding: "utf-8" }).split(/\r?\n|\r/);
for (const item of langFile.filter(i => !i.startsWith("#") && i !== "")) {
    const sep = item.indexOf("=");
    const iKey = item.slice(0, sep), head = iKey.slice(0, iKey.indexOf(".")), key = iKey.replace(head + ".", "");
    if (!global.language[head]) global.language[head] = {};
    global.language[head][key] = item.slice(sep + 1).replace(/\\n/gi, "\n");
}
global.getText = function(...a) {
    if (!global.language[a[0]]) return a[a.length-1] || "";
    let t = global.language[a[0]][a[1]] || "";
    for (let i = a.length-1; i > 0; i--) t = t.replace(RegExp(`%${i}`,"g"), a[i+1]);
    return t;
};

var appStateFile = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));
var appState     = [];

function loadAppStateFromDisk() {
    try { const r = JSON.parse(readFileSync(appStateFile, "utf8")); return Array.isArray(r) && r.length ? r : []; } catch { return []; }
}
function saveAppStateAtomic(state) {
    try {
        if (!Array.isArray(state) || !state.length) return false;
        const tmp = appStateFile + ".tmp";
        writeFileSync(tmp, JSON.stringify(state, null, "\t"), "utf8");
        fs_native.renameSync(tmp, appStateFile);
        return true;
    } catch(e) { logger(`⚠️ حفظ appState: ${e.message}`, "[ SESSION ]"); return false; }
}
appState = loadAppStateFromDisk();
if (appState.length) logger.loader("✅ appstate موجود وصالح");
else logger.loader("⚠️ appstate غير موجود");

function pushAppStateToGitHub(state) {
    try {
        const cfg = global.config;
        if (!cfg.GITHUB_TOKEN || !cfg.GITHUB_REPO) return;
        const content = Buffer.from(JSON.stringify(state)).toString("base64");
        const url = `/repos/${cfg.GITHUB_REPO}/contents/appstate.json`;
        const headers = { "Authorization":`token ${cfg.GITHUB_TOKEN}`, "User-Agent":"KIRA-Bot", "Content-Type":"application/json" };
        const g = https.request({ hostname:"api.github.com", path:url, method:"GET", headers }, res => {
            let raw = "";
            res.on("data", d => raw += d);
            res.on("end", () => {
                try {
                    const body = JSON.stringify({ message:"🔄 appState", content, sha: JSON.parse(raw).sha });
                    const p = https.request({ hostname:"api.github.com", path:url, method:"PUT", headers:{ ...headers,"Content-Length":Buffer.byteLength(body) } }, r => {
                        logger(r.statusCode === 200 || r.statusCode === 201 ? "☁️ GitHub ✅" : `☁️ GitHub ${r.statusCode}`, "[ SESSION ]");
                    });
                    p.on("error",()=>{}); p.write(body); p.end();
                } catch(_) {}
            });
        });
        g.on("error",()=>{}); g.end();
    } catch(_) {}
}

function onBot() {
    var _saveInterval, _keepAlive;

    function clearIntervals() {
        try { if (global.client.keeper) { global.client.keeper.stop(); global.client.keeper = null; } } catch(_) {}
        [_saveInterval, _keepAlive].forEach(t => { try { if (t) clearInterval(t); } catch(_) {} });
        _saveInterval = null; _keepAlive = null;
        MemoryWatchdog.stop();
    }

    var loginData = {}, retryCount = 0;
    const MAX_RETRIES = 20;
    var _reconnectDelay = 5000;

    function reconnect(reason) {
        if (CircuitBreaker.isOpen()) {
            logger("⚡ Circuit مفتوح — تأجيل", "[ RECONNECT ]");
            setTimeout(() => reconnect(reason), CircuitBreaker.RESET_MS);
            return;
        }
        clearIntervals();
        retryCount++;
        CircuitBreaker.record();
        if (retryCount > MAX_RETRIES) { logger(`💀 تجاوز الحد (${MAX_RETRIES})`, "[ LOGIN ]"); process.exit(1); }
        const delay = Math.min(_reconnectDelay, 300000);
        _reconnectDelay = Math.min(_reconnectDelay * 2, 300000);
        logger(`🔄 Reconnect (${retryCount}/${MAX_RETRIES}) بعد ${Math.round(delay/1000)}s — ${reason}`, "[ RECONNECT ]");
        setTimeout(() => { const f = loadAppStateFromDisk(); if (f.length) appState = f; tryLogin(); }, delay);
    }

    function tryLogin() {
        logger(`🔑 محاولة login #${retryCount+1}`, "[ LOGIN ]");
        if (!appState.length) { logger("❌ appstate مفقود", "[ LOGIN ]"); process.exit(1); }
        loginData = { appState };

        login(loginData, {
            listenEvents:true, logLevel:"silent", pauseLog:true, selfListen:false,
            autoMarkRead:false, autoMarkDelivery:false, online:true, autoReconnect:true,
            userAgent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }, async (err, api) => {
            if (err) { logger(`❌ فشل: ${err?.message||err?.error||JSON.stringify(err)||"unknown"}`, "[ LOGIN ]"); return reconnect("login_failed"); }

            retryCount = 0; _reconnectDelay = 5000; CircuitBreaker.reset();
            logger("✅ تسجيل دخول ناجح!", "[ LOGIN ]");
            global.client.api = api;
            global.client.timeStart = Date.now();

            try {
                const ns = api.getAppState();
                if (ns?.length) { saveAppStateAtomic(ns); appState = ns; loginData["appState"] = ns; logger("💾 appstate ✅","[ SESSION ]"); pushAppStateToGitHub(ns); }
            } catch(e) { logger(`⚠️ ${e.message}`,"[ SESSION ]"); }

            let realCtx = null;
            for (const key of Object.getOwnPropertyNames(api)) {
                try { const v = api[key]; if (v && typeof v==="object" && v.jar && v.userID && v.userID!=="0") { realCtx = v; break; } } catch(_) {}
            }
            if (realCtx) { api.ctx = realCtx; api.ctxMain = realCtx; logger(`🧠 ctx ✅ | UID:${realCtx.userID} | Region:${realCtx.region||"?"}`, "[ SESSION ]"); }
            else logger("⚠️ ctx لم يُعثر — بعض الأنظمة محدودة", "[ SESSION ]");


            MemoryWatchdog.start();

            api.setOptions({ listenEvents:true, selfListen:false, autoMarkRead:false, autoMarkDelivery:false });

            const _origSend = api.sendMessage.bind(api);
            api.sendMessage = function(msg, threadID, callback, messageID) {
                if (!RateLimiter.canSend(threadID)) {
                    const e = new Error(`Rate limit: thread ${threadID}`);
                    if (typeof callback==="function") callback(e); return;
                }
                return _origSend(msg, threadID, callback, messageID);
            };

            (function loadCommands() {
                const cmdDirs = [];
                function scanDir(dir) {
                    try { for (const item of readdirSync(dir,{withFileTypes:true})) { const f=join(dir,item.name); if(item.isDirectory()) scanDir(f); else if(item.name.endsWith(".js")&&!global.config.commandDisabled?.includes(item.name)) cmdDirs.push(f); } } catch(_) {}
                }
                scanDir(join(global.client.mainPath,"script","commands"));

                for (const filePath of cmdDirs) {
                    try {
                        delete require.cache[require.resolve(filePath)];
                        const mod = require(filePath);
                        if (mod.onStart && !mod.run) mod.run = function(args) { return mod.onStart.call(mod, args); };
                        if (mod.onChat && !mod.handleEvent) mod.handleEvent = function(args) { return mod.onChat.call(mod, args); };
                        if (!mod.config||!mod.run) throw new Error(global.getText("mirai","errorFormat")||"missing config/run");
                        if (global.client.commands.has(mod.config.name)) throw new Error(global.getText("mirai","nameExist")||"Name Repeated");

                        if (mod.config.dependencies && typeof mod.config.dependencies==="object") {
                            for (const dep in mod.config.dependencies) {
                                const dp = join(__dirname,"nodemodules","node_modules",dep);
                                try {
                                    if (!global.nodemodule[dep])
                                        global.nodemodule[dep] = (listPackage[dep]||listbuiltinModules.includes(dep)) ? require(dep) : require(dp);
                                } catch {
                                    let ok=false;
                                    execSync("npm --package-lock false --save install "+dep,{stdio:"inherit",env:process.env,shell:true,cwd:join(__dirname,"nodemodules")});
                                    for (let i=0;i<3;i++) { try { global.nodemodule[dep]=(listPackage[dep]||listbuiltinModules.includes(dep))?require(dep):require(dp); ok=true; break; } catch(_){} }
                                    if (!ok) throw new Error(`Can't install ${dep}`);
                                }
                            }
                        }

                        if (mod.config.envConfig) {
                            for (const env in mod.config.envConfig) {
                                if (!global.configModule[mod.config.name]) global.configModule[mod.config.name]={};
                                if (!global.config[mod.config.name])       global.config[mod.config.name]={};
                                global.configModule[mod.config.name][env] = global.config[mod.config.name][env]!==undefined ? global.config[mod.config.name][env] : mod.config.envConfig[env]??'';
                                if (global.config[mod.config.name][env]===undefined) global.config[mod.config.name][env]=mod.config.envConfig[env]??'';
                            }
                        }

                        if (mod.onLoad) { try { mod.onLoad({api}); } catch(e) { throw new Error(`onLoad [${mod.config.name}]: ${e.message}`); } }
                        if (mod.handleEvent) global.client.eventRegistered.push(mod.config.name);
                        global.client.commands.set(mod.config.name, mod);
                        logger.loader(global.getText("mirai","successLoadModule",mod.config.name)||`Loaded ${mod.config.name}`);
                    } catch(error) {
                        logger.loader(global.getText("mirai","failLoadModule","",error.message||error)||`Can't load: ${error.message||error}`,"error");
                    }
                }
            })();

            (function loadEvents() {
                let evFiles = [];
                try { evFiles = readdirSync(join(global.client.mainPath,"script","events")).filter(f=>f.endsWith(".js")&&!global.config.eventDisabled?.includes(f)); } catch(_) {}

                for (const ev of evFiles) {
                    try {
                        const ep = join(global.client.mainPath,"script","events",ev);
                        delete require.cache[require.resolve(ep)];
                        const event = require(ep);
                        if (!event.config||!event.run) throw new Error(global.getText("mirai","errorFormat")||"missing config/run");
                        if (global.client.events.has(event.config.name||"")) throw new Error(global.getText("mirai","nameExist")||"Name Repeated");

                        if (event.config.envConfig) {
                            for (const env in event.config.envConfig) {
                                if (!global.configModule[event.config.name]) global.configModule[event.config.name]={};
                                if (!global.config[event.config.name])       global.config[event.config.name]={};
                                global.configModule[event.config.name][env] = global.config[event.config.name][env]!==undefined ? global.config[event.config.name][env] : event.config.envConfig[env]??'';
                                if (global.config[event.config.name][env]===undefined) global.config[event.config.name][env]=event.config.envConfig[env]??'';
                            }
                        }

                        if (event.onLoad) { try { event.onLoad({api}); } catch(e) { throw new Error(`onLoad [${event.config.name}]: ${e.message}`); } }
                        global.client.events.set(event.config.name, event);
                        logger.loader(global.getText("mirai","successLoadModule",event.config.name)||`Loaded ${event.config.name}`);
                    } catch(error) {
                        logger.loader(global.getText("mirai","failLoadModule","",error.message||error)||`Can't load event: ${error.message||error}`,"error");
                    }
                }
            })();

            logger.loader(global.getText("mirai","finishLoadModule",global.client.commands.size,global.client.events.size)||`Installed ${global.client.commands.size} commands and ${global.client.events.size} events`);
            logger.loader(`=== ${Date.now()-global.client.timeStart}ms ===`);
            writeFileSync(global.client.configPath, JSON.stringify(global.config,null,4),"utf8");
            if (existsSync(global.client.configPath+".temp")) unlinkSync(global.client.configPath+".temp");

            const listener = require("./includes/listen.js")({api, models:null});

            function listenerCallback(error, message) {
                if (error) {
                    if (error?.type==="stop_listen") return;
                    if (error?.type==="account_inactive"||isSessionErr(error)) { logger(`🔐 جلسة منتهية: ${error.reason||error.error||error.message}`,"[ SESSION ]"); return reconnect("account_inactive"); }
                    if (isNetworkErr(error)) { logger(`🌐 خطأ شبكة: ${error.message||JSON.stringify(error)}`,"[ LISTEN ]"); return reconnect("network_error"); }
                    logger(`⚠️ listenMqtt: ${JSON.stringify(error)}`,"[ LISTEN ]");
                    return reconnect("listen_error");
                }
                if (!message) return;
                if (["presence","typ","read_receipt"].includes(message?.type)) return;
                if (global.config.DeveloperMode==true) console.log(message);
                return listener(message);
            }

            global.handleListen = api.listenMqtt(listenerCallback);

            _saveInterval = setInterval(() => {
                try {
                    const ns = api.getAppState();
                    if (!ns?.length) return;
                    if (saveAppStateAtomic(ns)) { appState=ns; loginData["appState"]=ns; logger("💾 appState ✅","[ SESSION ]"); pushAppStateToGitHub(ns); }
                } catch(e) { logger(`⚠️ ${e.message}`,"[ SESSION ]"); }
            }, 10*60*1000);

            _keepAlive = setInterval(() => { try { api.markAsReadAll(()=>{}); } catch(_) {} }, 5*60*1000);

            const momentt = require("moment-timezone").tz("Asia/Baghdad");
            setTimeout(() => {
                try {
                    api.sendMessage(
                        `✅ KIRA Ultra شغّال — ${momentt.format("HH:mm:ss")}\n⚡ Circuit: ${CircuitBreaker.open?"مفتوح":"سليم"}\n🧠 RAM: ${MemoryWatchdog._usedMB()}MB`,
                        global.config.ADMINBOT[0]
                    );
                } catch(_) {}
            }, 5000);

            cron.schedule("0 0 */1 * * *", () => {
                try { api.changeBio(`Prefix: ${global.config.PREFIX}\nBot: ${global.config.BOTNAME}\nDate: ${momentt.format("MM/DD/YYYY")}`); } catch(_) {}
            }, { scheduled:true, timezone:"Asia/Baghdad" });

        });
    }

    tryLogin();
}

(async () => {
    logger("🚀 KIRA Ultra Enterprise — بدء التشغيل", "[ START ]");
    console.log(chalk.bold.hex("#eff1f0").bold("══════════ KIRA ULTRA ENTERPRISE ══════════"));
    onBot();
})();

process.on("unhandledRejection", err => {
    const msg = String(err?.message||err||"");
    if (isNetworkErr(err))  { logger(`🌐 شبكة (مُتجاهَل): ${msg}`,"[ ERROR ]"); return; }
    if (isMqttInitErr(err)) { logger(`📡 MQTT init (مُتجاهَل): ${msg}`,"[ ERROR ]"); return; }
    logger(`⚠️ unhandledRejection: ${msg}`,"[ ERROR ]");
});

process.on("uncaughtException", err => {
    const msg = String(err?.message||err||"");
    if (isNetworkErr(err)) { logger(`🌐 شبكة uncaught (مُتجاهَل): ${msg}`,"[ ERROR ]"); return; }
    logger(`💥 uncaughtException: ${msg}`,"[ ERROR ]");
});

process.on("SIGTERM", () => {
    logger("🛑 SIGTERM — إغلاق آمن","[ SHUTDOWN ]");
    try { if (global.client.api?.getAppState) { saveAppStateAtomic(global.client.api.getAppState()); logger("💾 AppState محفوظ ✅","[ SHUTDOWN ]"); } } catch(_) {}
    process.exit(0);
});

process.on("SIGINT", () => {
    logger("🛑 SIGINT — إغلاق آمن","[ SHUTDOWN ]");
    try { if (global.client.api?.getAppState) saveAppStateAtomic(global.client.api.getAppState()); } catch(_) {}
    process.exit(0);
});
