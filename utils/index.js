'use strict';

const crypto = require('crypto');
const os     = require('os');
const path   = require('path');
const fs     = require('fs');

// ── getDB helper (shared) ─────────────────────────────────────────
let _db = null;
function getDB() {
    if (!_db) _db = require(path.join(process.cwd(), 'includes', 'data.js'));
    return _db;
}

// ── throwError ───────────────────────────────────────────────────
module.exports.throwError = function (command, threadID, messageID) {
    const threadSetting = global.data.threadData.get(String(threadID)) || {};
    const prefix = threadSetting.PREFIX || global.config.PREFIX || '.';
    const msg = global.getText?.('utils', 'throwError', prefix, command)
        || `❌ خطأ في الأمر "${command}". استخدم ${prefix}مساعدة للمزيد`;
    return global.client.api?.sendMessage(msg, threadID, messageID);
};

// ── cleanAnilistHTML ─────────────────────────────────────────────
module.exports.cleanAnilistHTML = function (text) {
    return text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?(i|em)>/gi, '*')
        .replace(/<\/?b>/gi, '**')
        .replace(/~!|!~/g, '||')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
};

// ── downloadFile ─────────────────────────────────────────────────
module.exports.downloadFile = async function (url, filePath) {
    const { createWriteStream } = require('fs');
    const axios = require('axios');
    const response = await axios({ method: 'GET', responseType: 'stream', url });
    const writer = createWriteStream(filePath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

// ── getContent ───────────────────────────────────────────────────
module.exports.getContent = async function (url) {
    try {
        const axios = require('axios');
        return await axios({ method: 'GET', url });
    } catch (e) { console.error('[utils.getContent]', e.message); return null; }
};

// ── randomString ─────────────────────────────────────────────────
module.exports.randomString = function (length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++)
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
};

// ── AES encryption ───────────────────────────────────────────────
module.exports.AES = {
    encrypt(cryptKey, cryptIv, plainData) {
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(cryptKey), Buffer.from(cryptIv));
        let enc = cipher.update(plainData);
        enc = Buffer.concat([enc, cipher.final()]);
        return enc.toString('hex');
    },
    decrypt(cryptKey, cryptIv, encrypted) {
        encrypted = Buffer.from(encrypted, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(cryptKey), Buffer.from(cryptIv, 'binary'));
        let dec = decipher.update(encrypted);
        dec = Buffer.concat([dec, decipher.final()]);
        return String(dec);
    },
    makeIv() { return Buffer.from(crypto.randomBytes(16)).toString('hex').slice(0, 16); }
};

// ── homeDir ──────────────────────────────────────────────────────
module.exports.homeDir = function () {
    const home = process.env['HOME'];
    const user = process.env['LOGNAME'] || process.env['USER'] || process.env['USERNAME'];
    let returnHome, typeSystem;
    switch (process.platform) {
        case 'win32':
            returnHome = process.env.USERPROFILE || process.env.HOMEDRIVE + process.env.HOMEPATH || home || null;
            typeSystem = 'win32'; break;
        case 'darwin':
            returnHome = home || (user ? '/Users/' + user : null);
            typeSystem = 'darwin'; break;
        default:
            returnHome = home || (process.getuid?.() === 0 ? '/root' : (user ? '/home/' + user : null));
            typeSystem = 'linux'; break;
    }
    return [typeof os.homedir === 'function' ? os.homedir() : returnHome, typeSystem];
};

// ── assets (بدون @miraiproject — lazy load) ──────────────────────
module.exports.assets = {
    async font(name) {
        try {
            const a = require('@miraipr0ject/assets');
            if (!a.font.loaded) await a.font.load();
            return a.font.get(name);
        } catch { return null; }
    },
    async image(name) {
        try {
            const a = require('@miraipr0ject/assets');
            if (!a.image.loaded) await a.image.load();
            return a.image.get(name);
        } catch { return null; }
    },
    async data(name) {
        try {
            const a = require('@miraipr0ject/assets');
            if (!a.data.loaded) await a.data.load();
            return a.data.get(name);
        } catch { return null; }
    }
};

// ── formatMoney ──────────────────────────────────────────────────
module.exports.formatMoney = function (n) {
    n = Math.floor(Number(n) || 0);
    if (n >= 1e15) return (n / 1e15).toFixed(1) + 'Q';
    if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
    if (n >= 1e9)  return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6)  return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
};

// ── sleep ────────────────────────────────────────────────────────
module.exports.sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── isAdmin ──────────────────────────────────────────────────────
module.exports.isAdmin = function (userID) {
    return (global.config?.ADMINBOT || []).includes(String(userID));
};

// ── getCacheDir ──────────────────────────────────────────────────
module.exports.getCacheDir = function () {
    const dir = path.join(process.cwd(), 'script', 'commands', 'cache');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
};

// ── getDB (مشاركة نفس instance) ─────────────────────────────────
module.exports.getDB = getDB;
