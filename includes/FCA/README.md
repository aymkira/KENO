Here is a redesigned version of your `README.md` for the Facebook Chat API with an exclusive look, admin link at the top, and suggestions for icons and SVGs to enhance its appearance:

---

# **Hutchin-chat-api** ![Facebook](https://img.icons8.com/ios-filled/50/000000/facebook-new.png)

A new Facebook Chat API for bots and automation! and some changes update code hehe.🚀

🔗 **[Admin: Jonell Magallanes](https://www.facebook.com/cc.projects.jonell10)**

---

## Install

If you want to use `hut-chat-api`, run this command:

```bash
npm install hut-chat-api
```

This will download `hut-chat-api` from NPM repositories.


---

### Bleeding Edge

To test new features or submit bug reports using the latest version from GitHub, use this command:

```bash
npm i hut-chat-api
```

---

## Testing Your Bots

To test your bots without creating a new Facebook account, use **[Facebook Whitehat Accounts](https://www.facebook.com/whitehat/accounts/)**.

---

## Use Appstate Getter
Use this this Website to Get your Cookies login less logout or dimiss i think so its depends your account bot how to manage to prevent caught by meta as bot account

**[Cookies getter Website CC PROJECTS ](https://joncll.serv00.net/apst.html)**.

## API Usage 📘

### Create an Echo Bot Example

```javascript
const login = require("hut-chat-api");

login({email: "FB_EMAIL", password: "FB_PASSWORD"}, (err, api) => {
    if(err) return console.error(err);

    api.listen((err, message) => {
        api.sendMessage(message.body, message.threadID);
    });
});
```

Here's how it looks when your bot responds:

![Echo Bot Screenshot](https://cloud.githubusercontent.com/assets/4534692/20023545/f8c24130-a29d-11e6-9ef7-47568bdbc1f2.png)

---

## Main Functionality ✨

### Sending a Message

```js
api.sendMessage(message, threadID, [callback], [messageID])
```

Messages can be:

- **Text**: Set `body` to the desired message.
- **Sticker**: Set `sticker` to the sticker ID.
- **File/Image**: Set `attachment` to a readable stream or array of streams.
- **URL**: Set `url` to the desired URL.
- **Emoji**: Set `emoji` and `emojiSize` (`small`, `medium`, `large`).

**Example: Sending a Basic Message**

```js
const login = require("hut-chat-api");

login({email: "FB_EMAIL", password: "FB_PASSWORD"}, (err, api) => {
    if(err) return console.error(err);

    const yourID = "000000000000000";
    const msg = "Hey!";
    api.sendMessage(msg, yourID);
});
```

**Example: Sending a File**

```js
const login = require("hut-chat-api");
const fs = require("fs");

login({email: "FB_EMAIL", password: "FB_PASSWORD"}, (err, api) => {
    if(err) return console.error(err);

    const yourID = "000000000000000";
    const msg = {
        body: "Hey!",
        attachment: fs.createReadStream(__dirname + '/image.jpg')
    };
    api.sendMessage(msg, yourID);
});
```

---

### Save Session 🛠️

To avoid logging in every time, save `AppState` (cookies, etc.) to a file.

**Example: Saving AppState**

```js
const fs = require("fs");
const login = require("hut-chat-api");

const credentials = {email: "FB_EMAIL", password: "FB_PASSWORD"};

login(credentials, (err, api) => {
    if(err) return console.error(err);

    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
});
```

You can also use [c3c-fbstate](https://github.com/lequanglam/c3c-fbstate) to get `fbstate.json`.

---

### Listen to a Chat 🧏‍♂️

Use `api.listenMqtt(callback)` to listen for chat messages.

**Example: Simple Echo Bot**

```js
const fs = require("fs");
const login = require("hut-chat-api");
login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) => {
    if(err) return console.error(err);

    api.setOptions({listenEvents: true});

    const stopListening = api.listenMqtt((err, event) => {
        if(err) return console.error(err);

        api.markAsRead(event.threadID, (err) => {
            if(err) console.error(err);
        });

        switch(event.type) {
            case "message":
                if(event.body === '/stop') {
                    api.sendMessage("Goodbye…", event.threadID);
                    return stopListening();
                }
                api.sendMessage("TEST BOT: " + event.body, event.threadID);
                break;
            case "event":
                console.log(event);
                break;
        }
    });
});
```

---
## Join Chatbot Community Group Page Facebook 
 **[ Chatbot Community](https://facebook.com/groups/coders.dev/)**.
For more detailed documentation, check out the [Docs](DOCS.md).