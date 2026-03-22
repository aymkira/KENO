const chalk = require('chalk');
var cron    = require("node-cron");
const { exec } = require("child_process");

exec("rm -rf script/commands/data && mkdir -p script/commands/data && rm -rf script/commands/tad/*", (error) => {
    if (error) { console.log(`error: ${error.message}`); return; }
    console.log(chalk.bold.hex("#00FA9A")("[ AUTO CLEAR CACHE ] 🪽❯ ") + chalk.hex("#00FA9A")("Successfully delete cache"));
});

const DateAndTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Baghdad' });
console.log(chalk.bold.hex("#059242").bold(DateAndTime));

const { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } = require("fs-extra");
const { join, resolve } = require("path");
const { execSync } = require('child_process');
const logger = require("./utils/log.js");
const login  = require("./includes/dongdev-FCA");
const https  = require("https");

// ✅ Session Keeper + Ultra Engine
const { createSessionKeeper } = require("./includes/dongdev-FCA/src/utils/sessionKeeper");
const AymanFCAEngine          = require("./includes/dongdev-FCA/ultra");

const listPackage        = JSON.parse(readFileSync('./package.json')).dependencies;
const listbuiltinModules = require("module").builtinModules;

const cacheDir = join(process.cwd(), 'script', 'commands', 'cache');
if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

console.log(chalk.bold.hex("#03f0fc").bold("[ KIRA ] » ") + chalk.bold.hex("#fcba03").bold("Initializing..."));

global.client = new Object({
    commands:        new Map(),
    events:          new Map(),
    cooldowns:       new Map(),
    eventRegistered: new Array(),
    handleSchedule:  new Array(),
    handleReaction:  new Array(),
    handleReply:     new Array(),
    mainPath:        process.cwd(),
    configPath:      new String(),
    api:             null,
    keeper:          null,
    engine:          null,
});

global.data = new Object({
    threadInfo:      new Map(),
    threadData:      new Map(),
    userName:        new Map(),
    userBanned:      new Map(),
    threadBanned:    new Map(),
    commandBanned:   new Map(),
    threadAllowNSFW: new Array(),
    allUserID:       new Array(),
    allCurrenciesID: new Array(),
    allThreadID:     new Array(),
});

global.utils        = require("./utils/index.js");
global.nodemodule   = new Object();
global.config       = new Object();
global.configModule = new Object();
global.moduleData   = new Array();
global.language     = new Object();

// ── config ────────────────────────────────────────────────────
var configValue;
try {
    global.client.configPath = join(global.client.mainPath, "config.json");
    configValue = require(global.client.configPath);
    logger.loader("Found file config: config.json");
} catch {
    if (existsSync(global.client.configPath.replace(/\.json/g,"") + ".temp")) {
        configValue = JSON.parse(readFileSync(global.client.configPath.replace(/\.json/g,"") + ".temp"));
        logger.loader("Found: config.json.temp");
    } else return logger.loader("config.json not found!", "error");
}

try {
    for (const key in configValue) global.config[key] = configValue[key];
    logger.loader("Config Loaded!");
} catch { return logger.loader("Can't load file config!", "error"); }

writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), 'utf8');

// ── language ──────────────────────────────────────────────────
const langFile = (readFileSync(`${__dirname}/languages/${global.config.language || "ar"}.lang`, { encoding: 'utf-8' })).split(/\r?\n|\r/);
const langData  = langFile.filter(item => item.indexOf('#') != 0 && item != '');
for (const item of langData) {
    const getSeparator = item.indexOf('=');
    const itemKey   = item.slice(0, getSeparator);
    const itemValue = item.slice(getSeparator + 1, item.length);
    const head  = itemKey.slice(0, itemKey.indexOf('.'));
    const key   = itemKey.replace(head + '.', '');
    const value = itemValue.replace(/\\n/gi, '\n');
    if (typeof global.language[head] == "undefined") global.language[head] = new Object();
    global.language[head][key] = value;
}

global.getText = function (...args) {
    const langText = global.language;
    if (!langText.hasOwnProperty(args[0])) return args[args.length - 1] || '';
    var text = langText[args[0]][args[1]] || '';
    for (var i = args.length - 1; i > 0; i--) {
        text = text.replace(RegExp(`%${i}`, 'g'), args[i + 1]);
    }
    return text;
};

// ── appState ──────────────────────────────────────────────────
var appStateFile = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));
var appState = [];

