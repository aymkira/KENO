const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "تخيل",
    version: "3.0",
    hasPermssion: 0,
    credits: "AYOUB",
    description: "إنشاء 4 صور عالية الجودة من نص باستخدام Flux Pro API",
    commandCategory: "صور",
    usages: "[وصف الصورة]",
    cooldowns: 15,
    dependencies: {
        "axios": "",
        "fs-extra": ""
    }
};

// نصوص ثابتة بدلاً من نظام الترجمة
const messages = {
    missingInput: "❌ الرجاء كتابة وصف للصورة\n💡 مثال: لوكس قطة جميلة تلعب في الحديقة",
    generating: "🎨 جاري إنشاء الصور باستخدام Flux Pro (1024x1024)...\n⏳ قد يستغرق الأمر دقيقتين، يرجى الانتظار...",
    noImages: "❌ لم يتم إنشاء أي صورة من الخادم",
    processingError: "❌ فشل في معالجة الصور المستلمة",
    success: (count, desc) => `✅ تم إنشاء ${count} صورة بنجاح باستخدام Flux Pro!\n📝 الوصف: ${desc}\n📐 الدقة: 1024x1024\n⚡ المحرك: Flux Pro`,
    partialSuccess: (success, total, desc) => `⚠️ تم إنشاء ${success} من ${total} صور بنجاح\n📝 الوصف: ${desc}`,
    error: (err) => `❌ حدث خطأ أثناء إنشاء الصور: ${err}\n💡 جرب مرة أخرى أو استخدم وصف مختلف`,
    apiError: "🚫 خطأ في الاتصال بـ API\n🔄 يرجى المحاولة لاحقاً",
    timeout: "⏰ انتهت مهلة الانتظار\n🔄 جرب مرة أخرى مع وصف أبسط",
    rateLimitError: "❌ تم تجاوز الحد المسموح، جرب لاحقاً",
    invalidPromptError: "❌ وصف غير صالح، جرب وصفاً مختلفاً"
};

