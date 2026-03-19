// ══════════════════════════════════════════════════════════════
//   TGLOGIN — تسجيل دخول تيليجرام (يُحفظ في MongoDB للأبد)
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { TelegramClient } = require("telegram");
const { StringSession }  = require("telegram/sessions");
const { Logger }         = require("telegram/extensions");
const db = require(path.join(process.cwd(), "includes", "data.js"));
const path               = require("path");

Logger.setLevel("none");

module.exports.config = {
  name: "tglogin",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "Ayman",
  description: "تسجيل دخول تيليجرام — يُحفظ في MongoDB",
  commandCategory: "developer",
  usages: "tglogin",
  cooldowns: 5
};

// ══ ملف session في GitHub JSON ══
const TG_SESSION_FILE = "group/tg_session.json";

const TG_CONFIG = {
  apiId:   38886989,
  apiHash: "d29c090337bce1e1015c766493edab71"
};

// ── قراءة الـ session ──
async function getSession() {
  try {
    const data = await db.readCustomFile(TG_SESSION_FILE);
    return data?.session || "";
  } catch(e) { return ""; }
}

// ── حفظ الـ session ──
async function saveSession(sessionStr, phone) {
  await db.writeCustomFile(TG_SESSION_FILE, {
    session: sessionStr, phone, savedAt: new Date().toISOString()
  }, "save tg session");
}

// ── Singleton client ──
let tgClient = null;
global.getTgClient = async function() {
  if (tgClient && tgClient.connected) return tgClient;
  const sessionStr = await getSession();
  if (!sessionStr) throw new Error("SESSION_REQUIRED");
  const session = new StringSession(sessionStr);
  tgClient = new TelegramClient(session, TG_CONFIG.apiId, TG_CONFIG.apiHash, {
    connectionRetries: 5
  });
  await tgClient.start({
    phoneNumber: async () => { throw new Error("SESSION_REQUIRED"); },
    phoneCode:   async () => { throw new Error("SESSION_REQUIRED"); },
    password:    async () => { throw new Error("SESSION_REQUIRED"); },
    onError:     () => {}
  });
  return tgClient;
};

global.tgLoginState = global.tgLoginState || {};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!global.config?.ADMINBOT?.includes(senderID))
    return api.sendMessage("⛔ للأدمن فقط", threadID, messageID);

  const input = args.join(" ").trim();

  // بدون input — عرض الحالة
  if (!input) {
    const doc = await db.readCustomFile(TG_SESSION_FILE).catch(() => null);
    if (doc?.session) {
      return api.sendMessage(
        "✅ تيليجرام مسجل ومحفوظ في MongoDB!\n\n" +
        "📱 الحساب: " + (doc.phone || "غير معروف") + "\n" +
        "📅 تاريخ التسجيل: " + (doc.savedAt || "غير معروف") + "\n\n" +
        "• tglogin test — اختبار الاتصال\n" +
        "• tglogin reset — إعادة التسجيل",
        threadID, messageID
      );
    }
    return api.sendMessage(
      "📱 تسجيل دخول تيليجرام:\n\n" +
      "tglogin +964XXXXXXXXXX\n\n" +
      "⚠️ استخدم الحساب الثاني المخصص للبوت",
      threadID, messageID
    );
  }

  // reset
  if (input === "reset") {
    await db.writeCustomFile(TG_SESSION_FILE, {}, "reset tg session");
    tgClient = null;
    global.tgLoginState[senderID] = null;
    return api.sendMessage("🔄 تم مسح الـ session\nأعد التسجيل: tglogin +964XXXXXXXXXX", threadID, messageID);
  }

  // test
  if (input === "test") {
    try {
      const client = await global.getTgClient();
      const me = await client.getMe();
      return api.sendMessage(
        "✅ الاتصال يعمل!\n\n" +
        "👤 " + (me.firstName || "") + " " + (me.lastName || "") + "\n" +
        "📱 " + (me.phone || "مخفي"),
        threadID, messageID
      );
    } catch(e) {
      return api.sendMessage("❌ فشل الاتصال: " + e.message, threadID, messageID);
    }
  }

  // إدخال كود التحقق
  if (global.tgLoginState[senderID]?.waitingCode) {
    const code  = input.replace(/\s/g, "");
    const state = global.tgLoginState[senderID];
    try {
      await state.client.start({
        phoneNumber: async () => state.phone,
        phoneCode:   async () => code,
        password:    async () => {
          api.sendMessage("🔐 أرسل كلمة المرور الثنائية:", threadID, messageID);
          return new Promise(r => { global.tgLoginState[senderID].resolvePwd = r; });
        },
        onError: (e) => { throw e; }
      });
      const sessionStr = state.client.session.save();
      await saveSession(sessionStr, state.phone);
      tgClient = state.client;
      global.tgLoginState[senderID] = null;
      return api.sendMessage(
        "✅ تم التسجيل وحُفظ في MongoDB!\n\nلن تحتاج تسجيل الدخول مرة أخرى أبداً 🔥",
        threadID, messageID
      );
    } catch(e) {
      global.tgLoginState[senderID] = null;
      return api.sendMessage("❌ كود خاطئ: " + e.message, threadID, messageID);
    }
  }

  // كلمة مرور ثنائية
  if (global.tgLoginState[senderID]?.resolvePwd) {
    global.tgLoginState[senderID].resolvePwd(input);
    global.tgLoginState[senderID].resolvePwd = null;
    return;
  }

  // رقم الهاتف
  if (input.startsWith("+") || /^\d{10,15}$/.test(input)) {
    const phone   = input.startsWith("+") ? input : "+" + input;
    const session = new StringSession("");
    const client  = new TelegramClient(session, TG_CONFIG.apiId, TG_CONFIG.apiHash, {
      connectionRetries: 3
    });
    try {
      await client.connect();
      await client.sendCode({ apiId: TG_CONFIG.apiId, apiHash: TG_CONFIG.apiHash }, phone);
      global.tgLoginState[senderID] = { client, phone, waitingCode: true };
      return api.sendMessage(
        "📲 تم إرسال الكود إلى " + phone + "\n\n" +
        "أرسله هنا: tglogin 12345\n\n" +
        "⚠️ صالح لدقيقتين فقط",
        threadID, messageID
      );
    } catch(e) {
      return api.sendMessage("❌ فشل إرسال الكود: " + e.message, threadID, messageID);
    }
  }

  api.sendMessage(
    "❓ استخدام غير صحيح\n\n" +
    "• tglogin +964XXXXXXXXXX\n" +
    "• tglogin [الكود]\n" +
    "• tglogin test\n" +
    "• tglogin reset",
    threadID, messageID
  );
};
