const chalk = require('chalk');
var cron = require("node-cron");
const { exec } = require("child_process");

exec("rm -rf script/commands/data && mkdir -p script/commands/data && rm -rf script/commands/tad/* ", (error, stdout, stderr) => {
    if (error) { console.log(`error: ${error.message}`); return; }
    console.log(chalk.bold.hex("#00FA9A")("[ AUTO CLEAR CACHE ] 🪽❯ ") + chalk.hex("#00FA9A")("Successfully delete cache"));
});

const DateAndTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
console.log(chalk.bold.hex("#059242").bold(DateAndTime));

const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } = require("fs-extra");
const { join, resolve } = require("path");
const { execSync } = require('child_process');
const logger    = require("./utils/log.js");
const login     = require("@dongdev/fca-unofficial");
const axios     = require("axios");
const https     = require("https");
const listPackage       = JSON.parse(readFileSync('./package.json')).dependencies;
const listbuiltinModules = require("module").builtinModules;

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

const { Sequelize, sequelize } = require("./includes/database/index.js");
writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), 'utf8');

// ── language ─────────────────────────────────────────────────────
const langFile = (readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, { encoding: 'utf-8' })).split(/\r?\n|\r/);
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
    if (!langText.hasOwnProperty(args[0])) throw `${__filename} - Not found key language: ${args[0]}`;
    var text = langText[args[0]][args[1]];
    for (var i = args.length - 1; i > 0; i--) {
        text = text.replace(RegExp(`%${i}`, 'g'), args[i + 1]);
    }
    return text;
};

// ── appState ─────────────────────────────────────────────────────
console.log(global.getText('mirai', 'foundPathAppstate'));
try {
    var appStateFile = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));
    var appState     = require(appStateFile);
    logger.loader(global.getText("mirai", "foundPathAppstate"));
} catch { return logger.loader(global.getText("mirai", "notFoundPathAppstate"), "error"); }

// ── GitHub backup helper ──────────────────────────────────────────
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

    // GET SHA ثم PUT
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
    getReq.on('error', e => logger(`☁️ GitHub GET error: ${e.message}`, '[ SESSION ]'));
    getReq.end();
}

