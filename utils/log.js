'use strict';

const chalk    = require('chalk');
const gradient = require('gradient-string');

// ── ألوان ─────────────────────────────────────────────────────────
const COLORS = {
    red:     '#ff0000',
    green:   '#00ff00',
    yellow:  '#ffff00',
    blue:    '#0000ff',
    magenta: '#ff00ff',
    cyan:    '#00ffff',
    white:   '#ffffff',
    gray:    '#808080',
    ocean:   '#00bfff',
};

// ── logger رئيسي ──────────────────────────────────────────────────
// الاستخدام: logger('رسالة', '[ TAG ]')
// logger('رسالة', 'error')  ← أحمر
// logger('رسالة', 'warn')   ← بنفسجي
const logger = function (data, option) {
    switch (option) {
        case 'error':
        case 'warn':
            console.log(chalk.bold.hex('#FF00FF')('[ Error ] » ') + data);
            break;
        default:
            console.log(chalk.bold.hex('#00BFFF').bold(`${option || '[ LOG ]'} » `) + data);
            break;
    }
};

// ── loader (للـ startup messages) ────────────────────────────────
// logger.loader('رسالة')        ← cyan
// logger.loader('رسالة','error')← أحمر (Can't install...)
// logger.loader('رسالة','warn') ← cyan مختلف
logger.loader = function (data, option) {
    switch (option) {
        case 'error':
            console.log(chalk.bold.hex('#00FFFF').bold('╰SOMI╯ ╰BOT╯»') + data);
            break;
        case 'warn':
            console.log(chalk.bold.hex('#00FFFF').bold(' ╭SOMI╮ ╭BOT-𝟒╮»') + data);
            break;
        default:
            console.log(chalk.bold.hex('#00FFFF').bold('╭SOMI╮ ╭BOT-𝟒╮»') + data);
            break;
    }
};

// ── log متعدد الألوان (gradient) ─────────────────────────────────
logger.log = function (messages) {
    const logMessage = messages
        .map(({ message, color }) => {
            if (Array.isArray(color)) {
                return gradient(...color)(message);
            }
            return chalk.hex(COLORS[color] || color || '#ffffff')(message);
        })
        .join('');
    console.log(logMessage, '');
};

// ── log ملوّن بسيط ────────────────────────────────────────────────
logger.color = function (text, hex = '#00BFFF') {
    console.log(chalk.hex(hex)(text));
};

// ── تصدير ────────────────────────────────────────────────────────
module.exports = logger;