// ✅ اقرأ دائماً من الملف — لا من الذاكرة
function loadAppStateFromDisk() {
    try {
        const raw = JSON.parse(readFileSync(appStateFile, 'utf8'));
        return Array.isArray(raw) && raw.length > 0 ? raw : [];
    } catch { return []; }
}

appState = loadAppStateFromDisk();
if (appState.length > 0) logger.loader("✅ appstate موجود وصالح");
else logger.loader("⚠️ appstate غير موجود");

// ── GitHub backup ─────────────────────────────────────────────
function pushAppStateToGitHub(state) {
    const cfg = global.config;
    if (!cfg.GITHUB_TOKEN || !cfg.GITHUB_REPO) return;
    const content = Buffer.from(JSON.stringify(state)).toString('base64');
    const url     = `/repos/${cfg.GITHUB_REPO}/contents/appstate.json`;
    const headers = { 'Authorization':`token ${cfg.GITHUB_TOKEN}`, 'User-Agent':'KIRA-Bot', 'Content-Type':'application/json' };
    const getReq  = https.request({ hostname:'api.github.com', path:url, method:'GET', headers }, res => {
        let raw = '';
        res.on('data', d => raw += d);
        res.on('end', () => {
            try {
                const sha  = JSON.parse(raw).sha;
                const body = JSON.stringify({ message:'🔄 appState auto-save', content, sha });
                const putReq = https.request({
                    hostname:'api.github.com', path:url, method:'PUT',
                    headers:{ ...headers, 'Content-Length':Buffer.byteLength(body) }
                }, r => {
                    if (r.statusCode===200||r.statusCode===201)
                        logger('☁️ appState → GitHub ✅','[ SESSION ]');
                });
                putReq.on('error', ()=>{});
                putReq.write(body); putReq.end();
            } catch(_) {}
        });
    });
    getReq.on('error', ()=>{}); getReq.end();
}

