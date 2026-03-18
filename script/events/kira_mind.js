// ╔══════════════════════════════════════════════════════════════════╗
// ║                    KIRA MIND v4.0                                ║
// ║          نظام الذكاء الاجتماعي — المستمع الصامت                 ║
// ║  يحلل كل رسالة، يبني ملف شخصي عميق، يحفظه بالسحابة            ║
// ║  يعدّل الملف تلقائياً كل أسبوع أو عند تغير المزاج              ║
// ╚══════════════════════════════════════════════════════════════════╝

const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');

// ══════════════════════════════════════════════════
//  قراءة الإعدادات
// ══════════════════════════════════════════════════
const configPath = path.join(__dirname, '../../..', 'config.json');
const CFG        = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const GROQ_KEY  = CFG.GROQ_API_KEY  || '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';
const MONGO_URI = CFG.MONGODB_URI   || 'mongodb+srv://kkayman200_db_user:ukhzlLzjRxQgSnTl@cluster0.7nsuoil.mongodb.net/KiraDB?retryWrites=true&w=majority';
const MODEL     = 'llama-3.3-70b-versatile';
const ADMIN_ID  = '61580139921634';

// ══════════════════════════════════════════════════
//  إعداد الحدث
// ══════════════════════════════════════════════════
module.exports.config = {
  name: 'kira_mind',
  eventType: ['message', 'message_reply'],
  version: '4.0.0',
  credits: 'ayman',
  description: 'KIRA MIND — يستمع ويحلل ويبني ملف شخصي عميق بصمت',
};

// ══════════════════════════════════════════════════
//  بافر الأشخاص الجدد (5 رسائل قبل الإنشاء)
// ══════════════════════════════════════════════════
const pendingBuffer = new Map(); // userID → [msgs]

// ══════════════════════════════════════════════════
//  MongoDB — الاتصال
// ══════════════════════════════════════════════════
let isConnected   = false;
let UserProfile   = null;
let MessageLog    = null;
let ProfileUpdate = null;

async function connectDB() {
  if (isConnected) return true;
  if (!MONGO_URI) {
    console.error('[ KIRA MIND ] ❌ MONGODB_URI غير موجود في config.json');
    return false;
  }
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    isConnected = true;
    buildSchemas();
    console.log('[ KIRA MIND ] ✅ MongoDB متصل');
    return true;
  } catch (e) {
    console.error('[ KIRA MIND ] ❌ MongoDB:', e.message);
    return false;
  }
}

