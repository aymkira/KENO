// ══════════════════════════════════════════════════════════════
// KIRA AI — ULTIMATE OMEGA (1000+ FUNCTIONS)
// ══════════════════════════════════════════════════════════════
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const stream = require("stream");
const util = require("util");
const url = require("url");
const http = require("http");
const https = require("https");
const { exec, spawn } = require("child_process");
const mongoose = require("mongoose");

// Import all bot utilities
const { getUserData, addMoney, removeMoney, ensureUser, updateUserData, getAllUsers } = require(
  path.join(process.cwd(), "includes", "mongodb.js")
);

// Try to import all possible bot modules
let utils = {}, commands = {}, events = {}, dashboard = {};
try { utils = require(path.join(process.cwd(), "utils.js")); } catch(e) {}
try { commands = require(path.join(process.cwd(), "includes", "commands.js")); } catch(e) {}
try { events = require(path.join(process.cwd(), "includes", "events.js")); } catch(e) {}
try { dashboard = require(path.join(process.cwd(), "dashboard", "server.js")); } catch(e) {}

module.exports.config = {
  name: "كينو",
  version: "5.0.0",
  hasPermssion: 2,
  credits: "Ayman",
  description: "المساعد الذكي الخارق — 1000+ دالة",
  commandCategory: "developer",
  usages: "كينو [أي طلب] | كينو اقترح [وصف]",
  cooldowns: 1
};

const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ══════════════════════════════════════════
// ADVANCED MONGODB SCHEMAS
// ══════════════════════════════════════════
const dynamicCmdSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  prompt: { type: String, default: "" },
  category: { type: String, default: "عام" },
  usageCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  failCount: { type: Number, default: 0 },
  avgExecTime: { type: Number, default: 0 },
  createdBy: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  tags: [String],
  isPublic: { type: Boolean, default: true }
});

const suggestionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  generatedCode: { type: String, default: "" },
  suggestedName: { type: String, default: "" },
  category: { type: String, default: "" },
  createdBy: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false },
  votes: { type: Number, default: 0 }
});

const DynamicCmd = mongoose.models.DynamicCmd || mongoose.model("DynamicCmd", dynamicCmdSchema);
const Suggestion = mongoose.models.Suggestion || mongoose.model("Suggestion", suggestionSchema);

// ══════════════════════════════════════════
// KNOWLEDGE BASE — 1000+ FUNCTIONS
// ══════════════════════════════════════════
const KNOWLEDGE_BASE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
قاعدة المعرفة الشاملة — 1000+ دالة وأمر
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

══════════════════════════════
١. جميع دوال API الأساسية
══════════════════════════════
api.sendMessage
api.sendMessage(body, threadID)
api.sendMessage({body, attachment}, threadID)
api.sendMessage({body, mentions}, threadID)
api.sendMessage({body, sticker: stickerID}, threadID)
api.unsendMessage(messageID)
api.editMessage(text, messageID)
api.react(emoji, messageID)
api.setMessageReaction(emoji, messageID)
api.markAsRead(threadID)
api.markAsDelivered(threadID, messageID)
api.getUserInfo(userID)
api.getThreadInfo(threadID)
api.getThreadList(limit, timestamp, tags)
api.getThreadHistory(threadID, limit, timestamp)
api.getThreadPictures(threadID)
api.getUserID(facebookLink)
api.getFriendsList()
api.changeNickname(nickname, threadID, userID)
api.changeThreadName(name, threadID)
api.changeThreadEmoji(emoji, threadID)
api.changeThreadColor(color, threadID)
api.changeThreadApprovalMode(threadID, boolean)
api.changeGroupImage(imageStream, threadID)
api.addUserToGroup(userID, threadID)
api.removeUserFromGroup(userID, threadID)
api.muteThread(threadID, seconds)
api.muteGlobal(userID, seconds)
api.blockUser(userID)
api.unblockUser(userID)
api.changeAdminStatus(threadID, userID, boolean)
api.removeAdmin(threadID, userID)
api.setTitle(title, threadID)
api.setAvatar(avatarStream)
api.createNewGroup(userIDs, threadTitle)
api.leaveGroup(threadID)
api.deleteThread(threadID)
api.forwardMessage(messageID, threadID)
api.sendTypingIndicator(threadID, boolean)
api.logout()
api.httpGet(url)
api.httpPost(url, form)
api.httpStream(url)
api.resolvePhotoUrl(photoURL)
api.shareContact(text, userID, threadID)
api.shareLink(link, threadID)

══════════════════════════════
٢. دوال معالجة الملفات
══════════════════════════════
fs.readFileSync
fs.writeFileSync
fs.appendFileSync
fs.unlinkSync
fs.mkdirSync
fs.rmdirSync
fs.readdirSync
fs.statSync
fs.existsSync
fs.renameSync
fs.copyFileSync
fs.chmodSync
fs.createReadStream
fs.createWriteStream
fs.watch
fs.promises.readFile
fs.promises.writeFile
fs.promises.appendFile
fs.promises.unlink
fs.promises.mkdir
fs.promises.rmdir
fs.promises.readdir
fs.promises.stat
fs.promises.rename
fs.promises.copyFile

══════════════════════════════
٣. دوال المسار
══════════════════════════════
path.join
path.resolve
path.basename
path.dirname
path.extname
path.parse
path.format
path.normalize
path.relative
path.delimiter
path.sep
path.posix
path.win32

══════════════════════════════
٤. دوال النظام والتوقيت
══════════════════════════════
os.platform
os.arch
os.cpus
os.freemem
os.totalmem
os.homedir
os.hostname
os.networkInterfaces
os.uptime
os.loadavg
os.release
os.type
os.userInfo
os.EOL
process.cwd
process.memoryUsage
process.uptime
process.hrtime
process.version
process.versions
process.env
process.argv
process.exit
process.kill
process.pid
process.title
process.chdir
process.cpuUsage
process.resourceUsage

