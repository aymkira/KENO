// ==========================================
// ملف إدارة قاعدة بيانات MongoDB - بوت Kira المطور v2.6
// ==========================================
const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://kkayman200_db_user:ukhzlLzjRxQgSnTl@cluster0.7nsuoil.mongodb.net/KiraDB?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ [MONGODB] Connected successfully to KiraDB"))
.catch(err => console.error("❌ [MONGODB] Connection error:", err));

const { Schema } = mongoose;

// نظام المجموعات (Threads) المفقود
const threadSchema = new Schema({
    threadID: { type: String, required: true, unique: true },
    threadName: { type: String, default: "" },
    settings: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now }
});

const userSchema = new Schema({
    userID: { type: String, required: true, unique: true },
    name: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});

const currencySchema = new Schema({
    userID: { type: String, required: true, unique: true },
    money: { type: Number, default: 0, min: 0 },
    exp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    messageCount: { type: Number, default: 0, min: 0 },
    lastMessage: { type: Date, default: null },
    streak: { type: Number, default: 0 },
    lastDaily: { type: Date, default: null },
    rank: { type: String, default: "مبتدئ" },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Currency = mongoose.model("Currency", currencySchema);
const Thread = mongoose.model("Thread", threadSchema);

// ==============================
// 🛠️ الدوال المساعدة المطورة
// ==============================

const RANKS = [
    { level: 1, name: "مبتدئ", emoji: "🔰", minExp: 0 },
    { level: 5, name: "محارب", emoji: "⚔️", minExp: 100 },
    { level: 10, name: "فارس", emoji: "🛡️", minExp: 400 },
    { level: 15, name: "نخبة", emoji: "💎", minExp: 900 },
    { level: 20, name: "بطل", emoji: "👑", minExp: 1600 },
    { level: 30, name: "أسطورة", emoji: "⚡", minExp: 3600 },
    { level: 40, name: "ملك", emoji: "🔱", minExp: 6400 },
    { level: 50, name: "إمبراطور", emoji: "🌟", minExp: 10000 },
    { level: 75, name: "إله", emoji: "🔥", minExp: 22500 },
    { level: 100, name: "خالد", emoji: "😈", minExp: 40000 }
];

const calculateLevel = (exp) => Math.floor(Math.pow(exp / 40, 0.55)) + 1;
const calculateRank = (level) => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (level >= RANKS[i].level) return RANKS[i];
    }
    return RANKS[0];
};

const getExpForNextLevel = (level) => Math.floor(Math.pow(level * 40, 1 / 0.55));
const getProgress = (exp, level) => {
    const currentLevelExp = Math.floor(Math.pow((level - 1) * 40, 1 / 0.55));
    const nextLevelExp = getExpForNextLevel(level);
    return Math.min(Math.max(((exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100, 0), 100);
};

// ➕ دالة تحديث بيانات المستخدم العامة (الحل لمشكلة الخطأ السابق)
async function updateUserData(userID, data) {
    try {
        await ensureUser(userID);
        return await Currency.findOneAndUpdate({ userID }, { $set: data }, { new: true });
    } catch (e) { console.error(e); return null; }
}

async function ensureUser(userID) {
    try {
        await User.findOneAndUpdate({ userID }, { $setOnInsert: { userID } }, { upsert: true });
        return await Currency.findOneAndUpdate({ userID }, { $setOnInsert: { userID, money: 0, exp: 0, rank: "مبتدئ" } }, { upsert: true, new: true });
    } catch (e) { return null; }
}

async function addMoney(userID, amount) {
    try {
        const currency = await Currency.findOneAndUpdate({ userID }, { $inc: { money: Number(amount) }, $set: { updatedAt: new Date() } }, { upsert: true, new: true });
        return currency.money;
    } catch (e) { return null; }
}

async function removeMoney(userID, amount) {
    try {
        const current = await Currency.findOne({ userID });
        if (!current || current.money < amount) return { success: false, newBalance: current?.money || 0 };
        const currency = await Currency.findOneAndUpdate({ userID }, { $inc: { money: -Number(amount) } }, { new: true });
        return { success: true, newBalance: currency.money };
    } catch (e) { return null; }
}

async function addExp(userID, amount = 2) {
    try {
        const currentData = await Currency.findOne({ userID }) || await ensureUser(userID);
        const newExp = (currentData.exp || 0) + Number(amount);
        const newLevel = calculateLevel(newExp);
        const isLevelUp = newLevel > currentData.level;
        const bonus = isLevelUp ? newLevel * 100 : 0;

        const currency = await Currency.findOneAndUpdate({ userID }, { 
            $inc: { exp: amount, messageCount: 1, money: bonus },
            $set: { level: newLevel, rank: calculateRank(newLevel).name, updatedAt: new Date() }
        }, { new: true });

        return { ...currency._doc, isLevelUp, bonusMoney: bonus, rank: calculateRank(newLevel) };
    } catch (e) { return null; }
}

async function getUserData(userID) {
    try {
        const user = await User.findOne({ userID });
        const currency = await Currency.findOne({ userID });
        if (!user || !currency) return await ensureUser(userID);
        return { user, currency, calculated: { rank: calculateRank(currency.level), progress: getProgress(currency.exp, currency.level), expNeeded: getExpForNextLevel(currency.level) - currency.exp } };
    } catch (e) { return null; }
}

// الدوال المطلوبة لملف Threads.js و Users.js
async function getAllUsers() { return await Currency.find({}); }
async function getThreadData(threadID) { return await Thread.findOne({ threadID }); }
async function updateThreadData(threadID, data) { return await Thread.findOneAndUpdate({ threadID }, { $set: data }, { upsert: true, new: true }); }

module.exports = { 
    User, Currency, Thread, ensureUser, addMoney, removeMoney, getUserData, 
    addExp, updateUserData, getThreadData, updateThreadData, getAllUsers, 
    calculateLevel, calculateRank, getExpForNextLevel, getProgress, RANKS 
};
