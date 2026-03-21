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
const logger    = require("./utils/log.js");
const login     = require("./includes/FCA");
const axios     = require("axios");
const https     = require("https");
const listPackage        = JSON.parse(readFileSync('./package.json')).dependencies;
const listbuiltinModules = require("module").builtinModules;

// ── أنشئ مجلد cache لو ما موجود ─────────────────────────────────
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

// ── config ──────────────────────────────────────────────────────
var configValue;
try {
    global.client.configPath = join(global.client.mainPath, "config.json");
    configValue = require(global.client.configPath);
    logger.loader("Found file config: config.json");
} catch {
    if (existsSync(global.client.configPath.replace(/\.json/g,"") + ".temp")) {
        configValue = JSON.parse(readFileSync(global.client.configPath.replace(/\.json/g,"") + ".temp"));
        logger.loader(`Found: config.json.temp`);
    } else return logger.loader("config.json not found!", "error");
}

try {
    for (const key in configValue) global.config[key] = configValue[key];
    logger.loader("Config Loaded!");
} catch { return logger.loader("Can't load file config!", "error"); }

// ── تحقق من GITHUB_TOKEN ────────────────────────────────────────
if (!global.config.GITHUB_TOKEN) {
    logger.loader("⚠️ GITHUB_TOKEN مو موجود في config.json — data.js لن يعمل!", "error");
}

writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), 'utf8');

// ── language ─────────────────────────────────────────────────────
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

// ── appState ─────────────────────────────────────────────────────
var appStateFile = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));
var appState = [];
try {
    const raw = require(appStateFile);
    appState = Array.isArray(raw) && raw.length > 0 ? raw : [];
    if (appState.length > 0) logger.loader("✅ appstate موجود وصالح");
    else logger.loader("⚠️ appstate فارغ — سيتم تسجيل الدخول بالإيميل");
} catch {
    logger.loader("⚠️ appstate غير موجود — سيتم تسجيل الدخول بالإيميل");
}

// ── GitHub backup للـ appState ───────────────────────────────────
function pushAppStateToGitHub(state) {
    const cfg = global.config;
    if (!cfg.GITHUB_TOKEN || !cfg.GITHUB_REPO) return;
    const content = Buffer.from(JSON.stringify(state)).toString('base64');
    const url     = `/repos/${cfg.GITHUB_REPO}/contents/appstate.json`;
    const headers = {
        'Authorization': `token ${cfg.GITHUB_TOKEN}`,
        'User-Agent':    'KIRA-Bot',
        'Content-Type':  'application/json',
    };
    const getReq = https.request({ hostname: 'api.github.com', path: url, method: 'GET', headers }, res => {
        let raw = '';
        res.on('data', d => raw += d);
        res.on('end', () => {
            try {
                const sha  = JSON.parse(raw).sha;
                const body = JSON.stringify({ message: '🔄 appState auto-save', content, sha });
                const putReq = https.request({
                    hostname: 'api.github.com', path: url, method: 'PUT',
                    headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
                }, r => {
                    if (r.statusCode === 200 || r.statusCode === 201)
                        logger('☁️ appState → GitHub ✅', '[ SESSION ]');
                    else
                        logger(`☁️ GitHub فشل: ${r.statusCode}`, '[ SESSION ]');
                });
                putReq.on('error', e => logger(`☁️ GitHub error: ${e.message}`, '[ SESSION ]'));
                putReq.write(body);
                putReq.end();
            } catch(e) { logger(`☁️ GitHub parse error: ${e.message}`, '[ SESSION ]'); }
        });
    });
    getReq.on('error', () => {});
    getReq.end();
}