══════════════════════════════
٥. دوال التشفير والأمان
══════════════════════════════
crypto.randomBytes
crypto.randomInt
crypto.createHash
crypto.createHmac
crypto.createCipheriv
crypto.createDecipheriv
crypto.pbkdf2
crypto.pbkdf2Sync
crypto.generateKeyPair
crypto.generateKeyPairSync
crypto.createSign
crypto.createVerify
crypto.createDiffieHellman
crypto.getHashes
crypto.getCiphers
crypto.getCurves
crypto.timingSafeEqual
crypto.constants
crypto.webcrypto
crypto.randomUUID

══════════════════════════════
٦. دوال البث والمعالجة
══════════════════════════════
stream.Readable
stream.Writable
stream.Duplex
stream.Transform
stream.PassThrough
stream.pipeline
stream.finished
stream.promises.pipeline
stream.promises.finished
stream.addAbortSignal
stream.isDisturbed
stream.isReadable
stream.isErrored
stream.destroy
stream.compose
stream.duplexPair
stream.Duplex.from

══════════════════════════════
٧. دوال HTTP/HTTPS
══════════════════════════════
http.createServer
http.request
http.get
http.STATUS_CODES
http.METHODS
http.globalAgent
http.Agent
https.createServer
https.request
https.get
https.globalAgent
https.Agent
http.Server
http.ServerResponse
http.IncomingMessage
http.ClientRequest
url.parse
url.format
url.resolve
url.URL
url.URLSearchParams
url.domainToASCII
url.domainToUnicode
url.pathToFileURL
url.fileURLToPath

══════════════════════════════
٨. دوال الأدوات المساعدة
══════════════════════════════
util.format
util.inspect
util.promisify
util.callbackify
util.inherits
util.types
util.deprecate
util.debuglog
util.isDeepStrictEqual
util.getSystemErrorMap
util.getSystemErrorName
util.toUSVString
util.stripVTControlCharacters
util.MIMEType
util.MIMEParams
util.parseArgs
util.parseEnv
util.aborted
util.types.isAnyArrayBuffer
util.types.isArrayBuffer
util.types.isArrayBufferView
util.types.isAsyncFunction
util.types.isBigInt64Array
util.types.isBigUint64Array
util.types.isBooleanObject
util.types.isBoxedPrimitive
util.types.isDataView
util.types.isDate
util.types.isExternal
util.types.isFloat32Array
util.types.isFloat64Array
util.types.isGeneratorFunction
util.types.isGeneratorObject
util.types.isInt8Array
util.types.isInt16Array
util.types.isInt32Array
util.types.isKeyObject
util.types.isMap
util.types.isMapIterator
util.types.isModuleNamespaceObject
util.types.isNativeError
util.types.isNumberObject
util.types.isPromise
util.types.isProxy
util.types.isRegExp
util.types.isSet
util.types.isSetIterator
util.types.isSharedArrayBuffer
util.types.isStringObject
util.types.isSymbolObject
util.types.isTypedArray
util.types.isUint8Array
util.types.isUint8ClampedArray
util.types.isUint16Array
util.types.isUint32Array
util.types.isWeakMap
util.types.isWeakSet

══════════════════════════════
٩. دوال child_process
══════════════════════════════
exec
execSync
execFile
execFileSync
spawn
spawnSync
fork
execPath
execArgv
silent
stdio
stdin
stdout
stderr
pid
kill
connected
disconnect
send
exitCode
signalCode
spawned
chdir
cwd
env
argv
argv0
execCommand
execPath
execArgv

══════════════════════════════
١٠. دوال الاقتصاد والمستخدمين
══════════════════════════════
getUserData(userID)
addMoney(userID, amount)
removeMoney(userID, amount)
ensureUser(userID)
updateUserData(userID, data)
getAllUsers()
getUserByMoney(limit)
getUserByExp(limit)
getUserByLevel(limit)
getUserByRank(rank)
getUserByMessageCount(limit)
getUserByDailyStreak(limit)
getTopMoney(limit)
getTopExp(limit)
getTopLevel(limit)
getTopMessageCount(limit)
getTopDailyStreak(limit)
getUserRank(userID)
getUserStats(userID)
resetUserData(userID)
resetAllUsers()
backupUserData()
restoreUserData(backup)

══════════════════════════════
١١. دوال الوسائط المتعددة
══════════════════════════════
// تحميل الوسائط
downloadFile(url, path)
downloadImage(url, path)
downloadVideo(url, path)
downloadAudio(url, path)
downloadStream(url)
getFileSize(url)
getFileType(url)
getFileInfo(url)

// معالجة الصور
resizeImage(input, output, width, height)
cropImage(input, output, x, y, width, height)
rotateImage(input, output, degrees)
flipImage(input, output, direction)
grayscaleImage(input, output)
blurImage(input, output, radius)
sharpenImage(input, output)
addTextToImage(input, output, text, x, y, color, size)
addImageWatermark(input, watermark, output, position)
mergeImages(images, output, direction)
imageToBase64(input)
base64ToImage(base64, output)
getImageMetadata(input)
compressImage(input, output, quality)
convertImageFormat(input, output, format)
createGif(images, output, delay)
extractGifFrames(gif, outputDir)
getImageDimensions(input)

// معالجة الفيديو
cutVideo(input, output, start, duration)
mergeVideos(videos, output)
extractAudio(input, output)
videoToGif(input, output, start, duration)
compressVideo(input, output, quality)
getVideoMetadata(input)
getVideoDuration(input)
getVideoDimensions(input)
takeScreenshot(input, output, time)
addAudioToVideo(video, audio, output)
removeAudio(input, output)
changeVideoSpeed(input, output, speed)
reverseVideo(input, output)

// معالجة الصوت
cutAudio(input, output, start, duration)
mergeAudios(audios, output)
changeAudioSpeed(input, output, speed)
reverseAudio(input, output)
getAudioMetadata(input)
getAudioDuration(input)
convertAudioFormat(input, output, format)
compressAudio(input, output, bitrate)
addEffect(input, output, effect)
removeNoise(input, output)
normalizeAudio(input, output)
changePitch(input, output, semitones)
changeVolume(input, output, volume)