module.exports.run = async function({ api, event, args }) {
    const text = args.join(" ").trim();
    if (!text) {
        return api.sendMessage(messages.missingInput, event.threadID, event.messageID);
    }

    const loadingMsg = await api.sendMessage(messages.generating, event.threadID);

    try {
        console.log(`🎨 [Flux Pro Bot] Starting generation for: "${text}"`);
        
        // استدعاء API الجديد مع Flux Pro
        const response = await axios.post('https://flux-nobro9735-9yayti5m.leapcell.dev/api/fluxpro/generate', {
            prompt: text,
            count: 4 // طلب 4 صور
        }, {
            timeout: 180000, // 3 دقائق timeout
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FluxBot/3.0'
            }
        });

        console.log(`📡 [Flux Pro Bot] API Response:`, {
            success: response.data.success,
            imageCount: response.data.data?.count || 0,
            model: response.data.model
        });

        if (!response.data.success) {
            throw new Error(response.data.error || messages.noImages);
        }

        const responseData = response.data.data;
        if (!responseData || !responseData.images || !Array.isArray(responseData.images)) {
            throw new Error(messages.noImages);
        }

        const imageBase64s = responseData.images;
        const imageUrls = responseData.imageUrls || [];
        const successCount = responseData.count || imageBase64s.length;
        const requestedCount = responseData.requestedCount || 4;

        if (imageBase64s.length === 0) {
            throw new Error(messages.noImages);
        }
        
        console.log(`📸 [Flux Pro Bot] Processing ${imageBase64s.length} images...`);
        
        const attachments = [];
        const tempFiles = [];
        let processedCount = 0;
        
        // معالجة كل صورة
        for (let i = 0; i < imageBase64s.length; i++) {
            try {
                const base64Image = imageBase64s[i];
                
                if (!base64Image || typeof base64Image !== 'string' || base64Image.length < 100) {
                    console.error(`❌ [Flux Pro Bot] Image ${i + 1} is invalid or empty`);
                    continue;
                }
                
                // تنظيف base64 (إزالة البادئة إذا وجدت)
                const base64Data = base64Image.includes(',') 
                    ? base64Image.split(',')[1] 
                    : base64Image;
                
                // التحقق من صحة base64
                if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
                    console.error(`❌ [Flux Pro Bot] Image ${i + 1} has invalid base64 format`);
                    continue;
                }
                
                // تحويل إلى buffer
                const buffer = Buffer.from(base64Data, 'base64');
                
                // التحقق من حجم البيانات
                if (buffer.length < 1000) { // أقل من 1KB مشكوك فيه
                    console.error(`❌ [Flux Pro Bot] Image ${i + 1} is too small: ${buffer.length} bytes`);
                    continue;
                }
                
                // إنشاء ملف مؤقت
                const tempFileName = `fluxpro_${Date.now()}_${i + 1}_${Math.random().toString(36).substr(2, 5)}.png`;
                const tempFilePath = path.join(__dirname, 'temp', tempFileName);
                
                // التأكد من وجود مجلد temp
                const tempDir = path.dirname(tempFilePath);
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                // حفظ الصورة
                fs.writeFileSync(tempFilePath, buffer);
                
                // التحقق من نجاح الحفظ
                if (fs.existsSync(tempFilePath) && fs.statSync(tempFilePath).size > 0) {
                    attachments.push(fs.createReadStream(tempFilePath));
                    tempFiles.push(tempFilePath);
                    processedCount++;
                    console.log(`✅ [Flux Pro Bot] Processed image ${i + 1}: ${(buffer.length / 1024).toFixed(1)}KB`);
                } else {
                    console.error(`❌ [Flux Pro Bot] Failed to save image ${i + 1}`);
                }
                
            } catch (imageError) {
                console.error(`❌ [Flux Pro Bot] Error processing image ${i + 1}:`, imageError.message);
                continue;
            }
        }

        // التحقق من وجود صور صالحة
        if (attachments.length === 0) {
            throw new Error(messages.processingError);
        }
        
        console.log(`✅ [Flux Pro Bot] Successfully processed ${processedCount}/${imageBase64s.length} images`);
        
        // حذف رسالة التحميل
        try {
            await api.unsendMessage(loadingMsg.messageID);
        } catch (unsendError) {
            console.error('❌ Error unsending loading message:', unsendError.message);
        }
        
        // تحديد نوع الرسالة حسب النجاح
        let messageBody;
        if (processedCount === requestedCount) {
            // نجح في إنشاء جميع الصور المطلوبة
            messageBody = messages.success(processedCount, text);
        } else {
            // نجح في إنشاء بعض الصور فقط
            messageBody = messages.partialSuccess(processedCount, requestedCount, text);
        }
        
        // إضافة معلومات إضافية إذا توفرت
        if (responseData.memoryStorage) {
            messageBody += `\n💾 محفوظة في الذاكرة لمدة ${responseData.memoryStorage.autoCleanup}`;
        }
        
        if (imageUrls.length > 0) {
            messageBody += `\n🌐 روابط مباشرة متوفرة`;
        }
        
        // إرسال الصور
        return api.sendMessage(
            {
                body: messageBody,
                attachment: attachments
            },
            event.threadID,
            (sendError, info) => {
                // تنظيف الملفات المؤقتة
                tempFiles.forEach(file => {
                    try {
                        if (fs.existsSync(file)) {
                            fs.unlinkSync(file);
                            console.log(`🗑️ [Flux Pro Bot] Cleaned temp file: ${path.basename(file)}`);
                        }
                    } catch (cleanError) {
                        console.error(`❌ Error cleaning temp file ${file}:`, cleanError.message);
                    }
                });
                
                if (sendError) {
                    console.error('❌ Error sending images:', sendError);
                    api.sendMessage(messages.error(sendError.message), event.threadID, event.messageID);
                } else {
                    console.log(`✅ [Flux Pro Bot] Successfully sent ${attachments.length} images`);
                }
            },
            event.messageID
        );

    } catch (error) {
        console.error('❌ [Flux Pro Bot] Command error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        
        // حذف رسالة التحميل
        try {
            await api.unsendMessage(loadingMsg.messageID);
        } catch (unsendError) {
            console.error('❌ Error unsending loading message:', unsendError.message);
        }
        
        // تحديد نوع الخطأ
        let errorMessage = messages.error(error.message);
        
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            errorMessage = messages.timeout;
        } else if (error.response) {
            switch (error.response.status) {
                case 429:
                    errorMessage = messages.rateLimitError;
                    break;
                case 500:
                    errorMessage = messages.apiError;
                    break;
                case 400:
                    errorMessage = messages.invalidPromptError;
                    break;
                default:
                    errorMessage = messages.apiError;
            }
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            errorMessage = messages.apiError;
        }
        
        return api.sendMessage(errorMessage, event.threadID, event.messageID);
    }
};

// إضافة وظيفة مساعدة للتفاعل مع الرسائل
module.exports.handleReaction = async function({ api, event, Reaction }) {
    // يمكن إضافة ميزات إضافية هنا مثل إعادة توليد الصور
    if (event.reaction === "🔄" && event.userID === event.senderID) {
        // إعادة تشغيل الأمر - يمكن تطويرها لاحقاً
        console.log("User requested regeneration");
    }
};

// دالة تنظيف الملفات المؤقتة القديمة (تشغل كل ساعة)
setInterval(() => {
    try {
        const tempDir = path.join(__dirname, 'temp');
        if (fs.existsSync(tempDir)) {
            const files = fs.readdirSync(tempDir);
            const now = Date.now();
            let cleanedCount = 0;
            
            files.forEach(file => {
                const filePath = path.join(tempDir, file);
                const stats = fs.statSync(filePath);
                const fileAge = now - stats.mtime.getTime();
                
                // حذف الملفات الأقدم من ساعة
                if (fileAge > 60 * 60 * 1000) {
                    fs.unlinkSync(filePath);
                    cleanedCount++;
                }
            });
            
            if (cleanedCount > 0) {
                console.log(`🧹 [Flux Pro Bot] Cleaned ${cleanedCount} old temp files`);
            }
        }
    } catch (error) {
        console.error('❌ Error in temp cleanup:', error.message);
    }
}, 60 * 60 * 1000); // كل ساعة
