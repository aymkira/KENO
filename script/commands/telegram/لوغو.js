// ══════════════════════════════════════════════════════════════
//   LOGO — تصميم لوغو عبر @X2Z2BOT
//   by Ayman
// ══════════════════════════════════════════════════════════════

const { NewMessage }  = require("telegram/events");
const { Button }      = require("telegram/tl/types");
const fs              = require("fs-extra");
const path            = require("path");

module.exports.config = {
  name: "logo",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ayman",
  description: "تصميم لوغو احترافي",
  commandCategory: "design",
  usages: "logo [اسم الشركة] | [اسم الشعار] أو logo [اسم الشركة]",
  cooldowns: 30
};

const BOT     = "X2Z2BOT";
const WAIT_MS = 60000;

// ── انتظر رسالة من البوت ──
function waitForMessage(client, botId, timeout = WAIT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("timeout"));
    }, timeout);

    const handler = async (ev) => {
      const msg = ev.message;
      if (msg.peerId?.userId?.toString() !== botId) return;
      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({}));
      resolve(msg);
    };

    client.addEventHandler(handler, new NewMessage({ fromUsers: [BOT] }));
  });
}

// ── انتظر صورة من البوت ──
function waitForPhoto(client, botId, timeout = 90000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("البوت لم يرسل الصورة"));
    }, timeout);

    const handler = async (ev) => {
      const msg = ev.message;
      if (msg.peerId?.userId?.toString() !== botId) return;
      if (!msg.photo && !msg.document?.mimeType?.includes("image")) return;
      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({}));
      resolve(msg);
    };

    client.addEventHandler(handler, new NewMessage({ fromUsers: [BOT] }));
  });
}

// ── ضغط زر في رسالة البوت ──
async function clickButton(client, msg, buttonText) {
  try {
    const buttons = msg.replyMarkup?.rows || [];
    for (const row of buttons) {
      for (const btn of (row.buttons || [])) {
        const label = btn.text || "";
        if (label.includes(buttonText) || buttonText.includes(label.substring(0, 5))) {
          await msg.click({ text: label });
          return true;
        }
      }
    }
    // إذا ما لقينا الزر المحدد، اضغط أول زر
    const firstBtn = buttons[0]?.buttons?.[0];
    if (firstBtn) {
      await msg.click({ text: firstBtn.text });
      return true;
    }
  } catch(e) {}
  return false;
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  // استخراج الاسم والشعار من الأرقز
  // صيغة: logo [اسم الشركة] | [اسم الشعار]
  // أو:   logo [اسم الشركة]
  const fullInput = args.join(" ").trim();

  if (!fullInput) {
    return api.sendMessage(
      "🎨 تصميم لوغو احترافي\n\n" +
      "الاستخدام:\n" +
      "• logo [اسم] — لوغو بدون شعار\n" +
      "• logo [اسم] | [شعار] — لوغو مع شعار\n\n" +
      "مثال:\n" +
      "logo Kira\n" +
      "logo Kira | Ayman",
      threadID, messageID
    );
  }

  const parts      = fullInput.split("|").map(s => s.trim());
  const company    = parts[0] || fullInput;
  const slogan     = parts[1] || null;
  const withSlogan = !!slogan;

  if (typeof global.getTgClient !== "function") {
    return api.sendMessage(
      "❌ سجّل دخول تيليجرام أولاً:\n.tglogin +964XXXXXXXXXX",
      threadID, messageID
    );
  }

  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);
  api.sendMessage(
    "🎨 جاري تصميم لوغو لـ: " + company + (slogan ? "\n✏️ الشعار: " + slogan : "") + "\n⏳ انتظر...",
    threadID, messageID
  );

  let imgPath = null;

  try {
    const client = await global.getTgClient();
    const botEntity = await client.getEntity(BOT);
    const botId = botEntity.id.toString();

    // ── الخطوة 1: إرسال /start ──
    await client.sendMessage(BOT, { message: "/start" });

    // ── الخطوة 2: انتظار رسالة الاختيار (مع الأزرار) ──
    let choiceMsg;
    try { choiceMsg = await waitForMessage(client, botId, 15000); }
    catch(e) { throw new Error("البوت لم يرد على /start"); }

    // ── الخطوة 3: ضغط الزر المناسب ──
    if (choiceMsg.replyMarkup) {
      const btnText = withSlogan ? "مع الشعار" : "بدون شعار";
      await clickButton(client, choiceMsg, btnText);
      await new Promise(r => setTimeout(r, 1500));
    }

    // ── الخطوة 4: انتظار طلب اسم الشركة ──
    try { await waitForMessage(client, botId, 10000); }
    catch(e) {}

    // ── الخطوة 5: إرسال اسم الشركة ──
    await client.sendMessage(BOT, { message: company });
    await new Promise(r => setTimeout(r, 1000));

    if (withSlogan) {
      // ── الخطوة 6: انتظار طلب الشعار ──
      try { await waitForMessage(client, botId, 10000); }
      catch(e) {}

      // ── الخطوة 7: إرسال اسم الشعار ──
      await client.sendMessage(BOT, { message: slogan });
    }

    // ── الخطوة 8: انتظار الصورة ──
    const photoMsg = await waitForPhoto(client, botId, 90000);

    // ── الخطوة 9: تنزيل الصورة ──
    imgPath = path.join(process.cwd(), "tmp", "logo_" + Date.now() + ".jpg");
    await fs.ensureDir(path.dirname(imgPath));
    await client.downloadMedia(photoMsg, { outputFile: imgPath });

    // ── الخطوة 10: إرسال الصورة للمستخدم ──
    await api.sendMessage(
      {
        body: "🎨 لوغو: " + company + (slogan ? "\n✏️ " + slogan : "") + "\n\n✅ تم التصميم!",
        attachment: require("fs").createReadStream(imgPath)
      },
      threadID,
      () => { fs.remove(imgPath).catch(() => {}); },
      messageID
    );

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    if (imgPath) fs.remove(imgPath).catch(() => {});
    console.error("❌ LOGO:", e.message);
    api.sendMessage(
      "❌ فشل تصميم اللوغو\n\n" + e.message,
      threadID, messageID
    );
  }
};