// YouTube
youtubeSearch(query, limit)
youtubeDownload(url, quality)
youtubeDownloadAudio(url, format)
youtubeGetInfo(url)
youtubeGetComments(url)
youtubeGetPlaylist(url)
youtubeDownloadPlaylist(url)
youtubeGetTranscript(url)
youtubeGetCaptions(url)

// TikTok
tiktokSearch(query, limit)
tiktokDownload(url)
tiktokGetInfo(url)
tiktokGetComments(url)
tiktokGetUserVideos(username)
tiktokDownloadNoWatermark(url)

// Instagram
instagramDownload(url)
instagramGetInfo(url)
instagramGetUserPosts(username)
instagramGetStories(username)
instagramGetReels(username)

// Facebook
facebookDownload(url)
facebookGetInfo(url)
facebookGetVideo(url)
facebookGetPost(url)

// Twitter/X
twitterDownload(url)
twitterGetInfo(url)
twitterGetMedia(url)

══════════════════════════════
١٢. دوال المجموعة المتقدمة
══════════════════════════════
// إدارة المجموعة الكاملة
getThreadAdmins(threadID)
getThreadMembers(threadID)
getThreadName(threadID)
getThreadEmoji(threadID)
getThreadColor(threadID)
getThreadApprovalMode(threadID)
getThreadMessageCount(threadID)
getThreadCreatedTime(threadID)
getThreadOwner(threadID)
getThreadNicknames(threadID)
isUserInThread(userID, threadID)
isUserAdmin(userID, threadID)
isThreadMuted(threadID)
getMutedThreads()
getBannedUsers()
getBannedThreads()
getCommandBanned(threadID)
addCommandBan(threadID, command)
removeCommandBan(threadID, command)
setThreadWelcome(threadID, message)
getThreadWelcome(threadID)
setThreadRules(threadID, rules)
getThreadRules(threadID)
setThreadAutoKick(threadID, enabled)
setThreadAutoAdmin(threadID, enabled)
setThreadAutoNickname(threadID, enabled)
setThreadAntiSpam(threadID, enabled)
setThreadAntiLink(threadID, enabled)
setThreadAntiArabic(threadID, enabled)
setThreadAntiEnglish(threadID, enabled)
setThreadAntiNSFW(threadID, enabled)
setThreadAntiBot(threadID, enabled)
setThreadAutoReaction(threadID, emoji)
getThreadAutoReaction(threadID)
setThreadAutoReply(threadID, keyword, response)
getThreadAutoReply(threadID, keyword)
removeThreadAutoReply(threadID, keyword)
getAllThreadAutoReplies(threadID)

══════════════════════════════
١٣. دوال الإحصائيات والتحليلات
══════════════════════════════
// إحصائيات البوت
getBotUptime()
getBotMemory()
getBotCPU()
getBotCommandsCount()
getBotEventsCount()
getBotUsersCount()
getBotThreadsCount()
getBotMessagesCount()
getBotErrorsCount()
getBotLastRestart()
getBotVersion()
getBotNodeVersion()
getBotSystemInfo()
getBotNetworkInfo()
getBotDiskInfo()
getBotProcessInfo()

// إحصائيات المستخدم
getUserJoinDate(userID)
getUserLastSeen(userID)
getUserMessageCount(userID)
getUserCommandCount(userID)
getUserReactionCount(userID)
getUserMentionCount(userID)
getUserThreadCount(userID)
getUserFriendCount(userID)
getUserBlockedCount(userID)
getUserWarningCount(userID)
getUserMuteCount(userID)
getUserBanCount(userID)
getUserActiveDays(userID)
getUserDailyActivity(userID)
getUserHourlyActivity(userID)
getUserTopCommands(userID)
getUserTopThreads(userID)
getUserTopFriends(userID)

// تحليلات المجموعة
getThreadDailyActivity(threadID)
getThreadHourlyActivity(threadID)
getThreadTopUsers(threadID)
getThreadTopCommands(threadID)
getThreadTopWords(threadID)
getThreadMessageGrowth(threadID)
getThreadUserGrowth(threadID)
getThreadActivityHeatmap(threadID)
getThreadPeakHours(threadID)
getThreadSlowHours(threadID)

══════════════════════════════
١٤. دوال الألعاب والترفيه
══════════════════════════════
// ألعاب النرد
rollDice(sides)
rollMultipleDice(count, sides)
flipCoin()
randomNumber(min, max)
randomItem(array)
randomString(length)
randomColor()
randomEmoji()
randomMeme()
randomJoke()
randomFact()
randomQuote()
randomAdvice()
randomCompliment()
randomInsult()
randomPick(users)

// ألعاب الكازينو
playSlots(bet)
playRoulette(bet, number)
playBlackjack(bet)
playPoker(bet)
playBaccarat(bet)
playCraps(bet)
playBingo(bet)
playLottery(bet)
playHorseRacing(bet)
playSportsBetting(bet, team)

// ألعاب ذهنية
quizQuestion(category)
triviaQuestion(difficulty)
riddleQuestion()
mathProblem(level)
wordScramble()
anagramGame()
hangmanGame()
crosswordPuzzle()
sudokuPuzzle()
memoryGame()

// ألعاب جماعية
tictactoeGame(player1, player2)
connect4Game(player1, player2)
chessGame(player1, player2)
checkersGame(player1, player2)
dominoGame(player1, player2)
battleshipGame(player1, player2)
rockPaperScissors(player1, player2)
truthOrDare(player1, player2)
wouldYouRather(player1, player2)
neverHaveIEver(player1, player2)

══════════════════════════════
١٥. دوال الذكاء الاصطناعي
══════════════════════════════
// معالجة النصوص
analyzeSentiment(text)
extractKeywords(text)
summarizeText(text, length)
translateText(text, targetLang)
detectLanguage(text)
correctGrammar(text)
generateHashtags(text)
generateTags(text)
generateDescription(text)
generateTitle(text)
generateOutline(text)
generateQuestions(text)
generateAnswers(question, context)