// ── Main Bot Function ─────────────────────────────────────────────
function onBot({ models: botModel }) {
    const loginData = {};
    loginData['appState'] = appState;
    let _loginAttempt = 0;
    let _saveInterval = null;
    let _reconnecting = false;

    let _reconnectDelay = 5000;   // يبدأ بـ 5 ثواني
    const _maxDelay     = 60000;  // حد أقصى 60 ثانية

    // ── reconnect helper ─────────────────────────────────────────
    function reconnect(reason) {
        if (_reconnecting) return;
        _reconnecting = true;
        if (_saveInterval) { clearInterval(_saveInterval); _saveInterval = null; }
        logger(`🔄 reconnect بعد ${_reconnectDelay/1000}s: ${reason}`, '[ SESSION ]');
        setTimeout(() => {
            _reconnecting = false;
            // exponential backoff: كل فشل يضاعف الوقت حتى الـ max
            _reconnectDelay = Math.min(_reconnectDelay * 2, _maxDelay);
            tryLogin();
        }, _reconnectDelay);
    }

    // ── tryLogin ─────────────────────────────────────────────────
    // ③ فحص صلاحية الـ cookie
    async function checkCookieValid() {
        try {
            const axios   = require('axios');
            const cookies = JSON.stringify(appState);
            const res     = await axios.get('https://mbasic.facebook.com/settings', {
                headers: {
                    'cookie':     cookies,
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 8000,
            });
            const valid = res.data.includes('/notifications.php?') ||
                          res.data.includes('/privacy/xcs/') ||
                          res.data.includes('save-password-interstitial');
            logger(`🍪 Cookie: ${valid ? '✅ صالحة' : '❌ منتهية'}`, '[ SESSION ]');
            return valid;
        } catch(e) {
            logger(`🍪 فحص Cookie فشل: ${e.message}`, '[ SESSION ]');
            return true; // نفترض صالحة لو فشل الفحص
        }
    }

    function tryLogin() {
        _loginAttempt++;
        logger(`🔑 محاولة login #${_loginAttempt}`, '[ LOGIN ]');

        login(loginData, async (loginError, api) => {
            if (loginError) {
                logger(`❌ Login فشل (${_loginAttempt}): ${JSON.stringify(loginError)}`, '[ LOGIN ]');
                const delay = Math.min(10000 * _loginAttempt, 60000);
                logger(`⏳ إعادة بعد ${delay / 1000}s...`, '[ LOGIN ]');
                // فحص الـ cookie قبل إعادة المحاولة
            checkCookieValid().then(valid => {
                if (!valid) logger('⚠️ الـ Cookie منتهية — قد تحتاج appstate جديد', '[ SESSION ]');
            }).catch(() => {});
            return setTimeout(tryLogin, delay);
            }

            _loginAttempt = 0;
            _reconnectDelay = 5000; // إعادة ضبط الـ backoff بعد نجاح login
            logger('✅ تم تسجيل الدخول!', '[ LOGIN ]');

            // ── dongdev: استمع لأحداث الـ session ─────────────────
            api.on('sessionExpired', () => {
                logger('⚠️ Session منتهية — @dongdev يعيد تسجيل الدخول تلقائياً...', '[ SESSION ]');
            });
            api.on('autoLoginSuccess', () => {
                logger('✅ @dongdev: auto-login نجح — البوت يعمل من جديد', '[ SESSION ]');
            });

            // ① دمج autoReconnect مع FCAOption
            api.setOptions({
                ...global.config.FCAOption,
                autoReconnect: true,
            });
            writeFileSync(appStateFile, JSON.stringify(api.getAppState(), null, '\x09'));
            global.config.version = '1.2.14';
            global.client.timeStart = Date.now();
            global.client.api = api;

            // ── تحميل الأوامر ─────────────────────────────────────
            (function () {
                const getAllFiles = (dir) => {
                    const entries = readdirSync(dir, { withFileTypes: true });
                    return entries.flatMap(e => {
                        const full = join(dir, e.name);
                        return e.isDirectory() ? getAllFiles(full) : full;
                    });
                };

                const cmdDir  = join(global.client.mainPath, 'script/commands');
                const cmdList = getAllFiles(cmdDir).filter(f =>
                    f.endsWith('.js') &&
                    !f.includes('example') &&
                    !global.config.commandDisabled.some(d => f.includes(d))
                );

                for (const commandPath of cmdList) {
                    try {
                        var module = require(commandPath);
                        if (!module.config || !module.run || !module.config.commandCategory)
                            throw new Error("Error in cmd format");
                        if (global.client.commands.has(module.config.name || ''))
                            throw new Error("Name Is Repeated");

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
                                    logger.loader(global.getText('mirai', 'notFoundPackage', dep, module.config.name), 'warn');
                                    execSync('npm ---package-lock false --save install ' + dep, { stdio: 'inherit', env: process.env, shell: true, cwd: join(__dirname, 'nodemodules') });
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
                                    if (!check || isError) throw global.getText('mirai', 'cantInstallPackage', dep, module.config.name, isError);
                                }
                            }
                            logger.loader(global.getText('mirai', 'loadedPackage', module.config.name));
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
                            logger.loader(global.getText('mirai', 'loadedConfig', module.config.name));
                        }

                        if (module.onLoad) {
                            try { module.onLoad({ api, models: botModel }); }
                            catch (e) { throw new Error(global.getText('mirai', 'cantOnload', module.config.name, JSON.stringify(e))); }
                        }

                        if (module.handleEvent) global.client.eventRegistered.push(module.config.name);
                        global.client.commands.set(module.config.name, module);
                        logger.loader(global.getText('mirai', 'successLoadModule', module.config.name));
                    } catch (error) {
                        logger.loader(global.getText('mirai', 'failLoadModule', error.message || error, error), 'error');
                    }
                }
            })();

            // ── تحميل الأحداث ─────────────────────────────────────
            (function () {
                const evList = readdirSync(global.client.mainPath + '/script/events')
                    .filter(f => f.endsWith('.js') && !global.config.eventDisabled.includes(f));

                for (const ev of evList) {
                    try {
                        var event = require(global.client.mainPath + '/script/events/' + ev);
                        if (!event.config || !event.run) throw new Error(global.getText('mirai', 'errorFormat'));
                        if (global.client.events.has(event.config.name || '')) throw new Error(global.getText('mirai', 'nameExist'));

                        if (event.config.dependencies && typeof event.config.dependencies == 'object') {
                            for (const dep in event.config.dependencies) {
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
                                    if (!check || isError) throw global.getText('mirai', 'cantInstallPackage', dep, event.config.name);
                                }
                            }
                        }

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
                            try { event.onLoad({ api, models: botModel }); }
                            catch (e) { throw new Error(global.getText('mirai', 'cantOnload', event.config.name, JSON.stringify(e))); }
                        }

                        global.client.events.set(event.config.name, event);
                        logger.loader(global.getText('mirai', 'successLoadModule', event.config.name));
                    } catch (error) {
                        logger.loader(global.getText('mirai', 'failLoadModule', event.config.name, error), 'error');
                    }
                }
            })();

            logger.loader(global.getText('mirai', 'finishLoadModule', global.client.commands.size, global.client.events.size));
            logger.loader('=== ' + (Date.now() - global.client.timeStart) + 'ms ===');
            writeFileSync(global.client.configPath, JSON.stringify(global.config, null, 4), 'utf8');
            unlinkSync(global.client.configPath + '.temp');

            // ── listener ───────────────────────────────────────────
            const listenerData = { api, models: botModel };
            const listener = require('./includes/listen.js')(listenerData);

            function listenerCallback(error, message) {
                if (error) {
                    // تجاهل stop_listen — listenMqtt يعيد نفسه تلقائياً
                    if (error?.type === "stop_listen") return;
                    logger(`⚠️ listenMqtt error: ${JSON.stringify(error)}`, '[ LISTEN ]');
                    return reconnect('listen error');
                }
                if (['presence', 'typ', 'read_receipt'].includes(message?.type)) return;
                if (global.config.DeveloperMode == true) console.log(message);
                return listener(message);
            }

            global.handleListen = api.listenMqtt(listenerCallback);

            // ── حفظ appState كل 15 دقيقة (كان 30) — يحافظ على الـ session طازجة ──
            _saveInterval = setInterval(() => {
                try {
                    const newState = api.getAppState();
                    writeFileSync(appStateFile, JSON.stringify(newState, null, '\x09'));
                    // تحديث appState في الذاكرة أيضاً للـ reconnect القادم
                    appState = newState;
                    loginData['appState'] = newState;
                    logger('💾 appState محفوظ ومُحدَّث ✅', '[ SESSION ]');
                    pushAppStateToGitHub(newState);
                } catch(e) {
                    logger(`⚠️ فشل حفظ appState: ${e.message}`, '[ SESSION ]');
                }
            }, 15 * 60 * 1000);

            // ── keep-alive: markAsReadAll كل 8 دقائق ──
            setInterval(() => {
                try {
                    api.markAsReadAll((err) => {
                        if (!err) logger('💓 keep-alive ✅', '[ SESSION ]');
                    });
                } catch(e) {
                    logger(`💓 keep-alive فشل: ${e.message}`, '[ SESSION ]');
                }
            }, 8 * 60 * 1000);

            // ── فحص صحة الـ session كل ساعة — إذا ماتت يعيد login فوراً ──
            setInterval(async () => {
                try {
                    await new Promise((res, rej) => {
                        api.getUserInfo(api.getCurrentUserID(), (err) => err ? rej(err) : res());
                    });
                    logger('🩺 Session سليمة ✅', '[ SESSION ]');
                } catch(e) {
                    logger(`🩺 Session ماتت: ${e.message} — إعادة login...`, '[ SESSION ]');
                    reconnect('session health check failed');
                }
            }, 60 * 60 * 1000);

            // ── تجديد fb_dtsg يتولاه @dongdev داخلياً عبر autoLogin ──

            // ── إشعار التشغيل ──────────────────────────────────────
            const momentt = require("moment-timezone").tz("Asia/Baghdad");
            const time    = momentt.format("HH:mm:ss");
            api.sendMessage(`✅ البوت شغّال — ${time}`, global.config.ADMINBOT[0]);

            // ── cron — تحديث البيو يومياً ─────────────────────────
            cron.schedule('0 0 */1 * * *', () => {
                const o = momentt.format("MM/DD/YYYY");
                api.changeBio(`Prefix: ${global.config.PREFIX}\nBot: ${global.config.BOTNAME}\nDate: ${o}`);
            }, { scheduled: true, timezone: "Asia/Baghdad" });

        }); // end login callback
    } // end tryLogin

    tryLogin();
} // end onBot

// ── Database ──────────────────────────────────────────────────────
(async () => {
    try {
        await sequelize.authenticate();
        const models = require('./includes/database/model.js')({ Sequelize, sequelize });
        logger(global.getText('mirai', 'successConnectDatabase'), '[ DATABASE ]');
        onBot({ models });
    } catch (error) {
        logger(`فشل الاتصال بقاعدة البيانات: ${error.message}`, '[ DATABASE ]');
    }
    console.log(chalk.bold.hex("#eff1f0").bold("════════════════ KIRA ONLINE ═════════════════"));
})();

// ── معالجة الأخطاء الغير متوقعة ──────────────────────────────────
process.on('unhandledRejection', (err) => {
    logger(`⚠️ unhandledRejection: ${err?.message || err}`, '[ ERROR ]');
});

process.on('uncaughtException', (err) => {
    logger(`💥 uncaughtException: ${err?.message || err}`, '[ ERROR ]');
    // لا نوقف البوت — index.js سيعيد تشغيله لو احتاج
});
