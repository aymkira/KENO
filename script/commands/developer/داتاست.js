const fs   = require('fs');
const path = require('path');

function loadConfig() {
  for (const p of [
    path.join(__dirname, '../../..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_){} }
  return {};
}
const ADMIN_IDS = (loadConfig().ADMINBOT || []).map(String);

function getDB() {
  try { return require(path.join(process.cwd(), 'includes', 'data.js')); }
  catch { return null; }
}

// بيانات عشوائية
const FAKE_NAMES = ['أحمد','محمد','سارة','نور','ليلى','علي','عمر','هند','مريم','يوسف'];
const FAKE_REASONS = ['اختبار','تجربة النظام','بيانات وهمية','test data'];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const fakeID = () => String(randNum(1000000000, 9999999999));

module.exports.config = {
  name: 'داتاست',
  version: '1.0.0',
  hasPermssion: 2,
  credits: 'ayman',
  description: 'اختبار نظام البيانات — بيانات وهمية',
  commandCategory: 'developer',
  usages: `.داتاست        ← كتابة بيانات وهمية
.داتاست حذف   ← حذف كل البيانات الوهمية`,
  cooldowns: 5,
};

// نحفظ الـ IDs الوهمية عشان نقدر نحذفها
const TEST_IDS_FILE = 'user/test_ids.json';

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!ADMIN_IDS.includes(String(senderID)))
    return api.sendMessage('🚫 للمطور فقط.', threadID, messageID);

  const db  = getDB();
  if (!db) return api.sendMessage('❌ includes/data.js مو موجود!', threadID, messageID);

  const sub = args[0]?.toLowerCase();

  // ══════════════════════════════════════════════
  //  .داتاست حذف — حذف كل البيانات الوهمية
  // ══════════════════════════════════════════════
  if (sub === 'حذف' || sub === 'clear') {
    const wait = await api.sendMessage('🗑️ جاري الحذف...', threadID);
    try {
      const testData = await db.loadFile(TEST_IDS_FILE);
      const ids      = testData.ids || [];

      if (!ids.length) {
        api.unsendMessage(wait.messageID);
        return api.sendMessage('⚠️ ما في بيانات وهمية للحذف', threadID, messageID);
      }

      let deleted = 0;
      for (const id of ids) {
        const ok = await db.deleteUser(id, false); // بدون حفظ فوري
        if (ok) deleted++;
      }

      // حذف ملف الـ IDs وحفظ
      await db.writeCustomFile(TEST_IDS_FILE, { ids: [], clearedAt: new Date().toISOString() });
      await db.flushAll();

      api.unsendMessage(wait.messageID);
      return api.sendMessage(
        `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n🗑️ تم الحذف!\n✅ حُذف ${deleted} مستخدم وهمي\n🐙 GitHub: ✅`,
        threadID, messageID
      );
    } catch(e) {
      api.unsendMessage(wait.messageID);
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }

  // ══════════════════════════════════════════════
  //  .داتاست — كتابة بيانات وهمية
  // ══════════════════════════════════════════════
  const count = Math.min(parseInt(args[0]) || 5, 20);
  const wait  = await api.sendMessage(`⏳ جاري كتابة ${count} مستخدم وهمي...`, threadID);

  try {
    const newIDs = [];
    const results = [];

    for (let i = 0; i < count; i++) {
      const id     = fakeID();
      const name   = `${rand(FAKE_NAMES)}_test_${i+1}`;
      const money  = randNum(100, 50000);
      const exp    = randNum(0, 5000);
      const banned = Math.random() < 0.2; // 20% محظورين

      // إنشاء المستخدم
      await db.setUser(id, { name, isTest: true }, false);

      // محفظة
      const expResult = await db.addExp(id, exp);
      const level = expResult?.level || 1;

      // حظر عشوائي
      if (banned) await db.banUser(id, rand(FAKE_REASONS), 'TEST_SYSTEM', 0);

      newIDs.push(id);
      results.push({ id, name, money, level, banned });
    }

    // حفظ الـ IDs
    const existing = await db.loadFile(TEST_IDS_FILE).catch(() => ({ ids: [] }));
    await db.writeCustomFile(TEST_IDS_FILE, {
      ids: [...(existing.ids || []), ...newIDs],
      lastTest: new Date().toISOString(),
    });

    // رفع كل شيء
    await db.flushAll();

    api.unsendMessage(wait.messageID);

    const lines = results.map((r, i) =>
      `${i+1}. 👤 ${r.name}\n   🆔 ${r.id}\n   📊 Lv${r.level} ${r.banned ? '🚫' : '✅'}`
    );

    return api.sendMessage(
      `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n✅ تم كتابة ${count} مستخدم وهمي!\n🐙 GitHub: user/users.json\n━━━━━━━━━━━━\n${lines.join('\n')}\n━━━━━━━━━━━━\n💡 .داتاست حذف لحذفهم`,
      threadID, messageID
    );
  } catch(e) {
    api.unsendMessage(wait.messageID);
    return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
  }
};