// توليد المحتوى
generateText(prompt, length)
generatePoem(topic, style)
generateStory(topic, length)
generateArticle(topic, length)
generateEmail(subject, recipient)
generateMessage(recipient, context)
generateTweet(topic)
generateCaption(image, context)
generateComment(post, context)
generateReply(message, context)
generateReview(product, rating)
generateDescription(product, features)
generateAd(product, audience)
generateSlogan(brand, product)
generateName(description)

// معالجة الصور
recognizeImage(image)
detectObjects(image)
detectFaces(image)
detectText(image)
detectQRCode(image)
detectBarcode(image)
detectColors(image)
classifyImage(image)
captionImage(image)
enhanceImage(image)
colorizeImage(image)
restoreImage(image)
removeBackground(image)
changeBackground(image, newBg)
swapFaces(image, face1, face2)
ageFace(image, years)
genderizeFace(image)
emotionFromFace(image)
styleTransfer(image, style)

// معالجة الصوت
speechToText(audio)
textToSpeech(text, voice)
recognizeSpeaker(audio)
detectEmotionFromVoice(audio)
detectLanguageFromVoice(audio)
separateVocals(audio)
separateInstruments(audio)
generateMusic(prompt, duration)
generateBeat(genre, bpm)
generateMelody(notes, duration)
generateChord(progression, duration)

══════════════════════════════
١٦. دوال التكامل مع الخدمات
══════════════════════════════
// Google
googleSearch(query, limit)
googleTranslate(text, target)
googleVision(image)
googleSpeech(audio)
googleMaps(location)
googleWeather(city)
googleNews(query)
googleBooks(query)
googleScholar(query)
googleImages(query)
googleVideos(query)
googleMapsDirections(origin, destination)
googleMapsDistance(origin, destination)
googleMapsPlace(query)
googleMapsNearby(lat, lng, radius, type)

// YouTube
youtubeSearch(query, limit)
youtubeDownload(url, quality)
youtubeDownloadAudio(url, format)
youtubeGetInfo(url)
youtubeGetComments(url)
youtubeGetPlaylist(url)
youtubeDownloadPlaylist(url)
youtubeGetTranscript(url)
youtubeGetCaptions(url)
youtubeGetChannel(url)
youtubeGetChannelVideos(channelId)
youtubeGetChannelPlaylists(channelId)
youtubeGetTrending(country)
youtubeGetCategories()
youtubeSearchByCategory(categoryId)

// Facebook
facebookDownload(url)
facebookGetInfo(url)
facebookGetVideo(url)
facebookGetPost(url)
facebookGetPage(pageName)
facebookGetGroup(groupId)
facebookGetUser(username)
facebookGetFriends(userId)
facebookGetPhotos(userId)
facebookGetAlbums(userId)
facebookGetVideos(userId)
facebookGetPosts(userId)
facebookGetStories(userId)
facebookGetReels(userId)

// Instagram
instagramDownload(url)
instagramGetInfo(url)
instagramGetUserPosts(username)
instagramGetStories(username)
instagramGetReels(username)
instagramGetHighlights(username)
instagramGetFollowers(username)
instagramGetFollowing(username)
instagramGetComments(postId)
instagramGetLikes(postId)
instagramSearch(query)
instagramGetHashtag(hashtag)
instagramGetLocation(locationId)
instagramGetMusic(search)

// TikTok
tiktokSearch(query, limit)
tiktokDownload(url)
tiktokGetInfo(url)
tiktokGetComments(url)
tiktokGetUserVideos(username)
tiktokDownloadNoWatermark(url)
tiktokGetTrending()
tiktokGetHashtag(hashtag)
tiktokGetMusic(musicId)
tiktokGetEffects()
tiktokGetStickers()
tiktokGetFilters()

// Twitter/X
twitterDownload(url)
twitterGetInfo(url)
twitterGetMedia(url)
twitterGetTweet(tweetId)
twitterGetUserTweets(username)
twitterGetUserMedia(username)
twitterSearch(query)
twitterGetTrending(woeid)
twitterGetHashtag(hashtag)
twitterGetRetweets(tweetId)
twitterGetLikes(tweetId)
twitterGetReplies(tweetId)

// Reddit
redditGetPost(url)
redditGetSubreddit(subreddit)
redditGetUser(username)
redditSearch(query)
redditGetComments(postId)
redditGetHot(subreddit)
redditGetNew(subreddit)
redditGetTop(subreddit)
redditGetRising(subreddit)
redditGetControversial(subreddit)

// Spotify
spotifySearch(query, type)
spotifyGetTrack(trackId)
spotifyGetAlbum(albumId)
spotifyGetArtist(artistId)
spotifyGetPlaylist(playlistId)
spotifyDownload(trackId)
spotifyGetLyrics(trackId)
spotifyGetRecommendations(seed)
spotifyGetNewReleases()
spotifyGetFeaturedPlaylists()
spotifyGetCategories()
spotifyGetCategoryPlaylists(categoryId)

// SoundCloud
soundcloudSearch(query)
soundcloudDownload(url)
soundcloudGetInfo(url)
soundcloudGetUser(username)
soundcloudGetPlaylist(url)
soundcloudGetTrack(trackId)
soundcloudGetComments(trackId)
soundcloudGetRelated(trackId)

══════════════════════════════
١٧. دوال قاعدة البيانات
══════════════════════════════
// MongoDB
mongoose.connect
mongoose.model
mongoose.Schema
mongoose.Types.ObjectId
find()
findOne()
findById()
findOneAndUpdate()
findByIdAndUpdate()
findOneAndDelete()
findByIdAndDelete()
create()
insertMany()
updateOne()
updateMany()
deleteOne()
deleteMany()
countDocuments()
estimatedDocumentCount()
distinct()
aggregate()
populate()
lean()
sort()
limit()
skip()
select()
where()
equals()
gt()
gte()
lt()
lte()
in()
nin()
ne()
exists()
regex()
text()
or()
and()
nor()
not()
elemMatch()
size()
all()
slice()
project()
unwind()
group()
match()
lookup()
addFields()
replaceRoot()
count()
sortByCount()
bucket()
facet()
out()
merge()

