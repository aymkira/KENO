module.exports.config = {
  name: "زوجيني",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "عمر",
  description: "زواج من حد عشوائي",
  commandCategory: "ترفية",
  usages: " ",
  cooldowns: 0,
  dependencies: {}
};

module.exports.run = async function({ api, event, Users, Currencies }) {
    const axios = global.nodemodule["axios"];
    const fs = global.nodemodule["fs-extra"];
    var TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
    var data = await Currencies.getData(event.senderID);
    var money = data.money;

    if (money < 0) {
        api.sendMessage(`ماعندك مهر امشي اعمل وتعال 🐸🍷`, event.threadID, event.messageID);
    } else {
        var tile = Math.floor(Math.random() * 101);
        
        var participants = event.participantIDs;
        var id = participants[Math.floor(Math.random() * participants.length)];

        var senderData = await Users.getData(event.senderID);
        var senderName = senderData.name;
        var userData = await Users.getData(id);
        var userName = userData.name;

        var arraytag = [];
        arraytag.push({ id: event.senderID, tag: senderName });
        arraytag.push({ id: id, tag: userName });
        
        Currencies.setData(event.senderID, { money: money - 0 });
        
        let Avatar = (await axios.get( `https://graph.facebook.com/${id}/picture?height=720&width=720&access_token=${TOKEN}`, { responseType: "arraybuffer" } )).data; 
        fs.writeFileSync(__dirname + "/cache/1.png", Buffer.from(Avatar, "utf-8"));
        let Avatar2 = (await axios.get( `https://graph.facebook.com/${event.senderID}/picture?height=720&width=720&access_token=${TOKEN}`, { responseType: "arraybuffer" } )).data;
        fs.writeFileSync(__dirname + "/cache/2.png", Buffer.from(Avatar2, "utf-8"));
        
        var imglove = [];
        imglove.push(fs.createReadStream(__dirname + "/cache/1.png"));
        imglove.push(fs.createReadStream(__dirname + "/cache/2.png"));
        
        var msg = { body: `عندنا زوجان هنا 😌🍷 \nنسبة الرومنسية: ${tile}%\n` + senderName + " " + "💓" + " " + userName, mentions: arraytag, attachment: imglove };
        return api.sendMessage(msg, event.threadID, event.messageID);
    }
          }
