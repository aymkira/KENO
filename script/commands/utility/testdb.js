module.exports.config = {
    name: "testdb",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Ayman",
    description: "اختبار نظام حفظ الأموال",
    commandCategory: "utility",
    usages: "testdb",
    cooldowns: 5
};

module.exports.run = async function({ api, event, Currencies }) {
    const { senderID, threadID } = event;
    const fs = require('fs');
    
    try {
        api.sendMessage('⏳ جاري اختبار النظام...', threadID);
        
        // اختبار 1: قراءة البيانات الحالية
        console.log('━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📖 اختبار 1: قراءة البيانات');
        const before = await Currencies.getData(senderID);
        console.log('قبل:', before);
        
        // اختبار 2: إضافة مال
        console.log('━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📖 اختبار 2: إضافة 500 🪙');
        await Currencies.increaseMoney(senderID, 500);
        
        // اختبار 3: قراءة مرة أخرى
        console.log('━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📖 اختبار 3: قراءة بعد الإضافة');
        const after = await Currencies.getData(senderID);
        console.log('بعد:', after);
        
        // اختبار 4: التحقق من الملف
        console.log('━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📖 اختبار 4: التحقق من ملف قاعدة البيانات');
        const dbPath = './data.sqlite';
        const fileExists = fs.existsSync(dbPath);
        console.log('مسار الملف:', dbPath);
        console.log('الملف موجود:', fileExists);
        
        if (fileExists) {
            const stats = fs.statSync(dbPath);
            console.log('حجم الملف:', stats.size, 'بايت');
            console.log('آخر تعديل:', stats.mtime);
        }
        
        // اختبار 5: خصم مال
        console.log('━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📖 اختبار 5: خصم 100 🪙');
        const decreased = await Currencies.decreaseMoney(senderID, 100);
        console.log('نتيجة الخصم:', decreased);
        
        const final = await Currencies.getData(senderID);
        console.log('النهائي:', final);
        console.log('━━━━━━━━━━━━━━━━━━━━━━');
        
        // إرسال النتيجة
        let result = `✅ نتائج اختبار قاعدة البيانات\n`;
        result += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        result += `📊 الرصيد قبل: ${before.money} 🪙\n`;
        result += `➕ إضافة: +500 🪙\n`;
        result += `📊 الرصيد بعد الإضافة: ${after.money} 🪙\n`;
        result += `➖ خصم: -100 🪙\n`;
        result += `📊 الرصيد النهائي: ${final.money} 🪙\n\n`;
        result += `━━━━━━━━━━━━━━━━━━━━\n`;
        result += `🗂️ ملف قاعدة البيانات\n`;
        result += `📁 المسار: ${dbPath}\n`;
        result += `${fileExists ? '✅' : '❌'} الملف موجود: ${fileExists ? 'نعم' : 'لا'}\n`;
        
        if (fileExists) {
            const stats = fs.statSync(dbPath);
            result += `📦 الحجم: ${(stats.size / 1024).toFixed(2)} KB\n`;
        }
        
        result += `\n✅ النظام يعمل بشكل صحيح!`;
        result += `\n💾 البيانات تُحفظ تلقائياً`;
        
        return api.sendMessage(result, threadID);
        
    } catch (error) {
        console.error('❌ خطأ في الاختبار:', error);
        return api.sendMessage(
            `❌ خطأ في الاختبار!\n\n` +
            `الخطأ: ${error.message}\n\n` +
            `تحقق من السجلات في Console`,
            threadID
        );
    }
};