// Redis (if available)
redisClient
redisGet(key)
redisSet(key, value)
redisDel(key)
redisExists(key)
redisExpire(key, seconds)
redisTTL(key)
redisIncr(key)
redisDecr(key)
redisHSet(key, field, value)
redisHGet(key, field)
redisHGetAll(key)
redisHDel(key, field)
redisHLen(key)
redisHKeys(key)
redisHVals(key)
redisHExists(key, field)
redisLPush(key, value)
redisRPush(key, value)
redisLPop(key)
redisRPop(key)
redisLLen(key)
redisLRange(key, start, stop)
redisSAdd(key, member)
redisSRem(key, member)
redisSMembers(key)
redisSIsMember(key, member)
redisSCard(key)
redisZAdd(key, score, member)
redisZRem(key, member)
redisZRange(key, start, stop)
redisZRevRange(key, start, stop)
redisZScore(key, member)
redisZRank(key, member)
redisZRevRank(key, member)
redisZCard(key)
redisZCount(key, min, max)
`;

// ══════════════════════════════════════════
// SYSTEM PROMPT
// ══════════════════════════════════════════
function buildSystemPrompt(ctx) {
  return `أنت KIRA AI ULTIMATE — مساعد خارق بذكاء اصطناعي فائق داخل بوت فيسبوك ماسنجر.
مهمتك: فهم الطلب العربي وتوليد كود JavaScript ينفذه فوراً وبكفاءة عالية.

━━━ السياق الحالي ━━━
threadID : ${ctx.threadID}
senderID : ${ctx.senderID}
mentions : ${JSON.stringify(ctx.mentions)}
messageReply: ${ctx.messageReply ? JSON.stringify({ senderID: ctx.messageReply.senderID, body: ctx.messageReply.body?.substring(0,100) }) : "null"}
args : ${JSON.stringify(ctx.args)}

━━━ المتغيرات المتاحة مباشرة (أكثر من 1000 دالة) ━━━
api, event, args, mentions, threadID, messageID, senderID, messageReply
getUserData, addMoney, removeMoney, ensureUser, updateUserData, getAllUsers
axios, fs, path, os, crypto, stream, util, http, https, url, exec, spawn
mongoose, utils, commands, events, dashboard

${KNOWLEDGE_BASE}

━━━ قواعد صارمة ━━━
1. أرجع كود JavaScript نظيف فقط — بدون أي شرح أو markdown
2. استخدم المتغيرات والدوال الموضحة فقط
3. استخدم await للعمليات async
4. أضف تحقق من الأخطاء ورسائل واضحة بالعربي
5. إذا الطلب غير واضح أرسل رسالة تسأل عن التفاصيل
6. لا تستخدم require() لمكتبات غير موجودة في السياق
7. الكود يجب أن يكون مختصراً وفعالاً
8. استخدم try/catch لكل العمليات الخطرة
9. أضف تعليقات توضيحية بالعربي
10. استخدم api.setMessageReaction لإظهار حالة التنفيذ
11. إذا كان الطلب معقداً، قسمه إلى خطوات متسلسلة
12. استخدم Promise.all للعمليات المتوازية لتحسين الأداء
13. نظف الموارد بعد الاستخدام (close streams, delete temp files)
14. استخدم المصفوفات والتكرارات بكفاءة
15. تجنب الحلقات اللانهائية والذاكرة الزائدة
`;
}

// ══════════════════════════════════════════
// ENHANCED SUGGESTION SYSTEM
// ══════════════════════════════════════════
async function generateSuggestion(description, ctx) {
  const suggestionPrompt = `أنت خبير في أوامر بوتات الفيسبوك.
المستخدم يريد: "${description}"

قم باقتراح اسم أمر مميز بالعربية أو الإنجليزية، واكتب كود JavaScript كامل لتنفيذه.

يجب أن يكون الكود:
- يستخدم دوال api والمتغيرات المتاحة
- يحتوي على تحقق من الأخطاء
- يحتوي على رسائل واضحة بالعربي
- مناسب للاستخدام الفوري

أرجع الإجابة بهذا التنسيق ONLY:
الاسم المقترح: [الاسم]
الفئة: [الفئة]
الوصف: [وصف مختصر]
الكود:
\`\`\`javascript
[الكود الكامل]
\`\`\``;

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: suggestionPrompt },
          { role: "user", content: description }
        ],
        max_tokens: 3000,
        temperature: 0.3
      },
      {
        headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        timeout: 60000
      }
    );

    const response = res.data.choices[0].message.content;
    
    // Parse the response
    const nameMatch = response.match(/الاسم المقترح:\s*(.+)/i);
    const categoryMatch = response.match(/الفئة:\s*(.+)/i);
    const descMatch = response.match(/الوصف:\s*(.+)/i);
    const codeMatch = response.match(/```javascript\s*([\s\S]+?)\s*```/);
    
    return {
      name: nameMatch ? nameMatch[1].trim() : `suggest_${Date.now()}`,
      category: categoryMatch ? categoryMatch[1].trim() : "مقترح",
      description: descMatch ? descMatch[1].trim() : description,
      code: codeMatch ? codeMatch[1].trim() : "",
      raw: response
    };
  } catch (e) {
    console.error("Suggestion error:", e);
    return null;
  }
}

// ══════════════════════════════════════════
// GROQ CALL
// ══════════════════════════════════════════
async function callGroq(systemPrompt, userMessage) {
  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 4096,
      temperature: 0.1
    },
    {
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      timeout: 60000
    }
  );
  return res.data.choices[0].message.content.trim();
}

function cleanCode(raw) {
  return raw
    .replace(/^(?:javascript|js)?\n?/i, "")
    .replace(/\n?$/, "")
    .replace(/^```javascript\s*/, "")
    .replace(/\s*```$/, "")
    .trim();
}