// ════════════════════════════════════════════════════════════════
function onBot() {

    var _saveInterval, _keepAlive;

    function clearIntervals() {
        if (global.client.keeper) { try { global.client.keeper.stop(); } catch(_) {} global.client.keeper = null; }
        if (global.client.engine) { try { global.client.engine.stop(); } catch(_) {} global.client.engine = null; }
        [_saveInterval, _keepAlive].forEach(i => { if (i) clearInterval(i); });
        _saveInterval = null; _keepAlive = null;
    }

    var loginData  = {};
    var retryCount = 0;
    const MAX_RETRIES = 20;

    function reconnect(reason) {
        clearIntervals();
        retryCount++;
        if (retryCount > MAX_RETRIES) {
            logger(`💀 تجاوز الحد الأقصى (${MAX_RETRIES}). إيقاف.`, '[ LOGIN ]');
            process.exit(1);
        }
        // ✅ Exponential backoff
        const delay = Math.min(10000 * Math.pow(1.5, retryCount - 1), 5 * 60 * 1000);
        logger(`🔄 إعادة تشغيل (${retryCount}/${MAX_RETRIES}) بعد ${Math.round(delay/1000)}s — ${reason}`, '[ LOGIN ]');
        setTimeout(() => {
            // ✅ اقرأ appState الأحدث من الملف
            const fresh = loadAppStateFromDisk();
            if (fresh.length > 0) { appState = fresh; logger('📂 appState محدَّث ✅','[ SESSION ]'); }
            tryLogin();
        }, delay);
    }

    function tryLogin() {
        logger(`🔑 محاولة login #${retryCount + 1}`, '[ LOGIN ]');

        if (appState.length > 0) {
            loginData = { appState };
        } else {
            // ✅ لا تسجّل دخول بإيميل — أوقف مباشرة
            logger('❌ appstate مفقود — أوقف التشغيل', '[ LOGIN ]');
            process.exit(1);
        }

        login(loginData, {
            listenEvents:     true,
            logLevel:         "silent",
            pauseLog:         true,
            selfListen:       false,
            autoMarkRead:     false,
            autoMarkDelivery: false,
            online:           true,
            autoReconnect:    true,
            userAgent:        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }, async (err, api) => {
            if (err) {
                logger(`❌ فشل تسجيل الدخول: ${err?.message||err?.error||JSON.stringify(err)||"unknown"}`, '[ LOGIN ]');
                return reconnect('login failed');
            }

            retryCount = 0;
            logger('✅ تم تسجيل الدخول!', '[ LOGIN ]');
            global.client.api = api;
            global.client.timeStart = Date.now();

            // ── حفظ appState فوراً ──────────────────────────
            try {
                const newState = api.getAppState();
                if (newState && newState.length > 0) {
                    const tmp = appStateFile + ".tmp";
                    writeFileSync(tmp, JSON.stringify(newState, null, '\t'));
                    require('fs').renameSync(tmp, appStateFile);
                    appState = newState;
                    loginData['appState'] = newState;
                    logger('💾 appstate محفوظ ✅','[ SESSION ]');
                    pushAppStateToGitHub(newState);
                }
            } catch(e) { logger(`⚠️ فشل حفظ appState: ${e.message}`,'[ SESSION ]'); }

            // ── ✅ استخراج ctx الحقيقي ──────────────────────
            let realCtx = null;
            for (const key of Object.getOwnPropertyNames(api)) {
                try {
                    const v = api[key];
                    if (v && typeof v==="object" && v.jar && v.userID && v.userID!=="0") {
                        realCtx = v; break;
                    }
                } catch(_) {}
            }
            if (realCtx) {
                api.ctx = realCtx; api.ctxMain = realCtx;
                logger(`🧠 ctx مُستخرج ✅ | UID:${realCtx.userID} | Region:${realCtx.region||"?"}`, '[ SESSION ]');
            }

            // ── ✅ Session Keeper ────────────────────────────
            try {
                global.client.keeper = createSessionKeeper(api, realCtx||{}, {
                    appStatePath: appStateFile,
                    onSave: (state) => {
                        try { appState=state; loginData['appState']=state; pushAppStateToGitHub(state); } catch(_) {}
                    }
                });
                global.client.keeper.start();

                // ربط watchdog reconnect
                if (realCtx?._emitter) {
                    realCtx._emitter.on("watchdog_reconnect", ({reason}) => {
                        logger(`⚠️ Watchdog: ${reason}`, '[ SESSION ]');
                        reconnect(reason);
                    });
                }
            } catch(e) { logger(`⚠️ Session Keeper خطأ: ${e.message}`, '[ SESSION ]'); }

            // ── ✅ Ultra Engine (Watchdog + Health + Memory + Queue) ──
            try {
                const engine = new AymanFCAEngine({
                    loginLib:    login,
                    appStatePath: appStateFile,
                    onSave: (state) => {
                        try { appState=state; loginData['appState']=state; pushAppStateToGitHub(state); } catch(_) {}
                    }
                });
                // ربط الأنظمة بالـ api الحالي بدون تسجيل دخول جديد
                engine.session.attach(api);
                engine.keepAlive.attach(api, realCtx||{});
                engine.watchdog.attach(api, realCtx||{});
                engine.memory.registerCleanup(()=>{
                    if (realCtx?.tasks instanceof Map && realCtx.tasks.size>100) realCtx.tasks.clear();
                });
                engine.session.start();
                engine.keepAlive.start();
                engine.watchdog.start();
                engine.memory.start();
                engine.queue.start();
                engine.health.start();

                // ربط أحداث الـ engine
                engine.watchdog.on("watchdog:restart", ({reasons}) => {
                    logger(`⚠️ Ultra Watchdog: ${reasons}`, '[ ENGINE ]');
                    reconnect("watchdog:" + reasons);
                });
                engine.health.on("health:critical", ({score}) => {
                    logger(`⚠️ Ultra Health منخفض (${score})`, '[ ENGINE ]');
                    reconnect("health_critical");
                });

                global.client.engine = engine;
                logger(`🚀 Ultra Engine مفعّل ✅ | Health:${engine.health.score}/100`, '[ ENGINE ]');
            } catch(e) {
                logger(`⚠️ Ultra Engine خطأ: ${e.message}`, '[ ENGINE ]');
            }

            api.setOptions({ listenEvents:true, selfListen:false, autoMarkRead:false, autoMarkDelivery:false });

            // ── تحميل الأوامر ────────────────────────────────
            (function () {
                const cmdDirs = [];
                function scanDir(dir) {
                    for (const item of readdirSync(dir, { withFileTypes: true })) {
                        const full = join(dir, item.name);
                        if (item.isDirectory()) scanDir(full);
                        else if (item.name.endsWith('.js') && !global.config.commandDisabled?.includes(item.name))
                            cmdDirs.push(full);
                    }
                }
                scanDir(join(global.client.mainPath, 'script', 'commands'));

                for (const filePath of cmdDirs) {
                    try {
                        delete require.cache[require.resolve(filePath)];
                        const module = require(filePath);
                        if (!module.config || !module.run) throw new Error(global.getText('mirai','errorFormat')||'missing config/run');
                        if (global.client.commands.has(module.config.name)) throw new Error(global.getText('mirai','nameExist')||'Name Is Repeated');

                        if (module.config.dependencies && typeof module.config.dependencies=='object') {
                            for (const dep in module.config.dependencies) {
                                const depPath = join(__dirname,'nodemodules','node_modules',dep);
                                try {
                                    if (!global.nodemodule.hasOwnProperty(dep)) {
                                        if (listPackage.hasOwnProperty(dep)||listbuiltinModules.includes(dep))
                                            global.nodemodule[dep]=require(dep);
                                        else global.nodemodule[dep]=require(depPath);
                                    }
                                } catch {
                                    let check=false, isError;
                                    execSync('npm --package-lock false --save install '+dep,{stdio:'inherit',env:process.env,shell:true,cwd:join(__dirname,'nodemodules')});
                                    for (let i=1;i<=3;i++) {
                                        try {
                                            require.cache={};
                                            if (listPackage.hasOwnProperty(dep)||listbuiltinModules.includes(dep))
                                                global.nodemodule[dep]=require(dep);
                                            else global.nodemodule[dep]=require(depPath);
                                            check=true; break;
                                        } catch(e){ isError=e; }
                                        if (check||!isError) break;
                                    }
                                    if (!check||isError) throw `Can't install ${dep}`;
                                }
                            }
                        }

                        if (module.config.envConfig) {
                            for (const env in module.config.envConfig) {
                                if (typeof global.configModule[module.config.name]=='undefined') global.configModule[module.config.name]={};
                                if (typeof global.config[module.config.name]=='undefined') global.config[module.config.name]={};
                                if (typeof global.config[module.config.name][env]!=='undefined')
                                    global.configModule[module.config.name][env]=global.config[module.config.name][env];
                                else global.configModule[module.config.name][env]=module.config.envConfig[env]||'';
                                if (typeof global.config[module.config.name][env]=='undefined')
                                    global.config[module.config.name][env]=module.config.envConfig[env]||'';
                            }
                        }

                        if (module.onLoad) {
                            try { module.onLoad({api}); }
                            catch(e){ throw new Error(`onLoad error in ${module.config.name}: ${e.message}`); }
                        }

                        if (module.handleEvent) global.client.eventRegistered.push(module.config.name);
                        global.client.commands.set(module.config.name, module);
                        logger.loader(global.getText('mirai','successLoadModule',module.config.name)||`Loaded ${module.config.name}`);
                    } catch(error) {
                        logger.loader(`${global.getText('mirai','failLoadModule','',error.message||error)||`Can't load ${error.message||error}`}`,'error');
                    }
                }
            })();

            // ── تحميل الأحداث ────────────────────────────────
            (function () {
                const evList = readdirSync(global.client.mainPath+'/script/events')
                    .filter(f=>f.endsWith('.js')&&!global.config.eventDisabled?.includes(f));
                for (const ev of evList) {
                    try {
                        var event = require(global.client.mainPath+'/script/events/'+ev);
                        if (!event.config||!event.run) throw new Error(global.getText('mirai','errorFormat')||'missing config/run');
                        if (global.client.events.has(event.config.name||'')) throw new Error(global.getText('mirai','nameExist')||'Name Is Repeated');
                        if (event.config.envConfig) {
                            for (const env in event.config.envConfig) {
                                if (typeof global.configModule[event.config.name]=='undefined') global.configModule[event.config.name]={};
                                if (typeof global.config[event.config.name]=='undefined') global.config[event.config.name]={};
                                if (typeof global.config[event.config.name][env]!=='undefined')
                                    global.configModule[event.config.name][env]=global.config[event.config.name][env];
                                else global.configModule[event.config.name][env]=event.config.envConfig[env]||'';
                                if (typeof global.config[event.config.name][env]=='undefined')
                                    global.config[event.config.name][env]=event.config.envConfig[env]||'';
                            }
                        }
                        if (event.onLoad) {
                            try { event.onLoad({api}); }
                            catch(e){ throw new Error(`onLoad error in ${event.config.name}: ${e.message}`); }
                        }
                        global.client.events.set(event.config.name, event);
                        logger.loader(global.getText('mirai','successLoadModule',event.config.name)||`Loaded ${event.config.name}`);
                    } catch(error) {
                        logger.loader(`${global.getText('mirai','failLoadModule',event.config?.name,error)||`Can't load ${error.message||error}`}`,'error');
                    }
                }
            })();

            logger.loader(global.getText('mirai','finishLoadModule',global.client.commands.size,global.client.events.size)||`Installed ${global.client.commands.size} commands and ${global.client.events.size} events`);
            logger.loader('=== '+(Date.now()-global.client.timeStart)+'ms ===');
            writeFileSync(global.client.configPath, JSON.stringify(global.config,null,4),'utf8');
            if (existsSync(global.client.configPath+".temp")) unlinkSync(global.client.configPath+".temp");

            // ── listener ─────────────────────────────────────
            const listener = require('./includes/listen.js')({api, models:null});

            function listenerCallback(error, message) {
                if (error) {
                    if (error?.type==="stop_listen") return;
                    // ✅ account_inactive معالج صح
                    if (error?.type==="account_inactive") {
                        logger(`🔐 جلسة منتهية: ${error.reason||error.error}`,'[ SESSION ]');
                        return reconnect('account_inactive');
                    }
                    logger(`⚠️ listenMqtt error: ${JSON.stringify(error)}`,'[ LISTEN ]');
                    return reconnect('listen error');
                }
                if (['presence','typ','read_receipt'].includes(message?.type)) return;
                // ✅ heartbeat للـ Watchdog
                if (global.client.engine?.watchdog) global.client.engine.watchdog.heartbeat();
                if (global.config.DeveloperMode==true) console.log(message);
                return listener(message);
            }

            global.handleListen = api.listenMqtt(listenerCallback);

            // ── حفظ دوري + keep-alive ────────────────────────
            _saveInterval = setInterval(()=>{
                try {
                    const newState = api.getAppState();
                    if (!newState||newState.length===0) return;
                    const tmp = appStateFile+".tmp";
                    writeFileSync(tmp, JSON.stringify(newState,null,'\t'));
                    require('fs').renameSync(tmp, appStateFile);
                    appState=newState; loginData['appState']=newState;
                    logger('💾 appState ✅','[ SESSION ]');
                    pushAppStateToGitHub(newState);
                } catch(e){ logger(`⚠️ ${e.message}`,'[ SESSION ]'); }
            }, 10*60*1000);

            // ✅ keep-alive بدون reconnect عند الفشل
            _keepAlive = setInterval(()=>{
                try { api.markAsReadAll(()=>{}); } catch(_) {}
            }, 5*60*1000);

            // ── إشعار التشغيل ─────────────────────────────────
            const momentt = require("moment-timezone").tz("Asia/Baghdad");
            const time    = momentt.format("HH:mm:ss");
            try { api.sendMessage(`✅ KIRA شغّال — ${time}`, global.config.ADMINBOT[0]); } catch(_) {}

            cron.schedule('0 0 */1 * * *', ()=>{
                const o = momentt.format("MM/DD/YYYY");
                try { api.changeBio(`Prefix: ${global.config.PREFIX}\nBot: ${global.config.BOTNAME}\nDate: ${o}`); } catch(_) {}
            }, { scheduled:true, timezone:"Asia/Baghdad" });

        }); // end login
    } // end tryLogin

    tryLogin();
} // end onBot

// ── Start ─────────────────────────────────────────────────────
(async () => {
    logger('🚀 بدء تشغيل KIRA Ultra', '[ START ]');
    console.log(chalk.bold.hex("#eff1f0").bold("════════════════ KIRA ULTRA ONLINE ═══════════════"));
    onBot();
})();

// ── معالجة الأخطاء العالمية ──────────────────────────────────
process.on('unhandledRejection', (err) => {
    const msg = String(err?.message||err||"");
    if (/ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|fetch failed|timeout/i.test(msg)) {
        logger(`⚠️ شبكة (مُتجاهَل): ${msg}`,'[ ERROR ]'); return;
    }
    logger(`⚠️ unhandledRejection: ${msg}`,'[ ERROR ]');
});

process.on('uncaughtException', (err) => {
    const msg = String(err?.message||err||"");
    if (/ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|fetch failed|timeout/i.test(msg)) {
        logger(`⚠️ شبكة uncaught (مُتجاهَل): ${msg}`,'[ ERROR ]'); return;
    }
    logger(`💥 uncaughtException: ${msg}`,'[ ERROR ]');
});