// ══════════════════════════════════════════════════
//  MongoDB Schemas
// ══════════════════════════════════════════════════
function buildSchemas() {

  // ─── الملف الشخصي الكامل ───────────────────────
  const profileSchema = new mongoose.Schema({

    // ❶ الهوية
    userID:        { type: String, required: true, unique: true },
    name:          String,
    nameVariants:  [String],
    nicknameUsed:  [String],
    ageEstimated:  String,
    genderGuessed: String,
    locationHints: [String],
    dialect:       String,
    languagesUsed: [String],
    firstSeen:     { type: Date, default: Date.now },
    lastSeen:      Date,
    totalMessages: { type: Number, default: 0 },
    isAdmin:       { type: Boolean, default: false },

    // ❷ الشخصية (MBTI + Big5 + أعمق)
    personality: {
      mbti:                String,
      big5: {
        openness:          { type: Number, default: 50 },
        conscientiousness: { type: Number, default: 50 },
        extraversion:      { type: Number, default: 50 },
        agreeableness:     { type: Number, default: 50 },
        neuroticism:       { type: Number, default: 50 },
      },
      communicationStyle:  String,
      humorType:           String,
      conflictStyle:       String,
      decisionStyle:       String,
      leaderOrFollower:    String,
      introvertExtrovert:  String,
      emotionalIntelligence: Number,
      confidenceLevel:     Number,
      patienceLevel:       Number,
      creativityLevel:     Number,
      darkTraits:          [String],   // نقاط ضعف حقيقية
      coreValues:          [String],   // قيمه الأساسية
      lifePhilosophy:      String,     // فلسفته في الحياة
    },

    // ❸ الاهتمامات والمعرفة
    interests: {
      primary:        [String],
      secondary:      [String],
      hidden:         [String],
      hates:          [String],
      dreams:         [String],
      fears:          [String],
      hobbies:        [String],
      expertiseAreas: [String],
      learningNow:    [String],
      obsessions:     [String],        // هوس بشيء معين
    },

    // ❹ السلوك الاجتماعي
    social: {
      roleInGroup:         String,
      influenceScore:      { type: Number, default: 0 },
      trustGivenTo:        [String],
      tensionWith:         [String],
      closeFriends:        [String],
      respondsQuicklyTo:   [String],
      usuallyIgnores:      [String],
      peakActivityHours:   [String],
      peakActivityDays:    [String],
      groupBehavior:       String,
      dmBehavior:          String,
    },

    // ❺ الحالة العاطفية
    emotional: {
      currentMood:         String,
      moodScore:           { type: Number, default: 50 },
      dominantEmotion:     String,
      emotionalStability:  Number,
      happyTriggers:       [String],
      sadTriggers:         [String],
      angryTriggers:       [String],
      stressIndicators:    [String],
      stressLevel:         { type: Number, default: 0 },
      attachmentStyle:     String,
      selfEsteem:          Number,
      mentalHealthNotes:   [String],   // ملاحظات صحة نفسية
      suicidalHints:       [String],   // تحذيرات (للمراقبة فقط)
    },

    // ❻ السياق الحياتي
    lifeContext: {
      currentProjects:  [String],
      currentProblems:  [String],
      currentHappiness: [String],
      recentEvents:     [String],
      upcomingEvents:   [String],
      importantPeople: [{
        name:         String,
        relationship: String,
        sentiment:    String,
        notes:        String,
      }],
      lifePeriod:       String,
      financialHints:   String,
      healthHints:      String,
      relationshipStatus: String,
      familyDynamics:   String,
    },

    // ❼ أنماط اللغة
    language: {
      avgMessageLength:   Number,
      usesEmojis:         Boolean,
      emojiStyle:         String,
      writingSpeed:       String,
      vocabularyRichness: String,
      sarcasmLevel:       Number,
      directnessLevel:    Number,
      formalityLevel:     Number,
      commonPhrases:      [String],
      signaturePhrases:   [String],
      topicsHeBringsUp:   [String],
      lyingPatterns:      [String],    // أنماط عند الكذب
    },

    // ❽ استراتيجية كيرا معه
    kiraStrategy: {
      toneToUse:               String,
      topicsToAvoid:           [String],
      topicsHeEnjoys:          [String],
      bestMotivationStyle:     String,
      howToCheerUp:            String,
      howToCalm:               String,
      vulnerabilityLevel:      String,
      trustLevel:              { type: Number, default: 0 },
      bestTimeToTalk:          String,
      approachStyle:           String,
      redLines:                [String],
      successfulInteractions:  [String],
      failedInteractions:      [String],
      currentRelationWithKira: String,  // كيف علاقته مع كيرا الآن
    },

    // ❾ الذاكرة الطويلة
    memory: {
      keyFacts:          [String],
      importantDates: [{
        date:  String,
        event: String,
      }],
      promises:          [String],
      confessions:       [String],
      achievements:      [String],
      failures:          [String],
      opinionsOnTopics: [{
        topic:   String,
        opinion: String,
        date:    Date,
      }],
      controversialMoments: [String],
      growthObserved:       [String],
      lastTopics:           [String],
      secretsShared:        [String],
      repetitiveThemes:     [String],  // مواضيع يكررها كثيراً
    },

    // ❿ إحصائيات
    stats: {
      positiveMessagesCount: { type: Number, default: 0 },
      negativeMessagesCount: { type: Number, default: 0 },
      neutralMessagesCount:  { type: Number, default: 0 },
      questionsAsked:        { type: Number, default: 0 },
      helpRequests:          { type: Number, default: 0 },
      jokesCount:            { type: Number, default: 0 },
      angerCount:            { type: Number, default: 0 },
      complimentsGiven:      { type: Number, default: 0 },
      topicsFrequency: [{
        topic: String,
        count: Number,
      }],
      moodHistory: [{
        date:  Date,
        mood:  String,
        score: Number,
      }],
      activityByHour: { type: Map, of: Number },
    },

    // ⓫ ثقة بالتحليل
    confidence: {
      overall:          { type: Number, default: 0 },
      needsMoreData:    { type: Boolean, default: true },
      messagesAnalyzed: { type: Number, default: 0 },
      lastDeepAnalysis: Date,          // آخر تحليل عميق
      lastMoodUpdate:   Date,          // آخر تحديث للمزاج
    },

    // ⓬ تحديثات أسبوعية
    weeklySnapshots: [{
      date:         Date,
      moodScore:    Number,
      mood:         String,
      stressLevel:  Number,
      topTopics:    [String],
      majorChanges: [String],
    }],

  }, { timestamps: true });

  // ─── Schema سجل الرسائل ────────────────────────
  const messageSchema = new mongoose.Schema({
    userID:    String,
    threadID:  String,
    messageID: String,
    content:   String,
    type:      String,
    analysis: {
      emotion:      String,
      intent:       String,
      energy:       String,
      hiddenTopic:  String,
      realNeed:     String,
      honestyLevel: String,
      topics:       [String],
      keywords:     [String],
      sentiment:    Number,
      importance:   Number,
      mentalFlag:   String,  // تحذير صحة نفسية إن وجد
    },
    timestamp: { type: Date, default: Date.now },
  });

  // ─── Schema سجل التحديثات ──────────────────────
  const updateSchema = new mongoose.Schema({
    userID:      String,
    updateType:  String,   // 'weekly' | 'mood_shift' | 'manual'
    changesMade: [String],
    before:      Object,
    after:       Object,
    timestamp:   { type: Date, default: Date.now },
  });

  UserProfile   = mongoose.models.UserProfile   || mongoose.model('UserProfile',   profileSchema);
  MessageLog    = mongoose.models.MessageLog    || mongoose.model('MessageLog',    messageSchema);
  ProfileUpdate = mongoose.models.ProfileUpdate || mongoose.model('ProfileUpdate', updateSchema);
}