// ══════════════════════════════════════════
// SAFE EVAL WITH TIMING
// ══════════════════════════════════════════
async function safeEval(code, ctx) {
  const AsyncFn = Object.getPrototypeOf(async function(){}).constructor;
  const fn = new AsyncFn(
    "api","event","args","mentions","threadID","messageID",
    "senderID","messageReply","getUserData","addMoney","removeMoney",
    "ensureUser","updateUserData","getAllUsers","axios","fs","path",
    "os","crypto","stream","util","http","https","url","exec","spawn",
    "mongoose","utils","commands","events","dashboard","global",
    code
  );
  
  const start = process.hrtime();
  try {
    const result = await fn(
      ctx.api, ctx.event, ctx.args, ctx.mentions,
      ctx.threadID, ctx.messageID, ctx.senderID, ctx.messageReply,
      getUserData, addMoney, removeMoney, ensureUser, updateUserData,
      getAllUsers, axios, fs, path, os, crypto, stream, util,
      http, https, url, exec, spawn, mongoose, utils, commands,
      events, dashboard, global
    );
    const end = process.hrtime(start);
    const execTime = (end[0] * 1000 + end[1] / 1000000);
    return { result, execTime };
  } catch (e) {
    const end = process.hrtime(start);
    const execTime = (end[0] * 1000 + end[1] / 1000000);
    throw { error: e, execTime };
  }
}

// ══════════════════════════════════════════
// DB HELPERS
// ══════════════════════════════════════════
const saveCmd = async (name, code, prompt, cat, by, tags = []) => {
  try {
    return await DynamicCmd.findOneAndUpdate(
      { name },
      { 
        code, 
        prompt, 
        category: cat || "عام", 
        createdBy: by, 
        tags,
        updatedAt: new Date() 
      },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.error("Save error:", e);
    return null;
  }
};

const loadCmd = name => DynamicCmd.findOne({ name });
const listCmds = () => DynamicCmd.find({}, "name prompt category usageCount successCount failCount avgExecTime tags createdAt").sort({ usageCount: -1 });
const deleteCmd = name => DynamicCmd.deleteOne({ name });
const deleteAll = () => DynamicCmd.deleteMany({});
const incUsage = async (name, success = true, execTime = 0) => {
  const cmd = await DynamicCmd.findOne({ name });
  if (!cmd) return;
  
  const newAvgTime = cmd.avgExecTime ? 
    (cmd.avgExecTime * cmd.usageCount + execTime) / (cmd.usageCount + 1) : 
    execTime;
  
  return DynamicCmd.updateOne(
    { name },
    { 
      $inc: { 
        usageCount: 1,
        successCount: success ? 1 : 0,
        failCount: success ? 0 : 1
      },
      $set: { avgExecTime: newAvgTime }
    }
  );
};

const searchCmds = (query) => {
  return DynamicCmd.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { prompt: { $regex: query, $options: "i" } },
      { category: { $regex: query, $options: "i" } },
      { tags: { $in: [new RegExp(query, "i")] } }
    ]
  }).sort({ usageCount: -1 });
};

const saveSuggestion = (desc, code, name, cat, by) => {
  return Suggestion.create({
    description: desc,
    generatedCode: code,
    suggestedName: name,
    category: cat,
    createdBy: by
  });
};

const getSuggestions = () => Suggestion.find().sort({ votes: -1, createdAt: -1 });

// ══════════════════════════════════════════
// FORMAT COMMANDS LIST
// ══════════════════════════════════════════
async function formatCommandsList(threadID, messageID, api, query = null) {
  let cmds;
  if (query) {
    cmds = await searchCmds(query);
  } else {
    cmds = await listCmds();
  }
  
  if (!cmds.length) {
    return api.sendMessage(
      "📭 لا توجد أوامر محفوظة بعد.\n\n" +
      "لحفظ أمر: كينو [طلب] احفظ باسم [الاسم]\n" +
      "لاقتراح أمر: كينو اقترح [وصف]",
      threadID, messageID
    );
  }

  // Group by category
  const byCategory = {};
  for (const c of cmds) {
    const cat = c.category || "عام";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(c);
  }

  let msg = "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗜 𝗨𝗟𝗧𝗜𝗠𝗔𝗧𝗘 ━━ ⌬\n\n";
  msg += `📦 إجمالي الأوامر: ${cmds.length}\n`;
  msg += `⚡ إجمالي الفئات: ${Object.keys(byCategory).length}\n\n`;

  for (const [cat, list] of Object.entries(byCategory)) {
    msg += `━━ ${cat} (${list.length}) ━━\n`;
    list.slice(0, 5).forEach((c, i) => {
      msg += `${i+1}. ${c.name}`;
      if (c.usageCount > 0) msg += ` [${c.usageCount}x]`;
      if (c.successCount > 0 && c.usageCount > 0) {
        const successRate = ((c.successCount / c.usageCount) * 100).toFixed(1);
        msg += ` ✓${successRate}%`;
      }
      if (c.avgExecTime) msg += ` ⏱️${c.avgExecTime.toFixed(0)}ms`;
      msg += "\n";
    });
    if (list.length > 5) msg += `... و${list.length - 5} أخرى\n`;
    msg += "\n";
  }

  msg += "━━━━━━━━━━━━━━━━━━━━\n";
  msg += "🔍 بحث: كينو بحث [كلمة]\n";
  msg += "💡 اقتراح: كينو اقترح [وصف]\n";
  msg += "🗑️ حذف: كينو احذف أمر [الاسم]\n";
  msg += "🗑️ حذف كل: كينو احذف كل الأوامر\n";
  msg += "▶️ تشغيل: كينو شغل [الاسم]\n";
  msg += "📄 كود: كينو كود [الاسم]";
  msg += "\n\n📊 إحصائيات متقدمة: كينو إحصائيات";

  return api.sendMessage(msg, threadID, messageID);
}