// ────────────────────────────────────────────────────────────────
function onBot() {

    var _saveInterval, _keepAlive, _cookieRefresh, _healthCheck;

    function clearIntervals() {
        [_saveInterval, _keepAlive, _cookieRefresh, _healthCheck].forEach(i => {
            if (i) clearInterval(i);
        });
    }

    var loginData = {};
    var retryCount = 0;
    const MAX_RETRIES = 5;

    function reconnect(reason) {
        clearIntervals();
        retryCount++;
        if (retryCount > MAX_RETRIES) {
            logger(`💀 تجاوز الحد الأقصى لإعادة المحاولة (${MAX_RETRIES}). إيقاف.`, '[ LOGIN ]');
            process.exit(1);
        }
        const delay = Math.min(retryCount * 15000, 60000);
        logger(`🔄 إعادة تشغيل (${retryCount}/${MAX_RETRIES}) بعد ${delay/1000}s — السبب: ${reason}`, '[ LOGIN ]');
        setTimeout(tryLogin, delay);
    }

    function tryLogin() {
        logger(`🔑 محاولة login #${retryCount + 1}`, '[ LOGIN ]');

        if (appState.length > 0) {
            loginData = { appState };
        } else if (global.config.EMAIL && global.config.PASSWORD) {
            loginData = { email: global.config.EMAIL, password: global.config.PASSWORD };
        } else {
            logger('❌ لا يوجد appstate أو إيميل في config.json', '[ LOGIN ]', 'error');
            return;
        }

        login(loginData, { listenEvents: true, logLevel: "silent", pauseLog: true, userAgent: "Mozilla/5.0" }, async (err, api) => {
            if (err) {
                logger(`❌ فشل تسجيل الدخول: ${JSON.stringify(err)}`, '[ LOGIN ]');
                return reconnect('login failed');
            }

            retryCount = 0;
            logger('✅ تم تسجيل الدخول!', '[ LOGIN ]');
            global.client.api = api;
            global.client.timeStart = Date.now();

            // حفظ appState فوراً
            try {
                const newState = api.getAppState();
                writeFileSync(appStateFile, JSON.stringify(newState, null, '\t'));
                appState = newState;
                loginData['appState'] = newState;
                logger('💾 appstate محفوظ بعد تسجيل الدخول ✅', '[ SESSION ]');
                pushAppStateToGitHub(newState);
            } catch(e) { logger(`⚠️ فشل حفظ appState: ${e.message}`, '[ SESSION ]'); }

            api.setOptions({
                listenEvents:  true,
                selfListen:    false,
                autoMarkRead:  false,
                autoMarkDelivery: false,
            });

            // ── تحميل الأوامر ────────────────────────────────────
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
                        // ── GoatBot compatibility ──
                        if (module.onStart && !module.run) {
                            module.run = function(args) {
                                return module.onStart.call(module, args);
                            };
                        }
                        // دعم onChat من GoatBot
                        if (module.onChat && !module.handleEvent) {
                            module.handleEvent = function(args) {
                                return module.onChat.call(module, args);
                            };
                        }
                        if (!module.config || !module.run) throw new Error(global.getText('mirai', 'errorFormat') || 'missing config/run');
                        if (global.client.commands.has(module.config.name)) throw new Error(global.getText('mirai', 'nameExist') || 'Name Is Repeated');

                        // تثبيت الـ dependencies تلقائياً
                        if (module.config.dependencies && typeof module.config.dependencies == 'object') {
                            for (const dep in module.config.dependencies) {
                                const depPath = join(__dirname, 'nodemodules', 'node_modules', dep);
                                try {
                                    if (!global.nodemodule.hasOwnProperty(dep)) {
                                        if (listPackage.hasOwnProperty(dep) || listbuiltinModules.includes(dep))
                                            global.nodemodule[dep] = require(dep);
                                        else global.nodemodule[dep] = require(depPath);
                                    }
                                } catch {
                                    let check = false, isError;
                                    execSync('npm --package-lock false --save install ' + dep, { stdio: 'inherit', env: process.env, shell: true, cwd: join(__dirname, 'nodemodules') });
                                    for (let i = 1; i <= 3; i++) {
                                        try {
                                            require.cache = {};
                                            if (listPackage.hasOwnProperty(dep) || listbuiltinModules.includes(dep))
                                                global.nodemodule[dep] = require(dep);
                                            else global.nodemodule[dep] = require(depPath);
                                            check = true; break;
                                        } catch (e) { isError = e; }
                                        if (check || !isError) break;
                                    }
                                    if (!check || isError) throw global.getText('mirai', 'cantInstallPackage', dep, module.config.name) || `Can't install ${dep}`;
                                }
                            }
                        }

                        if (module.config.envConfig) {
                            for (const env in module.config.envConfig) {
                                if (typeof global.configModule[module.config.name] == 'undefined') global.configModule[module.config.name] = {};
                                if (typeof global.config[module.config.name] == 'undefined') global.config[module.config.name] = {};
                                if (typeof global.config[module.config.name][env] !== 'undefined')
                                    global.configModule[module.config.name][env] = global.config[module.config.name][env];
                                else global.configModule[module.config.name][env] = module.config.envConfig[env] || '';
                                if (typeof global.config[module.config.name][env] == 'undefined')
                                    global.config[module.config.name][env] = module.config.envConfig[env] || '';
                            }
                        }

                        if (module.onLoad) {
                            try { module.onLoad({ api }); }
                            catch (e) { throw new Error(`onLoad error in ${module.config.name}: ${e.message}`); }
                        }

                        if (module.handleEvent) global.client.eventRegistered.push(module.config.name);
                        global.client.commands.set(module.config.name, module);
                        logger.loader(global.getText('mirai', 'successLoadModule', module.config.name) || `Successfully installed module ${module.config.name}`);
                    } catch (error) {
                        logger.loader(`${global.getText('mirai', 'failLoadModule', '', error.message || error) || `Can't install module ${error.message || error}`}`, 'error');
                    }
                }
            })();

            // ── تحميل الأحداث ────────────────────────────────────
            (function () {
                const evList = readdirSync(global.client.mainPath + '/script/events')
                    .filter(f => f.endsWith('.js') && !global.config.eventDisabled?.includes(f));

                for (const ev of evList) {
                    try {
                        var event = require(global.client.mainPath + '/script/events/' + ev);
                        if (!event.config || !event.run) throw new Error(global.getText('mirai', 'errorFormat') || 'missing config/run');
                        if (global.client.events.has(event.config.name || '')) throw new Error(global.getText('mirai', 'nameExist') || 'Name Is Repeated');

                        if (event.config.envConfig) {
                            for (const env in event.config.envConfig) {
                                if (typeof global.configModule[event.config.name] == 'undefined') global.configModule[event.config.name] = {};
                                if (typeof global.config[event.config.name] == 'undefined') global.config[event.config.name] = {};
                                if (typeof global.config[event.config.name][env] !== 'undefined')
                                    global.configModule[event.config.name][env] = global.config[event.config.name][env];
                                else global.configModule[event.config.name][env] = event.config.envConfig[env] || '';
                                if (typeof global.config[event.config.name][env] == 'undefined')
                                    global.config[event.config.name][env] = event.config.envConfig[env] || '';
                            }
                        }

                        if (event.onLoad) {
                            try { event.onLoad({ api }); }
                            catch (e) { throw new Error(`onLoad error in ${event.config.name}: ${e.message}`); }
                        }

                        global.client.events.set(event.config.name, event);
                        logger.loader(global.getText('mirai', 'successLoadModule', event.config.name) || `Successfully installed module ${event.config.name}`);
                    } catch (error) {
                        logger.loader(`${global.getText('mirai', 'failLoadModule', event.config?.name, error) || `Can't install module ${error.message || error}`}`, 'error');
                    }
                }
            })();

            logger.loader(global.getText('mirai', 'finishLoadModule', global.client.commands.size, global.client.events.size) || `Installed ${global.client.commands.size} module commands and ${global.client.events.size} module events successfully`);
            logger.loader('=== ' + (Date.now() - global.client.timeStart) + 'ms ===');
            writeFileSync(global.client.configPath, JSON.stringify(global.config, null, 4), 'utf8');
            if (existsSync(global.client.configPath + ".temp")) unlinkSync(global.client.configPath + ".temp");

            // ── listener ─────────────────────────────────────────
            const listener = require('./includes/listen.js')({ api, models: null });

            function listenerCallback(error, message) {
                if (error) {
                    if (error?.type === "stop_listen") return;
                    logger(`⚠️ listenMqtt error: ${JSON.stringify(error)}`, '[ LISTEN ]');
                    return reconnect('listen error');
                }
                if (['presence', 'typ', 'read_receipt'].includes(message?.type)) return;
                if (global.config.DeveloperMode == true) console.log(message);
                return listener(message);
            }

            global.handleListen = api.listenMqtt(listenerCallback);

            // ── Session Protection ────────────────────────────────

            // ① حفظ appState كل 10 دقائق
            _saveInterval = setInterval(() => {
                try {
                    const newState = api.getAppState();
                    if (!newState || newState.length === 0) return;
                    writeFileSync(appStateFile, JSON.stringify(newState, null, '\t'));
                    appState = newState;
                    loginData['appState'] = newState;
                    logger('💾 appState محفوظ ✅', '[ SESSION ]');
                    pushAppStateToGitHub(newState);
                } catch(e) { logger(`⚠️ فشل حفظ appState: ${e.message}`, '[ SESSION ]'); }
            }, 10 * 60 * 1000);

            // ② keep-alive كل 5 دقائق
            _keepAlive = setInterval(() => {
                try { api.markAsReadAll(() => {}); } catch(_) {}
            }, 5 * 60 * 1000);

            // ③ تجديد cookies كل 20 دقيقة
            _cookieRefresh = setInterval(async () => {
                try {
                    await new Promise((res, rej) => {
                        api.getUserInfo(api.getCurrentUserID(), (err, data) => {
                            if (err) return rej(err);
                            res(data);
                        });
                    });
                    const refreshed = api.getAppState();
                    if (refreshed && refreshed.length > 0) {
                        writeFileSync(appStateFile, JSON.stringify(refreshed, null, '\t'));
                        appState = refreshed;
                        loginData['appState'] = refreshed;
                        logger('🔄 Cookies مجدَّدة ✅', '[ SESSION ]');
                    }
                } catch(e) {
                    logger(`🔄 تجديد Cookies فشل: ${e.message}`, '[ SESSION ]');
                    reconnect('cookie refresh failed');
                }
            }, 20 * 60 * 1000);

            // ④ فحص صحة Session كل ساعة
            _healthCheck = setInterval(async () => {
                try {
                    await new Promise((res, rej) => {
                        api.getUserInfo(api.getCurrentUserID(), (err) => err ? rej(err) : res());
                    });
                    logger('🩺 Session سليمة ✅', '[ SESSION ]');
                } catch(e) {
                    logger(`🩺 Session ماتت: ${e.message}`, '[ SESSION ]');
                    reconnect('session health check failed');
                }
            }, 60 * 60 * 1000);

            // ── إشعار التشغيل ─────────────────────────────────────
            const momentt = require("moment-timezone").tz("Asia/Baghdad");
            const time    = momentt.format("HH:mm:ss");
            try { api.sendMessage(`✅ البوت شغّال — ${time}`, global.config.ADMINBOT[0]); } catch(_) {}

            // ── cron — تحديث البيو يومياً ──────────────────────────
            cron.schedule('0 0 */1 * * *', () => {
                const o = momentt.format("MM/DD/YYYY");
                try { api.changeBio(`Prefix: ${global.config.PREFIX}\nBot: ${global.config.BOTNAME}\nDate: ${o}`); } catch(_) {}
            }, { scheduled: true, timezone: "Asia/Baghdad" });

        }); // end login callback
    } // end tryLogin

    tryLogin();
} // end onBot

// ── Start ────────────────────────────────────────────────────────
(async () => {
    // لا نحتاج Sequelize — data.js يعمل مباشرة
    logger('🚀 بدء تشغيل KIRA بدون Sequelize', '[ DATABASE ]');
    console.log(chalk.bold.hex("#eff1f0").bold("════════════════ KIRA ONLINE ═════════════════"));
    onBot();
})();

// ── معالجة الأخطاء ───────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
    logger(`⚠️ unhandledRejection: ${err?.message || err}`, '[ ERROR ]');
});

process.on('uncaughtException', (err) => {
    logger(`💥 uncaughtException: ${err?.message || err}`, '[ ERROR ]');
});
