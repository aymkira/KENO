// ══════════════════════════════════════════════════════════════
//   TGLOGIN — تسجيل دخول حساب تيليجرام الوسيط
//   يُشغَّل مرة واحدة فقط
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { TelegramClient } = require("telegram");
const { StringSession }  = require("telegram/sessions");
const { Logger }         = require("telegram/extensions");
const fs                 = require("fs-extra");
const path               = require("path");

// إخفاء logs تيليجرام
Logger.setLevel("none");

module.exports.config = {
  name: "tglogin",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "Ayman",
  description: "تسجيل دخول حساب تيليجرام الوسيط — مرة واحدة فقط",
  commandCategory: "developer",
  usages: "tglogin",
  cooldowns: 5
};

const TG_CONFIG = {
  apiId:       38886989,
  apiHash:     "d29c090337bce1e1015c766493edab71",
  sessionPath: path.join(process.cwd(), "includes", "tg_session.txt")
};

// حالة انتظار الكود
global.tgLoginState = global.tgLoginState || {};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // تحقق أدمن فقط
  if (!global.config?.ADMINBOT?.includes(senderID))
    return api.sendMessage("⛔ هذا الأمر للأدمن فقط", threadID, messageID);

  const input = args.join(" ").trim();

  // ── إذا في session محفوظة ──
  if (!input) {
    const exists = await fs.pathExists(TG_CONFIG.sessionPath);
    if (exists) {
      return api.sendMessage(
        "✅ تيليجرام مسجل مسبقاً!\n\n" +
        "لإعادة التسجيل: tglogin reset\n" +
        "لاختبار الاتصال: tglogin test",
        threadID, messageID
      );
    }

    return api.sendMessage(
      "📱 لتسجيل حساب تيليجرام:\n\n" +
      "اكتب: tglogin [رقم هاتفك]\n\n" +
      "مثال:\n" +
      "tglogin +9647XXXXXXXXX\n\n" +
      "⚠️ استخدم الحساب الثاني المخصص للبوت",
      threadID, messageID
    );
  }

  // ── reset ──
  if (input === "reset") {
    await fs.remove(TG_CONFIG.sessionPath).catch(() => {});
    global.tgLoginState[senderID] = null;
    return api.sendMessage("🔄 تم مسح الـ session\nاكتب: tglogin [رقم هاتفك]", threadID, messageID);
  }

  // ── test ──
  if (input === "test") {
    try {
      const saved   = await fs.readFile(TG_CONFIG.sessionPath, "utf8");
      const session = new StringSession(saved.trim());
      const client  = new TelegramClient(session, TG_CONFIG.apiId, TG_CONFIG.apiHash, {
        connectionRetries: 2,
        
      });
      await client.connect();
      const me = await client.getMe();
      await client.disconnect();
      return api.sendMessage(
        `✅ الاتصال يعمل!\n\n👤 الحساب: ${me.firstName} ${me.lastName || ""}\n📱 الرقم: ${me.phone || "مخفي"}`,
        threadID, messageID
      );
    } catch(e) {
      return api.sendMessage(`❌ فشل الاتصال: ${e.message}`, threadID, messageID);
    }
  }

  // ── إدخال كود التحقق ──
  if (global.tgLoginState[senderID]?.waitingCode) {
    const code   = input.replace(/\s/g, "");
    const state  = global.tgLoginState[senderID];

    try {
      await state.client.start({
        phoneNumber: async () => state.phone,
        phoneCode:   async () => code,
        password:    async () => {
          api.sendMessage("🔐 الحساب يحتاج كلمة مرور ثنائية\nأرسلها الآن:", threadID, messageID);
          return new Promise(resolve => {
            global.tgLoginState[senderID].resolvePassword = resolve;
          });
        },
        onError: (err) => { throw err; }
      });

      // حفظ الـ session
      const sessionStr = state.client.session.save();
      await fs.ensureDir(path.dirname(TG_CONFIG.sessionPath));
      await fs.writeFile(TG_CONFIG.sessionPath, sessionStr, "utf8");

      global.tgLoginState[senderID] = null;

      api.sendMessage(
        "✅ تم تسجيل الدخول بنجاح!\n\n" +
        "الآن تقدر تستخدم:\n" +
        "• mp3 [رابط] — تحويل لصوت\n\n" +
        "لاختبار الاتصال: tglogin test",
        threadID, messageID
      );

    } catch(e) {
      global.tgLoginState[senderID] = null;
      api.sendMessage(`❌ كود خاطئ أو منتهي\n${e.message}\n\nحاول من جديد: tglogin [رقم هاتفك]`, threadID, messageID);
    }
    return;
  }

  // ── إدخال رقم الهاتف ──
  if (input.startsWith("+") || /^\d{10,15}$/.test(input)) {
    const phone  = input.startsWith("+") ? input : "+" + input;
    const session = new StringSession("");
    const client  = new TelegramClient(session, TG_CONFIG.apiId, TG_CONFIG.apiHash, {
      connectionRetries: 3,
      
    });

    try {
      await client.connect();
      await client.sendCode({ apiId: TG_CONFIG.apiId, apiHash: TG_CONFIG.apiHash }, phone);

      global.tgLoginState[senderID] = { client, phone, waitingCode: true };

      api.sendMessage(
        `📲 تم إرسال كود التحقق إلى ${phone}\n\n` +
        "أرسل الكود هنا:\n" +
        "tglogin 12345\n\n" +
        "⚠️ الكود صالح لدقيقتين فقط",
        threadID, messageID
      );

    } catch(e) {
      api.sendMessage(`❌ فشل إرسال الكود\n${e.message}`, threadID, messageID);
    }
    return;
  }

  api.sendMessage(
    "❓ استخدام غير صحيح\n\n" +
    "• tglogin +964XXXXXXXXXX — تسجيل دخول\n" +
    "• tglogin [الكود] — بعد استلام الكود\n" +
    "• tglogin test — اختبار الاتصال\n" +
    "• tglogin reset — إعادة التسجيل",
    threadID, messageID
  );
};