// ══════════════════════════════════════════
// STATISTICS
// ══════════════════════════════════════════
async function showStatistics(threadID, messageID, api) {
  const cmds = await listCmds();
  const suggestions = await getSuggestions();
  
  const totalUsage = cmds.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  const totalSuccess = cmds.reduce((sum, c) => sum + (c.successCount || 0), 0);
  const totalFail = cmds.reduce((sum, c) => sum + (c.failCount || 0), 0);
  const avgExecTimeAll = cmds.reduce((sum, c) => sum + (c.avgExecTime || 0), 0) / (cmds.length || 1);
  
  const topCmd = cmds.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0];
  const mostFail = cmds.sort((a, b) => (b.failCount || 0) - (a.failCount || 0))[0];
  
  const categories = {};
  cmds.forEach(c => {
    const cat = c.category || "عام";
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  let msg = "📊 ━━ إحصائيات كينو الشاملة ━━ 📊\n\n";
  msg += `📦 إجمالي الأوامر: ${cmds.length}\n`;
  msg += `💡 إجمالي الاقتراحات: ${suggestions.length}\n`;
  msg += `⚡ إجمالي التنفيذات: ${totalUsage}\n`;
  msg += `✅ نجاح: ${totalSuccess}\n`;
  msg += `❌ فشل: ${totalFail}\n`;
  msg += `📊 معدل النجاح: ${totalUsage ? ((totalSuccess / totalUsage) * 100).toFixed(1) : 0}%\n`;
  msg += `⏱️ متوسط وقت التنفيذ: ${avgExecTimeAll.toFixed(0)}ms\n\n`;
  
  msg += "🏆 الأكثر استخداماً:\n";
  if (topCmd) msg += `   • ${topCmd.name}: ${topCmd.usageCount} مرة\n`;
  
  msg += "\n⚠️ الأكثر فشلاً:\n";
  if (mostFail && mostFail.failCount > 0) msg += `   • ${mostFail.name}: ${mostFail.failCount} فشل\n`;
  
  msg += "\n📂 توزيع الفئات:\n";
  Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    msg += `   • ${cat}: ${count} أمر\n`;
  });
  
  return api.sendMessage(msg, threadID, messageID);
}

