const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "اوامر",
    version: "2.5",
    hasPermssion: 0,
    credits: "SOMI",
    description: "قائمة فئات مزخرفة مع زر رجوع داخل كل فئة وعدد الأوامر لكل فئة",
    usages: "",
    commandCategory: "عام",
    cooldowns: 3,
  },

  run: async function ({ api, event }) {
    const mainImage = "https://i.ibb.co/fdS38MQH/OCba-VM35kg.jpg";

    const mainMenu = `
╭━━━━• 𝑺𝑶𝑴𝑰 •━━━━╮
✨ أهلاً بك في قائمة الفئات ✨
اختر رقم الفئة ليتم عرض أوامرها:

1 ⟢ فئة الترفيه  
2 ⟢ فئة الذكاء والصور  
3 ⟢ فئة الإدارة والأنظمة  
4 ⟢ فئة الألعاب  
5 ⟢ فئة المتفرقات  
╰━━━━━━━━━━━━━━━━╯
    `;

    const imgPath = path.join(__dirname, "main.jpg");
    const response = await axios.get(mainImage, { responseType: "stream" });
    const writer = fs.createWriteStream(imgPath);
    response.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage(
        {
          body: mainMenu,
          attachment: fs.createReadStream(imgPath),
        },
        event.threadID,
        (err, info) => {
          if (!err)
            global.client.handleReply.push({
              name: module.exports.config.name,
              messageID: info.messageID,
              type: "menu",
            });
          fs.unlinkSync(imgPath);
        }
      );
    });
  },

  handleReply: async function ({ api, event, handleReply }) {
    const choose = event.body.trim();

    if (choose === "0") {
      return module.exports.run({ api, event });
    }

    const images = {
      1: "https://i.ibb.co/fdS38MQH/OCba-VM35kg.jpg",
      2: "https://i.ibb.co/Qv87tM1N/gr-Wzo0-Ff-XU.jpg",
      3: "https://i.ibb.co/JwH9DyCS/ZLoch28rmb.jpg",
      4: "https://i.ibb.co/HTNgWSsm/by-YDZem-XTh.jpg",
      5: "https://i.ibb.co/fdS38MQH/OCba-VM35kg.jpg",
    };

    const commands = [
      "تخيلي","مغادرةالكل","سلاحي","اطرديني","ترامب","مستوى","اكشن","هدية","شخصية","كت","كنية","لوخيروك","اقتباسات","اذكار",
      "باند","كهف","احسب","adc","سرقة","موتي","دراما","فيس","جزاء","رفع","غموض","هكر","اوامر","تيد","ترحيب","مقص","كابوي",
      "فريند","لاست","تاريخ","كلمات","زوجيني","مستذئب","مي","ميسي","رصيدي","افلام","فلم","رياضيات","انترو","لوكو","اخرجي",
      "تحويل","زومبي","لفل","الرانك","الطلبات","رست","لقب","قولي","رعب","سكرين","ارسل","اخطار","مسلسلات","نقاط","زيادة","نيم",
      "جافا","اضف","مراهنة2","الفا","ثريد","طوكيو","توب","ترجمه","حذف","ابتايم","يوزر","مطلوب","طقس","اكتبي","زخرفة2","زخرفة3",
      "زخرفة","eval","طلب","ذكي","شخصيتي","حماية","ارسم","اصفعي","لوغو","ضيفني","اعلام","اكس_او","المارد","رابط","انضمام","انمي",
      "خلفية","ايدي","ايموجي","بادئة","برجي","برومبت","قبلة","بنك","تجميع","تحدي","الكنز","تحديث","فلوكس","تفكيك","إحصائيات",
      "تقييد","جاسوس","جودة","الاسرع","حزوره","حضن","اسم-المجموعه","خمن","دالي","ذكاء","سمسمي","زواج","منع_السب","منع_السبام",
      "بروفايل","سجن","سومي","شنق","صراحة","صفع","صوت","صور","طرد","عكس","عمل","عناق","عواصم","فيديو","فيزا","قبر","قص",
      "مانهوا","الkحبة","مجموعتي","هوية","مغامره","فحص","ميدجورني","نكته","معاني","احم","المطور","تخيل","سكوت","سمعني","نضام"
    ];

    const chunkSize = Math.ceil(commands.length / 5);
    const chunkedCommands = [
      commands.slice(0, chunkSize),
      commands.slice(chunkSize, chunkSize*2),
      commands.slice(chunkSize*2, chunkSize*3),
      commands.slice(chunkSize*3, chunkSize*4),
      commands.slice(chunkSize*4)
    ];

    function formatCommands(arr) {
      let formatted = "";
      for (let i = 0; i < arr.length; i += 10) {
        formatted += arr.slice(i, i+10).join(" – ") + "\n";
      }
      return formatted;
    }

    const data = {
      1: `✨ فئة الترفيه ✨ (عدد الأوامر: ${chunkedCommands[0].length})\n${formatCommands(chunkedCommands[0])}\n0 ⟢ رجوع للقائمة الرئيسية`,
      2: `🎨 فئة الذكاء والصور 🎨 (عدد الأوامر: ${chunkedCommands[1].length})\n${formatCommands(chunkedCommands[1])}\n0 ⟢ رجوع للقائمة الرئيسية`,
      3: `🛡️ فئة الإدارة والأنظمة 🛡️ (عدد الأوامر: ${chunkedCommands[2].length})\n${formatCommands(chunkedCommands[2])}\n0 ⟢ رجوع للقائمة الرئيسية`,
      4: `🎮 فئة الألعاب 🎮 (عدد الأوامر: ${chunkedCommands[3].length})\n${formatCommands(chunkedCommands[3])}\n0 ⟢ رجوع للقائمة الرئيسية`,
      5: `📚 فئة المتفرقات 📚 (عدد الأوامر: ${chunkedCommands[4].length})\n${formatCommands(chunkedCommands[4])}\n0 ⟢ رجوع للقائمة الرئيسية`
    };

    if (!images[choose])
      return api.sendMessage("❌ اختر رقم من 1 إلى 5 فقط.", event.threadID);

    const img = images[choose];
    const text = data[choose];

    const imgPath = path.join(__dirname, `cat${choose}.jpg`);
    const response = await axios.get(img, { responseType: "stream" });
    const writer = fs.createWriteStream(imgPath);
    response.data.pipe(writer);

    writer.on("finish", () => {
      api.unsendMessage(handleReply.messageID);

      api.sendMessage(
        {
          body: text,
          attachment: fs.createReadStream(imgPath),
        },
        event.threadID,
        () => fs.unlinkSync(imgPath)
      );
    });
  },
};
