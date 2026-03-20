const fs   = require('fs-extra');
const path = require('path');
const http = require('https');

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}
const CFG       = loadConfig();
const ADMIN_IDS = (CFG.ADMINBOT || ['61580139921634']).map(String);
const GH_TOKEN  = CFG.GITHUB_TOKEN;
const GH_REPO   = CFG.GITHUB_REPO || 'aymkira/KENO';
const ROOT      = process.cwd();

// ── GitHub API ────────────────────────────────────────────────
function ghRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req  = http.request({
      hostname: 'api.github.com',
      path:     `/repos/${GH_REPO}${endpoint}`,
      method,
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'User-Agent':    'KIRA-Bot',
        'Accept':        'application/vnd.github.v3+json',
        'Content-Type':  'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch(_) { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getFileSHA(filePath) {
  try {
    const enc = filePath.split('/').map(p => encodeURIComponent(p)).join('/');
    const res = await ghRequest('GET', `/contents/${enc}`);
    if (res.status === 200 && res.data?.sha) return res.data.sha;
  } catch(_) {}
  return null;
}

async function pushToGitHub(filePath, content, message) {
  const sha  = await getFileSHA(filePath);
  const enc  = filePath.split('/').map(p => encodeURIComponent(p)).join('/');
  const body = { message, content: Buffer.from(content).toString('base64'), ...(sha ? { sha } : {}) };
  return await ghRequest('PUT', `/contents/${enc}`, body);
}

// ── تحقق من تفعيل الحماية ─────────────────────────────────────
function isGuardEnabled(threadID) {
  // أولاً من global.config
  const guards = global.config?.guardGroups || [];
  return guards.includes(String(threadID));
}

// ══════════════════════════════════════════════════════════════
//  CONFIG
// ══════════════════════════════════════════════════════════════
module.exports.config = {
  name:        'حماية',
  aliases:     ['guard'],
  eventType:   ['log:thread-admins', 'log:unsubscribe'],
  version:     '1.0.0',
  hasPermssion: 2,
  credits:     'ayman',
  description: 'حماية الكروب — يمنع تغيير الأدمن ويرجع المطور',
  commandCategory: 'developer',
  usages:      '.حماية اون — تفعيل\n.حماية اوف — إيقاف\n.حماية — الحالة',
  cooldowns:   3,
};

// ══════════════════════════════════════════════════════════════
//  EVENT — يشتغل دائماً حتى لو ما فيه أوامر
// ══════════════════════════════════════════════════════════════
module.exports.run = async function({ api, event, args, Threads, Users }) {
  const { threadID, messageID, senderID, logMessageType, logMessageData } = event;
  const botID = String(api.getCurrentUserID());

  // ── أمر .حماية ──────────────────────────────────────────────
  if (!logMessageType) {
    if (!ADMIN_IDS.includes(String(senderID)))
      return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

    const sub     = (args[0] || '').trim().toLowerCase();
    const current = isGuardEnabled(threadID);

    if (!sub || (sub !== 'اون' && sub !== 'اوف' && sub !== 'on' && sub !== 'off')) {
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n🛡️ حالة الحماية\n${current ? '🟢 مفعّلة' : '🔴 معطّلة'}\n\n• .حماية اون\n• .حماية اوف`,
        threadID, messageID
      );
    }

    const enable = sub === 'اون' || sub === 'on';
    if (enable && current)  return api.sendMessage('⚠️ الحماية مفعّلة أصلاً!', threadID, messageID);
    if (!enable && !current) return api.sendMessage('⚠️ الحماية معطّلة أصلاً!', threadID, messageID);

    const wait = await api.sendMessage('⏳ جاري التحديث...', threadID);

    try {
      // ① تحديث config محلياً
      const configPath = path.join(ROOT, 'config.json');
      const cfg        = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!cfg.guardGroups) cfg.guardGroups = [];

      if (enable) {
        if (!cfg.guardGroups.includes(String(threadID))) cfg.guardGroups.push(String(threadID));
      } else {
        cfg.guardGroups = cfg.guardGroups.filter(id => id !== String(threadID));
      }

      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');

      // ② رفع لـ GitHub
      let ghStatus = '⚠️ TOKEN مفقود';
      if (GH_TOKEN) {
        const res = await pushToGitHub('config.json', JSON.stringify(cfg, null, 2),
          `${enable ? '🟢 تفعيل' : '🔴 إيقاف'} حماية ${threadID} — KIRA`);
        ghStatus = (res.status === 200 || res.status === 201) ? '✅' : `❌ (${res.status})`;
      }

      // ③ تحديث الذاكرة
      global.config = cfg;

      api.unsendMessage(wait.messageID);
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n${enable
          ? '🟢 تم تفعيل الحماية!\n🛡️ لا أحد يقدر يغير الأدمن'
          : '🔴 تم إيقاف الحماية!'
        }\n🐙 GitHub: ${ghStatus}`,
        threadID, messageID
      );
    } catch(e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ══════════════════════════════════════════════════════════
  //  EVENT HANDLER
  // ══════════════════════════════════════════════════════════

  // ── تغيير الأدمن ─────────────────────────────────────────
  if (logMessageType === 'log:thread-admins') {
    if (!isGuardEnabled(threadID)) return;

    const author   = String(event.author || '');
    const targetID = String(logMessageData.TARGET_ID || '');
    const isAdd    = logMessageData.ADMIN_EVENT === 'add_admin';
    const isRemove = logMessageData.ADMIN_EVENT === 'remove_admin';

    // البوت أو المطور هو اللي غيّر — مقبول
    if (author === botID || ADMIN_IDS.includes(author)) return;

    // محاولة نزول البوت من الأدمن
    if (isRemove && targetID === botID) {
      // أرجع البوت أدمن + نزّل المحاول من الأدمن فقط
      api.changeAdminStatus(threadID, botID, true);
      api.changeAdminStatus(threadID, author, false);
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n🛡️ محاولة نزول البوت من الأدمن!\n🆔 ${author}\n⚡ تم نزوله من الأدمن`,
        threadID
      );
    }

    // محاولة نزول المطور من الأدمن
    if (isRemove && ADMIN_IDS.includes(targetID)) {
      // أرجع المطور أدمن + نزّل المحاول من الأدمن فقط
      api.changeAdminStatus(threadID, targetID, true);
      api.changeAdminStatus(threadID, author, false);
      const name = await Users.getNameUser(targetID).catch(() => targetID);
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n🛡️ محاولة نزول المطور من الأدمن!\n👑 المطور: ${name}\n🆔 المحاول: ${author}\n⚡ تم نزوله من الأدمن`,
        threadID
      );
    }

    // إضافة شخص غير مصرح كأدمن — نزّل المضاف فقط
    if (isAdd && !ADMIN_IDS.includes(targetID) && targetID !== botID) {
      api.changeAdminStatus(threadID, targetID, false);
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n🛡️ إضافة أدمن غير مصرح!\n🆔 المضاف: ${targetID}\n⚡ تم نزوله من الأدمن`,
        threadID
      );
    }
  }

  // ── طرد البوت أو المطور ──────────────────────────────────
  if (logMessageType === 'log:unsubscribe') {
    const leftID = String(logMessageData?.leftParticipantFbId || '');
    const adder  = String(logMessageData?.addedBy || event.author || '');

    // لو البوت اتطرد وفيه حماية مفعّلة على هذا الكروب
    if (leftID === botID && isGuardEnabled(threadID)) {
      // رجّع البوت للكروب
      setTimeout(() => {
        api.addUserToGroup(botID, threadID, (err) => {
          if (!err) {
            api.sendMessage(
              `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n🛡️ حاولوا يطردوني وأنا رجعت! 😏\n⚡ الحماية مفعّلة`,
              threadID
            );
          }
        });
      }, 2000);
      return;
    }

    // لو المطور اتطرد من أي كروب فيه البوت
    if (ADMIN_IDS.includes(leftID)) {
      setTimeout(() => {
        api.addUserToGroup(leftID, threadID, async (err) => {
          if (!err) {
            const name = await Users.getNameUser(leftID).catch(() => leftID);
            // ينزّل اللي طرده من الأدمن
            if (adder && adder !== botID) {
              api.changeAdminStatus(threadID, adder, false);
            }
            api.sendMessage(
              `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗚𝗨𝗔𝗥𝗗 ━━ ⌬\n\n👑 ${name} اتطرد وأنا رجّعته!\n⚡ تم نزول صلاحية الطارد`,
              threadID
            );
          }
        });
      }, 2000);
    }
  }
};