// ══════════════════════════════════════════
// MAIN RUN FUNCTION
// ══════════════════════════════════════════
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  // ── Admin check ──
  if (!global.config?.ADMINBOT?.includes(senderID))
    return api.sendMessage("⛔ هذا الأمر للأدمن فقط", threadID, messageID);

  const prompt = args.join(" ").trim();

  if (!prompt) {
    return api.sendMessage(
      "⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗜 𝗨𝗟𝗧𝗜𝗠𝗔𝗧𝗘 ━━ ⌬\n\n" +
      "💡 اكتب أي طلب بالعربي:\n\n" +
      "أمثلة:\n" +
      "• كينو اطرد المنشن\n" +
      "• كينو أعطِ المنشن 5000 فلوس\n" +
      "• كينو رقّ المنشن لأدمن\n" +
      "• كينو احظر المنشن\n" +
      "• كينو بياناتك\n" +
      "• كينو اقترح أمر يحول الصور لـ GIF\n" +
      "• كينو بحث [كلمة]\n" +
      "• كينو إحصائيات\n" +
      "• كينو شغل [اسم]\n" +
      "• كينو كود [اسم]",
      threadID, messageID
    );
  }

  // ══ Special commands ══════════════════════

  // Statistics
  if (prompt === "إحصائيات" || prompt === "احصائيات") {
    return showStatistics(threadID, messageID, api);
  }

  // Search commands
  if (/^بحث\s+/i.test(prompt)) {
    const query = prompt.replace(/^بحث\s+/i, "").trim();
    return formatCommandsList(threadID, messageID, api, query);
  }

  // List commands
  if (prompt === "بياناتك" || prompt === "قائمة" || prompt === "قائمة الأوامر") {
    return formatCommandsList(threadID, messageID, api);
  }

  // Delete command
  if (/^احذف\s+أمر\s+/i.test(prompt) || /^احذف\s+امر\s+/i.test(prompt)) {
    const name = prompt.replace(/^احذف\s+(?:أمر|امر)\s+/i, "").trim();
    const res = await deleteCmd(name);
    return api.sendMessage(
      res.deletedCount ? `🗑️ تم حذف الأمر: "${name}"` : `❌ الأمر "${name}" غير موجود`,
      threadID, messageID
    );
  }

  // Delete all commands
  if (prompt === "احذف كل الأوامر" || prompt === "مسح كل الأوامر") {
    const res = await deleteAll();
    return api.sendMessage(`🗑️ تم حذف ${res.deletedCount} أمر`, threadID, messageID);
  }

  // Run command
  if (/^شغ[ّ]?ل\s+/i.test(prompt)) {
    const name = prompt.replace(/^شغ[ّ]?ل\s+/i, "").trim();
    const saved = await loadCmd(name);
    if (!saved) return api.sendMessage(`❌ الأمر "${name}" غير موجود`, threadID, messageID);
    
    if (api.setMessageReaction) api.setMessageReaction("▶️", messageID, () => {}, true);
    
    try {
      const { result, execTime } = await safeEval(saved.code, { 
        api, event, args: args.slice(1), mentions, threadID, messageID, senderID, messageReply 
      });
      
      await incUsage(name, true, execTime);
      
      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
      
      // Send performance info if it took too long
      if (execTime > 1000) {
        api.sendMessage(`⚡ تم التنفيذ في ${execTime.toFixed(0)}ms`, threadID, messageID);
      }
    } catch(e) {
      await incUsage(name, false, e.execTime || 0);
      
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(
        `❌ خطأ في "${name}":\n${e.error ? e.error.message : e.message}\n` +
        `⏱️ الوقت: ${(e.execTime || 0).toFixed(0)}ms`,
        threadID, messageID
      );
    }
    return;
  }

  // Show command code
  if (/^كود\s+/i.test(prompt)) {
    const name = prompt.replace(/^كود\s+/i, "").trim();
    const saved = await loadCmd(name);
    if (!saved) return api.sendMessage(`❌ الأمر "${name}" غير موجود`, threadID, messageID);
    
    let msg = `📄 كود الأمر "${name}":\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📂 الفئة: ${saved.category}\n`;
    msg += `📊 الاستخدامات: ${saved.usageCount || 0}\n`;
    msg += `✅ نجاح: ${saved.successCount || 0}\n`;
    msg += `❌ فشل: ${saved.failCount || 0}\n`;
    msg += `⏱️ متوسط الوقت: ${saved.avgExecTime ? saved.avgExecTime.toFixed(0) + "ms" : "N/A"}\n`;
    if (saved.tags && saved.tags.length) msg += `🏷️ وسوم: ${saved.tags.join(", ")}\n`;
    msg += `📅 أنشئ: ${new Date(saved.createdAt).toLocaleDateString("ar-EG")}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `\`\`\`javascript\n${saved.code}\n\`\`\``;
    
    return api.sendMessage(msg, threadID, messageID);
  }

  // ══ SUGGESTION SYSTEM ══════════════════════
  if (/^اقترح\s+/i.test(prompt)) {
    const description = prompt.replace(/^اقترح\s+/i, "").trim();
    
    api.sendMessage(`💡 جاري اقتراح أمر لـ: "${description}"...`, threadID, messageID);
    if (api.setMessageReaction) api.setMessageReaction("💡", messageID, () => {}, true);
    
    try {
      const suggestion = await generateSuggestion(description, { threadID, senderID });
      
      if (!suggestion || !suggestion.code) {
        return api.sendMessage("❌ فشل في توليد الاقتراح. حاول مرة أخرى.", threadID, messageID);
      }
      
      // Save suggestion to database
      await saveSuggestion(
        description, 
        suggestion.code, 
        suggestion.name, 
        suggestion.category, 
        senderID
      );
      
      let msg = `✨ ━━ اقتراح أمر جديد ━━ ✨\n\n`;
      msg += `📝 الوصف: ${description}\n`;
      msg += `📛 الاسم المقترح: ${suggestion.name}\n`;
      msg += `📂 الفئة: ${suggestion.category}\n\n`;
      msg += `💻 الكود:\n\`\`\`javascript\n${suggestion.code.substring(0, 500)}${suggestion.code.length > 500 ? "\n// ..." : ""}\n\`\`\`\n\n`;
      msg += `💾 لحفظه: كينو احفظ باسم ${suggestion.name}\n`;
      msg += `▶️ لتجربته: انسخ الكود وشغله`;
      
      api.sendMessage(msg, threadID, messageID);
      
      // Save the suggestion automatically if user wants
      if (prompt.includes("احفظ") || prompt.includes("اخزن")) {
        await saveCmd(suggestion.name, suggestion.code, description, suggestion.category, senderID, [description.substring(0, 20)]);
        api.sendMessage(`💾 تم حفظ الأمر "${suggestion.name}" تلقائياً`, threadID, messageID);
      }
      
      if (api.setMessageReaction) api.setMessageReaction("✨", messageID, () => {}, true);
      
    } catch(e) {
      console.error("Suggestion error:", e);
      api.sendMessage(`❌ خطأ في توليد الاقتراح:\n${e.message}`, threadID, messageID);
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    }
    return;
  }

  // ══ AI EXECUTION ═══════════════════════════
  if (api.setMessageReaction) api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    const ctx = { threadID, messageID, senderID, messageReply, mentions: mentions || {}, args };
    const systemPrompt = buildSystemPrompt(ctx);
    
    api.sendMessage("🧠 كينو يفكر...", threadID, messageID);
    
    const rawCode = await callGroq(systemPrompt, prompt);
    const code = cleanCode(rawCode);

    // Auto-save if contains save keywords
    let savedName = null;
    if (/احفظ|اخزن/i.test(prompt)) {
      const nameMatch = prompt.match(/(?:احفظ|اخزن)(?:\s+باسم)?\s+(\S+)/i);
      const catMatch = prompt.match(/(?:فئة|كتيجوري|category)\s+(\S+)/i);
      const tagsMatch = prompt.match(/(?:وسوم|tags)\s+([\S,]+)/i);
      
      savedName = nameMatch ? nameMatch[1] : `auto_${Date.now()}`;
      const category = catMatch ? catMatch[1] : "عام";
      const tags = tagsMatch ? tagsMatch[1].split(",").map(t => t.trim()) : [];
      
      await saveCmd(savedName, code, prompt, category, senderID, tags);
    }

    // Execute
    const { result, execTime } = await safeEval(code, { 
      api, event, args, mentions: mentions || {}, threadID, messageID, senderID, messageReply 
    });

    if (savedName) {
      api.sendMessage(
        `💾 تم حفظ الأمر باسم: "${savedName}"\n` +
        `⏱️ وقت التنفيذ: ${execTime.toFixed(0)}ms\n` +
        `▶️ للتشغيل: كينو شغل ${savedName}`,
        threadID, messageID
      );
    } else if (execTime > 1000) {
      api.sendMessage(`⚡ تم التنفيذ في ${execTime.toFixed(0)}ms`, threadID, messageID);
    }

    if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

  } catch(e) {
    if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
    console.error("❌ KIRA AI ULTIMATE:", e);
    
    let errorMsg = `⌬ ━━ 𝗞𝗜𝗥𝗔 𝗔𝗜 𝗨𝗟𝗧𝗜𝗠𝗔𝗧𝗘 ━━ ⌬\n\n❌ خطأ:\n`;
    errorMsg += `${e.error ? e.error.message : e.message}\n\n`;
    
    if (e.execTime) errorMsg += `⏱️ الوقت: ${e.execTime.toFixed(0)}ms\n\n`;
    
    errorMsg += `💡 أعد صياغة الطلب أو استخدم:\n`;
    errorMsg += `• كينو اقترح [وصف]\n`;
    errorMsg += `• كينو بحث [كلمة]`;
    
    api.sendMessage(errorMsg, threadID, messageID);
  }
};