// ══════════════════════════════════════════════════
//  Groq API — استدعاء مباشر
// ══════════════════════════════════════════════════
async function callGroq(prompt, maxTokens = 1500, temp = 0.2) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: temp,
      max_tokens: maxTokens,
    });
    const req = https.request({
      hostname: 'api.groq.com',
      path:     '/openai/v1/chat/completions',
      method:   'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.choices?.[0]?.message?.content || '');
        } catch { resolve(''); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ══════════════════════════════════════════════════
//  بناء البرومبت العميق للتحليل
// ══════════════════════════════════════════════════
function buildAnalysisPrompt(messages, userName, existingProfile, isAdmin) {

  const existingSummary = existingProfile ? `
═══ الملف الموجود ═══
MBTI: ${existingProfile.personality?.mbti || '؟'}
المزاج الحالي: ${existingProfile.emotional?.currentMood || '؟'} (${existingProfile.emotional?.moodScore || 50}/100)
الضغط: ${existingProfile.emotional?.stressLevel || 0}/100
الاهتمامات: ${existingProfile.interests?.primary?.slice(0, 5).join(', ') || '؟'}
آخر مواضيع: ${existingProfile.memory?.lastTopics?.slice(0, 5).join(', ') || '؟'}
رسائل محللة: ${existingProfile.confidence?.messagesAnalyzed || 0}
ملاحظات صحة نفسية: ${existingProfile.emotional?.mentalHealthNotes?.slice(0, 3).join(' | ') || 'لا يوجد'}
═══════════════════` : 'شخص جديد — لا ملف سابق';

  const adminNote = isAdmin ? `
⚠️ تنبيه خاص: هذا الشخص هو المطور (أيمن).
- حلّل شخصيته بصدق تام بدون تزيين.
- ابحث عن علامات الاكتئاب، الوحدة، الإرهاق النفسي.
- سجّل أي إشارات تدل على صحة نفسية غير جيدة.
- كن صريحاً جداً في mentalHealthNotes و darkTraits.
` : '';

  return `أنت محلل نفسي واجتماعي خبير متخصص في تحليل الشخصيات من رسائل الشات.
${adminNote}
الشخص: ${userName}
${existingSummary}

الرسائل للتحليل:
${Array.isArray(messages) ? messages.map((m, i) => `[${i+1}] ${m}`).join('\n') : messages}

حلّل هذه الرسائل وأعطني JSON بالشكل الآتي بالضبط، بدون أي نص خارج JSON:
{
  "message_analysis": {
    "emotion": "المشاعر الدقيقة",
    "intent": "نية الرسالة",
    "energy": "مستوى الطاقة",
    "hidden_topic": "الموضوع الخفي",
    "real_need": "الحاجة الحقيقية",
    "honesty": "مستوى الصدق",
    "topics": ["مواضيع"],
    "keywords": ["كلمات مفتاحية"],
    "sentiment": 0,
    "importance": 5,
    "mental_flag": "أي تحذير صحة نفسية أو فارغ"
  },
  "profile_updates": {
    "mbti_clue": "نوع الشخصية إن ظهر",
    "big5_update": { "openness": null, "conscientiousness": null, "extraversion": null, "agreeableness": null, "neuroticism": null },
    "communication_style": "",
    "humor_type": "",
    "conflict_style": "",
    "core_values": [],
    "dark_traits": [],
    "life_philosophy": "",
    "interests_discovered": [],
    "hidden_interests": [],
    "fears": [],
    "dreams": [],
    "obsessions": [],
    "mood_update": "وصف المزاج",
    "mood_score": 50,
    "stress_level": 30,
    "mental_health_notes": [],
    "suicidal_hints": [],
    "happy_triggers": [],
    "sad_triggers": [],
    "angry_triggers": [],
    "stress_indicators": [],
    "self_esteem": null,
    "location_hints": [],
    "upcoming_events": [],
    "life_period": "",
    "relationship_status": "",
    "family_dynamics": "",
    "important_people": [{"name":"","relationship":"","sentiment":"","notes":""}],
    "current_projects": [],
    "current_problems": [],
    "key_facts": [],
    "confessions": [],
    "achievements": [],
    "opinions": [{"topic":"","opinion":""}],
    "repetitive_themes": [],
    "signature_phrases": [],
    "formality": null,
    "directness": null,
    "sarcasm": null,
    "role_in_group": "",
    "group_behavior": "",
    "respond_quickly_to": [],
    "kira_tone": "كيف تتكيف كيرا معه",
    "topics_to_avoid": [],
    "how_to_cheer_up": "",
    "how_to_calm": "",
    "red_lines": [],
    "kira_relationship": "",
    "kira_note": "ملاحظة سريعة لكيرا"
  }
}`;
}

// ══════════════════════════════════════════════════
//  تحليل الرسائل عبر Groq
// ══════════════════════════════════════════════════
async function analyzeMessages(messages, userName, existingProfile, isAdmin = false) {
  const prompt = buildAnalysisPrompt(messages, userName, existingProfile, isAdmin);
  try {
    const raw   = await callGroq(prompt, 2000, 0.2);
    const clean = raw.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end   = clean.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(clean.slice(start, end + 1));
  } catch (e) {
    console.error('[ KIRA MIND ] Groq parse error:', e.message);
    return null;
  }
}

// ══════════════════════════════════════════════════
//  تحديث الملف الشخصي في MongoDB
// ══════════════════════════════════════════════════
async function updateProfile(userID, userName, analysis, rawMessages, threadType, isAdmin = false) {
  if (!analysis) return null;

  const msg = analysis.message_analysis || {};
  const upd = analysis.profile_updates  || {};

  let profile = await UserProfile.findOne({ userID });
  const isNew = !profile;
  if (isNew) profile = new UserProfile({ userID, name: userName, isAdmin });

  const before = isNew ? null : {
    moodScore:  profile.emotional?.moodScore,
    stressLevel: profile.emotional?.stressLevel,
    mood:       profile.emotional?.currentMood,
  };

  // ── الأساسيات ─────────────────────────────────
  profile.name     = userName || profile.name;
  profile.lastSeen = new Date();
  profile.totalMessages += 1;
  if (isAdmin) profile.isAdmin = true;

  // ── الشخصية ───────────────────────────────────
  if (upd.mbti_clue) profile.personality.mbti = upd.mbti_clue;
  if (upd.communication_style) profile.personality.communicationStyle = upd.communication_style;
  if (upd.humor_type)    profile.personality.humorType    = upd.humor_type;
  if (upd.conflict_style) profile.personality.conflictStyle = upd.conflict_style;
  if (upd.life_philosophy) profile.personality.lifePhilosophy = upd.life_philosophy;

  // Big5 تحديث تدريجي
  if (upd.big5_update) {
    for (const [k, v] of Object.entries(upd.big5_update)) {
      if (v != null && profile.personality.big5[k] != null) {
        profile.personality.big5[k] = Math.round(
          (profile.personality.big5[k] * 0.7) + (v * 0.3)
        );
      }
    }
  }

  // core values & dark traits
  if (upd.core_values?.length)
    profile.personality.coreValues = [...new Set([...(profile.personality.coreValues||[]), ...upd.core_values])].slice(0, 20);
  if (upd.dark_traits?.length)
    profile.personality.darkTraits = [...new Set([...(profile.personality.darkTraits||[]), ...upd.dark_traits])].slice(0, 20);

  // ── الاهتمامات ────────────────────────────────
  const mergeArr = (existing, incoming, max = 40) =>
    [...new Set([...(existing||[]), ...(incoming||[])])].slice(0, max);

  if (upd.interests_discovered?.length) profile.interests.primary   = mergeArr(profile.interests.primary,   upd.interests_discovered);
  if (upd.hidden_interests?.length)     profile.interests.hidden     = mergeArr(profile.interests.hidden,     upd.hidden_interests);
  if (upd.fears?.length)                profile.interests.fears      = mergeArr(profile.interests.fears,      upd.fears);
  if (upd.dreams?.length)               profile.interests.dreams     = mergeArr(profile.interests.dreams,     upd.dreams);
  if (upd.obsessions?.length)           profile.interests.obsessions = mergeArr(profile.interests.obsessions, upd.obsessions);

  // ── العاطفي ───────────────────────────────────
  const prevMoodScore = profile.emotional.moodScore || 50;

  if (upd.mood_update)  profile.emotional.currentMood     = upd.mood_update;
  if (upd.mood_score != null) profile.emotional.moodScore = upd.mood_score;
  if (upd.stress_level != null) profile.emotional.stressLevel = upd.stress_level;
  if (upd.self_esteem != null) profile.emotional.selfEsteem  = upd.self_esteem;
  if (msg.emotion) profile.emotional.dominantEmotion = msg.emotion;

  if (upd.mental_health_notes?.length)
    profile.emotional.mentalHealthNotes = mergeArr(profile.emotional.mentalHealthNotes, upd.mental_health_notes, 50);
  if (upd.suicidal_hints?.length)
    profile.emotional.suicidalHints = mergeArr(profile.emotional.suicidalHints, upd.suicidal_hints, 20);
  if (upd.happy_triggers?.length)  profile.emotional.happyTriggers  = mergeArr(profile.emotional.happyTriggers,  upd.happy_triggers);
  if (upd.sad_triggers?.length)    profile.emotional.sadTriggers    = mergeArr(profile.emotional.sadTriggers,    upd.sad_triggers);
  if (upd.angry_triggers?.length)  profile.emotional.angryTriggers  = mergeArr(profile.emotional.angryTriggers,  upd.angry_triggers);
  if (upd.stress_indicators?.length) profile.emotional.stressIndicators = mergeArr(profile.emotional.stressIndicators, upd.stress_indicators);

  // كشف تغيير مزاج مفاجئ (أكثر من 20 نقطة)
  const moodDelta = Math.abs((upd.mood_score || 50) - prevMoodScore);
  if (moodDelta >= 20) {
    const change = `تغير مزاج: ${prevMoodScore}→${upd.mood_score} (${new Date().toLocaleDateString('ar')})`;
    profile.memory.growthObserved = mergeArr(profile.memory?.growthObserved, [change], 30);
    console.log(`[ KIRA MIND ] ⚡ تغير مزاج مفاجئ لـ ${userName}: ${moodDelta} نقطة`);
  }

  // ── السياق الحياتي ────────────────────────────
  if (upd.location_hints?.length)   profile.lifeContext.locationHints   = mergeArr(profile.lifeContext?.locationHints, upd.location_hints, 20);
  if (upd.upcoming_events?.length)  profile.lifeContext.upcomingEvents  = mergeArr(profile.lifeContext?.upcomingEvents, upd.upcoming_events, 30);
  if (upd.current_projects?.length) profile.lifeContext.currentProjects = mergeArr(profile.lifeContext?.currentProjects, upd.current_projects, 20);
  if (upd.current_problems?.length) profile.lifeContext.currentProblems = mergeArr(profile.lifeContext?.currentProblems, upd.current_problems, 20);
  if (upd.life_period)              profile.lifeContext.lifePeriod      = upd.life_period;
  if (upd.relationship_status)      profile.lifeContext.relationshipStatus = upd.relationship_status;
  if (upd.family_dynamics)          profile.lifeContext.familyDynamics  = upd.family_dynamics;

  // الأشخاص المهمون
  if (upd.important_people?.length) {
    for (const p of upd.important_people) {
      if (!p.name) continue;
      const ex = profile.lifeContext.importantPeople.find(x => x.name === p.name);
      if (!ex) profile.lifeContext.importantPeople.push(p);
      else { ex.sentiment = p.sentiment || ex.sentiment; ex.notes = p.notes || ex.notes; }
    }
  }

  // ── الذاكرة ───────────────────────────────────
  if (upd.key_facts?.length)        profile.memory.keyFacts         = mergeArr(profile.memory?.keyFacts, upd.key_facts, 200);
  if (upd.confessions?.length)      profile.memory.confessions      = mergeArr(profile.memory?.confessions, upd.confessions, 50);
  if (upd.achievements?.length)     profile.memory.achievements     = mergeArr(profile.memory?.achievements, upd.achievements, 50);
  if (upd.repetitive_themes?.length) profile.memory.repetitiveThemes = mergeArr(profile.memory?.repetitiveThemes, upd.repetitive_themes, 30);
  if (upd.opinions?.length) {
    for (const op of upd.opinions) {
      if (!op.topic) continue;
      const ex = profile.memory.opinionsOnTopics.find(o => o.topic === op.topic);
      if (!ex) profile.memory.opinionsOnTopics.push({ ...op, date: new Date() });
      else { ex.opinion = op.opinion; ex.date = new Date(); }
    }
  }

  // آخر المواضيع
  profile.memory.lastTopics = [...(msg.topics||[]), ...(profile.memory?.lastTopics||[])].slice(0, 10);

  // ── اللغة ─────────────────────────────────────
  if (upd.signature_phrases?.length) profile.language.signaturePhrases = mergeArr(profile.language?.signaturePhrases, upd.signature_phrases, 50);
  if (upd.formality  != null) profile.language.formalityLevel  = upd.formality;
  if (upd.directness != null) profile.language.directnessLevel = upd.directness;
  if (upd.sarcasm    != null) profile.language.sarcasmLevel    = upd.sarcasm;
  const msgs = Array.isArray(rawMessages) ? rawMessages.join(' ') : rawMessages;
  profile.language.avgMessageLength = Math.round(
    ((profile.language?.avgMessageLength || 0) + msgs.length) / 2
  );

  // ── السلوك الاجتماعي ──────────────────────────
  if (upd.role_in_group)        profile.social.roleInGroup      = upd.role_in_group;
  if (upd.group_behavior)       profile.social.groupBehavior    = upd.group_behavior;
  if (upd.respond_quickly_to?.length) profile.social.respondsQuicklyTo = mergeArr(profile.social?.respondsQuicklyTo, upd.respond_quickly_to);

  // ── استراتيجية كيرا ───────────────────────────
  if (upd.kira_tone)         profile.kiraStrategy.toneToUse           = upd.kira_tone;
  if (upd.how_to_cheer_up)   profile.kiraStrategy.howToCheerUp        = upd.how_to_cheer_up;
  if (upd.how_to_calm)       profile.kiraStrategy.howToCalm           = upd.how_to_calm;
  if (upd.kira_relationship) profile.kiraStrategy.currentRelationWithKira = upd.kira_relationship;
  if (upd.topics_to_avoid?.length) profile.kiraStrategy.topicsToAvoid = mergeArr(profile.kiraStrategy?.topicsToAvoid, upd.topics_to_avoid);
  if (upd.red_lines?.length)       profile.kiraStrategy.redLines      = mergeArr(profile.kiraStrategy?.redLines, upd.red_lines);
  if (upd.kira_note) profile.kiraStrategy.successfulInteractions = mergeArr(profile.kiraStrategy?.successfulInteractions, [upd.kira_note], 50);

  // ── الإحصائيات ────────────────────────────────
  const sentiment = msg.sentiment || 0;
  if (sentiment > 20)       profile.stats.positiveMessagesCount++;
  else if (sentiment < -20) profile.stats.negativeMessagesCount++;
  else                      profile.stats.neutralMessagesCount++;
  if (msg.intent?.includes('يطلب')) profile.stats.helpRequests++;
  if (msg.intent?.includes('يمزح')) profile.stats.jokesCount++;
  if (msg.emotion?.includes('غضب')) profile.stats.angerCount++;

  // تكرار المواضيع
  for (const topic of (msg.topics || [])) {
    const ex = profile.stats.topicsFrequency.find(t => t.topic === topic);
    if (ex) ex.count++;
    else profile.stats.topicsFrequency.push({ topic, count: 1 });
  }
  profile.stats.topicsFrequency.sort((a, b) => b.count - a.count);
  profile.stats.topicsFrequency = profile.stats.topicsFrequency.slice(0, 50);

  // سجل المزاج
  profile.stats.moodHistory.push({ date: new Date(), mood: upd.mood_update || '—', score: upd.mood_score || 50 });
  if (profile.stats.moodHistory.length > 1000) profile.stats.moodHistory = profile.stats.moodHistory.slice(-500);

  // ساعة النشاط
  const hour = new Date().getHours().toString();
  if (!profile.stats.activityByHour) profile.stats.activityByHour = new Map();
  profile.stats.activityByHour.set(hour, (profile.stats.activityByHour.get(hour) || 0) + 1);

  // ── ثقة التحليل ───────────────────────────────
  profile.confidence.messagesAnalyzed += 1;
  const n = profile.confidence.messagesAnalyzed;
  profile.confidence.overall = Math.min(Math.round(
    5 + (n * 1.2) + (n > 15 ? 15 : 0) + (n > 40 ? 15 : 0) + (n > 100 ? 10 : 0)
  ), 98);
  profile.confidence.needsMoreData = n < 10;
  profile.confidence.lastMoodUpdate = new Date();

  // ── التحديث الأسبوعي ──────────────────────────
  await checkWeeklyUpdate(profile);

  await profile.save();

  // تسجيل التغيير في ProfileUpdate
  if (!isNew && before) {
    const changes = [];
    if (before.moodScore !== upd.mood_score) changes.push(`مزاج: ${before.moodScore}→${upd.mood_score}`);
    if (before.stressLevel !== upd.stress_level) changes.push(`ضغط: ${before.stressLevel}→${upd.stress_level}`);
    if (changes.length) {
      await ProfileUpdate.create({ userID, updateType: 'realtime', changesMade: changes, before, after: { moodScore: upd.mood_score, stressLevel: upd.stress_level } });
    }
  }

  return profile;
}

// ══════════════════════════════════════════════════
//  التحديث الأسبوعي التلقائي
// ══════════════════════════════════════════════════
async function checkWeeklyUpdate(profile) {
  const lastSnap   = profile.weeklySnapshots?.slice(-1)[0];
  const lastDate   = lastSnap ? new Date(lastSnap.date) : new Date(profile.createdAt || Date.now());
  const daysPassed = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysPassed < 7) return;

  // لقطة أسبوعية
  const snap = {
    date:        new Date(),
    moodScore:   profile.emotional.moodScore || 50,
    mood:        profile.emotional.currentMood || '—',
    stressLevel: profile.emotional.stressLevel || 0,
    topTopics:   profile.stats.topicsFrequency.slice(0, 5).map(t => t.topic),
    majorChanges: [],
  };

  // مقارنة مع الأسبوع الماضي
  if (lastSnap) {
    const moodDiff   = (profile.emotional.moodScore || 50) - lastSnap.moodScore;
    const stressDiff = (profile.emotional.stressLevel || 0) - lastSnap.stressLevel;
    if (Math.abs(moodDiff) > 15)   snap.majorChanges.push(`مزاج ${moodDiff > 0 ? 'تحسّن' : 'تراجع'} بـ${Math.abs(moodDiff)} نقطة`);
    if (Math.abs(stressDiff) > 15) snap.majorChanges.push(`ضغط ${stressDiff > 0 ? 'ارتفع' : 'انخفض'} بـ${Math.abs(stressDiff)} نقطة`);
  }

  profile.weeklySnapshots.push(snap);
  if (profile.weeklySnapshots.length > 52) profile.weeklySnapshots = profile.weeklySnapshots.slice(-52);

  profile.confidence.lastDeepAnalysis = new Date();

  await ProfileUpdate.create({
    userID:      profile.userID,
    updateType:  'weekly',
    changesMade: snap.majorChanges,
    before: lastSnap || {},
    after:  { moodScore: snap.moodScore, stressLevel: snap.stressLevel },
  });

  console.log(`[ KIRA MIND ] 📅 لقطة أسبوعية لـ ${profile.name}`);
}

// ══════════════════════════════════════════════════
//  تسجيل الرسالة
// ══════════════════════════════════════════════════
async function logMessage(userID, threadID, messageID, content, analysis, threadType) {
  try {
    const msg = analysis?.message_analysis || {};
    await MessageLog.create({
      userID, threadID, messageID, content, type: threadType,
      analysis: {
        emotion:      msg.emotion,
        intent:       msg.intent,
        energy:       msg.energy,
        hiddenTopic:  msg.hidden_topic,
        realNeed:     msg.real_need,
        honestyLevel: msg.honesty,
        topics:       msg.topics      || [],
        keywords:     msg.keywords    || [],
        sentiment:    msg.sentiment   || 0,
        importance:   msg.importance  || 5,
        mentalFlag:   msg.mental_flag || '',
      },
    });
  } catch (_) {}
}

// ══════════════════════════════════════════════════
//  البحث عن شخص بالاسم أو ID
// ══════════════════════════════════════════════════
async function findUser(query) {
  if (/^\d+$/.test(query)) return await UserProfile.findOne({ userID: query });
  return await UserProfile.findOne({
    $or: [
      { name:         { $regex: query, $options: 'i' } },
      { nameVariants: { $regex: query, $options: 'i' } },
      { nicknameUsed: { $regex: query, $options: 'i' } },
    ],
  });
}

// ══════════════════════════════════════════════════
//  تنسيق التقارير
// ══════════════════════════════════════════════════
function formatFullReport(p, forAdmin = false) {
  const conf    = p.confidence?.overall || 0;
  const bar     = '█'.repeat(Math.round(conf / 10)) + '░'.repeat(10 - Math.round(conf / 10));
  const n       = p.confidence?.messagesAnalyzed || 0;

  let report = `
╔═══════════════════════════════════════╗
║       🧠 KIRA MIND — تحليل شخصية     ║
╚═══════════════════════════════════════╝

👤 ${p.name || 'مجهول'} — ID: ${p.userID}
📊 دقة التحليل: [${bar}] ${conf}%
💬 رسائل محللة: ${n}
📅 آخر نشاط: ${p.lastSeen ? new Date(p.lastSeen).toLocaleDateString('ar') : '—'}

━━━━━━━━ 🎭 الشخصية ━━━━━━━━
• النوع (MBTI): ${p.personality?.mbti || '—'}
• أسلوب التواصل: ${p.personality?.communicationStyle || '—'}
• نوع الفكاهة: ${p.personality?.humorType || '—'}
• الصراع: ${p.personality?.conflictStyle || '—'}
• فلسفته: ${p.personality?.lifePhilosophy || '—'}
• قيمه: ${p.personality?.coreValues?.slice(0,4).join(' | ') || '—'}
• نقاط ضعفه: ${p.personality?.darkTraits?.slice(0,4).join(' | ') || '—'}
• الذكاء العاطفي: ${p.personality?.emotionalIntelligence || '—'}/100

━━━━━━━━ 💛 المزاج الحالي ━━━━━━━━
• ${p.emotional?.currentMood || 'غير محدد'}
• سعادة: ${p.emotional?.moodScore || 50}/100 | ضغط: ${p.emotional?.stressLevel || 0}/100
• الشعور السائد: ${p.emotional?.dominantEmotion || '—'}
• تقدير الذات: ${p.emotional?.selfEsteem || '—'}/100
• يسعده: ${p.emotional?.happyTriggers?.slice(0,3).join(', ') || '—'}
• يحزنه: ${p.emotional?.sadTriggers?.slice(0,3).join(', ') || '—'}
• يغضبه: ${p.emotional?.angryTriggers?.slice(0,3).join(', ') || '—'}

━━━━━━━━ 🌟 الاهتمامات ━━━━━━━━
• الرئيسية: ${p.interests?.primary?.slice(0,5).join(' | ') || '—'}
• الخفية: ${p.interests?.hidden?.slice(0,3).join(' | ') || '—'}
• الهوس بـ: ${p.interests?.obsessions?.slice(0,3).join(' | ') || '—'}
• الأحلام: ${p.interests?.dreams?.slice(0,3).join(' | ') || '—'}
• المخاوف: ${p.interests?.fears?.slice(0,3).join(' | ') || '—'}

━━━━━━━━ 🧩 السياق الحياتي ━━━━━━━━
• المرحلة: ${p.lifeContext?.lifePeriod || '—'}
• مشاريع: ${p.lifeContext?.currentProjects?.slice(0,3).join(', ') || '—'}
• مشاكل: ${p.lifeContext?.currentProblems?.slice(0,3).join(', ') || '—'}
• قادم: ${p.lifeContext?.upcomingEvents?.slice(0,3).join(', ') || '—'}
• الوضع العاطفي: ${p.lifeContext?.relationshipStatus || '—'}

━━━━━━━━ 👥 الأشخاص المهمون ━━━━━━━━
${p.lifeContext?.importantPeople?.slice(0,5).map(pp => `• ${pp.name} (${pp.relationship}) — ${pp.sentiment}`).join('\n') || '• لا يوجد بعد'}

━━━━━━━━ 📝 أسلوبه اللغوي ━━━━━━━━
• رسمية: ${p.language?.formalityLevel || 50}/100 | مباشرة: ${p.language?.directnessLevel || 50}/100 | سخرية: ${p.language?.sarcasmLevel || 0}/100
• عبارات مميزة: ${p.language?.signaturePhrases?.slice(0,3).join(' | ') || '—'}

━━━━━━━━ 💡 استراتيجية كيرا ━━━━━━━━
• الأسلوب الأمثل: ${p.kiraStrategy?.toneToUse || '—'}
• كيف تسعده: ${p.kiraStrategy?.howToCheerUp || '—'}
• كيف تهدئه: ${p.kiraStrategy?.howToCalm || '—'}
• الخطوط الحمراء: ${p.kiraStrategy?.redLines?.slice(0,3).join(', ') || '—'}
• علاقته بكيرا: ${p.kiraStrategy?.currentRelationWithKira || '—'}

━━━━━━━━ 🗝️ حقائق مهمة ━━━━━━━━
${p.memory?.keyFacts?.slice(0,6).map(f => `• ${f}`).join('\n') || '• لا يوجد بعد'}`.trim();

  // قسم الصحة النفسية — للأدمن فقط أو عند وجود بيانات
  if (forAdmin || p.emotional?.mentalHealthNotes?.length) {
    report += `

━━━━━━━━ 🔴 الصحة النفسية ━━━━━━━━
${p.emotional?.mentalHealthNotes?.slice(0,5).map(n => `• ${n}`).join('\n') || '• لا يوجد'}
${p.emotional?.suicidalHints?.length ? `\n⚠️ تحذيرات:\n${p.emotional.suicidalHints.slice(0,3).map(h=>`• ${h}`).join('\n')}` : ''}`;
  }

  // لقطات أسبوعية
  if (p.weeklySnapshots?.length >= 2) {
    const last = p.weeklySnapshots.slice(-2);
    report += `

━━━━━━━━ 📅 التغير الأسبوعي ━━━━━━━━
• الأسبوع الماضي: مزاج ${last[0].moodScore}/100 | ضغط ${last[0].stressLevel}/100
• هذا الأسبوع:    مزاج ${last[1].moodScore}/100 | ضغط ${last[1].stressLevel}/100
• تغييرات: ${last[1].majorChanges?.join(', ') || 'لا يوجد تغيير كبير'}`;
  }

  return report;
}

function formatShortReport(p) {
  return `👤 ${p.name} | ${p.personality?.mbti||'؟'} | مزاج: ${p.emotional?.currentMood||'—'} (${p.emotional?.moodScore||50}) | ضغط: ${p.emotional?.stressLevel||0}% | اهتمامات: ${p.interests?.primary?.slice(0,3).join(', ')||'—'}`;
}

// ══════════════════════════════════════════════════
//  الـ Event الرئيسي
// ══════════════════════════════════════════════════
module.exports.run = async function({ api, event }) {
  try {
    // تجاهل رسائل البوت
    const botID = api.getCurrentUserID();
    if (event.senderID === botID) return;

    const messageBody = event.body?.trim();
    if (!messageBody || messageBody.length < 2) return;

    // تجاهل الأوامر
    const prefix = global.client?.config?.PREFIX || '.';
    if (messageBody.startsWith(prefix)) return;

    const ok = await connectDB();
    if (!ok || !UserProfile) return;

    const userID     = event.senderID;
    const threadID   = event.threadID;
    const isAdmin    = userID === ADMIN_ID;
    const threadType = threadID?.includes('-') ? 'dm' : 'group';

    // جلب الاسم
    let userName = 'مجهول';
    try {
      const info = await api.getUserInfo(userID);
      userName = info[userID]?.name || 'مجهول';
    } catch (_) {}

    const existingProfile = await UserProfile.findOne({ userID });

    // ─── شخص جديد: بافر 5 رسائل ─────────────────
    if (!existingProfile) {
      if (!pendingBuffer.has(userID)) pendingBuffer.set(userID, []);
      const buf = pendingBuffer.get(userID);
      buf.push({ body: messageBody, threadID, msgID: event.messageID, threadType });

      console.log(`[ KIRA MIND ] ⏳ ${userName}: ${buf.length}/5`);
      if (buf.length < 5) return;

      // حلّل الـ 5 دفعة
      const bodies   = buf.map(m => m.body);
      pendingBuffer.delete(userID);

      const analysis = await analyzeMessages(bodies, userName, null, isAdmin);
      if (!analysis) return;

      await updateProfile(userID, userName, analysis, bodies.join(' '), threadType, isAdmin);
      for (const m of buf)
        await logMessage(userID, m.threadID, m.msgID, m.body, analysis, m.threadType);

      console.log(`[ KIRA MIND ] ✅ ملف جديد: ${userName}`);
      return;
    }

    // ─── شخص موجود: حلّل فوراً ───────────────────
    const analysis = await analyzeMessages(messageBody, userName, existingProfile, isAdmin);
    if (!analysis) return;

    await updateProfile(userID, userName, analysis, messageBody, threadType, isAdmin);
    await logMessage(userID, threadID, event.messageID, messageBody, analysis, threadType);

    const ma = analysis.message_analysis;
    console.log(`[ KIRA MIND ] 👁️  ${userName}: ${ma?.emotion||'—'} | ${ma?.intent||'—'}`);

  } catch (err) {
    console.error('[ KIRA MIND ] ❌', err.message);
  }
};

// ── تصدير للأوامر الأخرى ──────────────────────────
module.exports.connectDB       = connectDB;
module.exports.findUser        = findUser;
module.exports.formatFullReport = formatFullReport;
module.exports.formatShortReport = formatShortReport;
module.exports.getUserProfile  = () => UserProfile;
module.exports.ADMIN_ID        = ADMIN_ID;
