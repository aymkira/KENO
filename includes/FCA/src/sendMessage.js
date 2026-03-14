const utils = require("../utils.js");
const log = require("npmlog");

const allowedProperties = {
    attachment: true,
    url: true,
    sticker: true,
    emoji: true,
    emojiSize: true,
    body: true,
    mentions: true,
    location: true
};

const emojiSizes = {
    small: 1,
    medium: 2,
    large: 3
};

function removeSpecialChar(inputString) { 
	if (typeof inputString !== "string")
		return inputString;
	const buffer = Buffer.from(inputString, 'utf8');

	let filteredBuffer = Buffer.alloc(0);
	for (let i = 0; i < buffer.length; i++) {
		if (buffer[i] === 0xEF && buffer[i + 1] === 0xB8 && buffer[i + 2] === 0x8F) {
			i += 2
		} else {
			filteredBuffer = Buffer.concat([filteredBuffer, buffer.slice(i, i + 1)]);
		}
	}

	const convertedString = filteredBuffer.toString('utf8');

	return convertedString;
}

module.exports = function(defaultFuncs, api, ctx) {

    async function uploadFile(attachments) {
      try {
        if (utils.getType(attachments) !== "Array") {
            attachments = [attachments];
          }
        const uploads = attachments.map(attachment => {
          if (!utils.isReadableStream(attachment)) {
            throw new Error(`Attachment should be a readable stream, but got ${utils.getType(attachment)}`);
          }
  
          const form = {
            upload_1024: attachment,
            voice_clip: "true"
          };
  
          return defaultFuncs
            .postFormData(
              "https://upload.facebook.com/ajax/mercury/upload.php",
              ctx.jar,
              form,
              {}
            )
            .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
            .then(resData => {
              if (resData.error) {
                return
              }
              return resData.payload.metadata[0];
            });
        });
  
        return await Promise.all(uploads);
      } catch (error) {
        throw error;
      }
    }
  
    return async function sendMessage(msg, threadkey, callback, messageId) {
      ctx.wsReqNumber++;
      ctx.wsTaskNumber++;
      const reqID = ctx.wsReqNumber;
      const task_id = ctx.wsTaskNumber;
        
  function generatePayload(threadkey, sendType, text, attachmentFbids, messageId) {
    const x = {
      thread_id: threadkey,
      otid: utils.generateOfflineThreadingID(),
      source: 65537,
      send_type: sendType,
      sync_group: 1,
      mark_thread_read: 1,
      text: text,
      attachment_fbids: attachmentFbids || [],
      initiating_source: 1,
      skip_url_preview_gen: 0,
      text_has_links: 0,
      multitab_env: 0
    };
    if (messageId) {
      const replyMetadata = {
        reply_source_id: messageId,
        reply_source_type: 1,
        reply_type: 0,
        reply_source_attachment_id: null
      };
  
      x.reply_metadata = replyMetadata;
    }
    if (msg?.emoji) {
      if (!msg?.emojiSize) {
        msg.emojiSize = "small";
      }
      if (
        msg.emojiSize !== "small" &&
        msg.emojiSize !== "medium" &&
        msg.emojiSize !== "large" &&
        (isNaN(msg?.emojiSize) || msg?.emojiSize < 1 || msg?.emojiSize > 3)
      ) {
        return callback({ error: "emojiSize property is invalid" });
      }
  
      x.send_type = 1;
      x.text = msg?.emoji;
      x.hot_emoji_size = !isNaN(msg?.emojiSize)
        ? msg?.emojiSize
        : emojiSizes[msg?.emojiSize];
    }
  
    if (msg?.sticker) {
      x.send_type = 2;
      x.sticker_id = msg.sticker;
    }
  
    if (msg?.mentions) {
        const arrayIds = [];
        const arrayOffsets = [];
        const arrayLengths = [];
        const mention_types = [];
  
        for (let i = 0; i < msg?.mentions.length; i++) {
            const mention = msg?.mentions[i];
            const tag = mention.tag;
            const offset = text.indexOf(tag, mention.fromIndex || 0);
  
            if (offset < 0) {
                log.warn('handleMention', `Mention for "${tag}" not found in message string.`);
            }
  
            const id = mention.id || 0;
            arrayIds.push(id);
            arrayOffsets.push(offset);
            arrayLengths.push(tag?.length);
            mention_types.push("p");
        }
  
        x.mention_data = {
            mention_ids: arrayIds.join(","),
            mention_offsets: arrayOffsets.join(","),
            mention_lengths: arrayLengths.join(","),
            mention_types: mention_types.join(",")
        };
    }
  
    if (msg?.location) {
        x.location_data = {
            coordinates: {
                latitude: msg?.location.latitude,
                longitude: msg?.location.longitude
            },
            is_current_location: !!msg?.location.current,
            is_live_location: !!msg?.location.live
        };
    }
      
    const returnPayload = {
      app_id: '2220391788200892',
      payload: JSON.stringify({
        epoch_id: parseInt(utils.generateOfflineThreadingID(), 10),
        tasks: [{
          failure_count: null,
          label: '46',
          payload: JSON.stringify(x),
          queue_name: threadkey,
          task_id: task_id,
        }],
        version_id: '6903494529735864',
        data_trace_id: null
      }),
      request_id: reqID,
      type: 3
    };
  
    return returnPayload;
  }
        
          if (
              !callback &&
              (utils.getType(threadkey) === "Function" ||
                  utils.getType(threadkey) === "AsyncFunction")
          ) {
              return threadkey({ error: "Pass a threadkey as a second argument." });
          }
          if (
              !messageId &&
              utils.getType(callback) === "String"
          ) {
              messageId = callback;
              callback = function () { };
          } 
      
  let resolveFunc = function () { };
          let rejectFunc = function () { };
          const returnPromise = new Promise(function (resolve, reject) {
              resolveFunc = resolve;
              rejectFunc = reject;
          });
  
          if (!callback) {
              callback = function (err, friendList) {
                  if (err) {
                      return rejectFunc(err);
                  }
                  resolveFunc(friendList);
              };
          }
  
          const msgType = utils.getType(msg);
          const threadkeyType = utils.getType(threadkey);
          const messageIDType = utils.getType(messageId);
  
          if (
              threadkeyType !== "Number" &&
              threadkeyType !== "String"
          ) {
              return callback({
                  error:
                      "threadkey should be of type number or string and not " +
                      threadkeyType +
                      "."
              });
          }
  
          if (messageId && messageIDType !== 'String') {
              return callback({
                  error:
                      "messageID should be of type string and not " +
                      threadkeyType +
                      "."
              });
          }
  
          if (msgType === "String") {
              msg = { body: msg };
          }
  
          if (utils.getType(msg.body) === "String") {
              msg.body = removeSpecialChar(msg.body);
          }
  
          const disallowedProperties = Object.keys(msg).filter(
              prop => !allowedProperties[prop]
          );
          if (disallowedProperties.length > 0) {
              return callback({
                  error: "Dissallowed props: `" + disallowedProperties.join(", ") + "`"
              });
          }
  
  await sendContent(msg.body, msg.attachment, threadkey, messageId, callback);  
   async function sendContent(text = null, attachments = [], threadkey, messageId, callback) {
     let attachmentFbids = []
        const files = await uploadFile(attachments) || []
        files.forEach(function (file) {
            let key = Object.keys(file);
            let type = key[0];
            attachmentFbids.push(file[type])
        });
        const payload = generatePayload(threadkey, 3, text, attachmentFbids, messageId);
        ctx.mqttClient.publish('/ls_req', JSON.stringify(payload), { qos: 1, retain: false });
        const handleRes = function(topic, message, _packet) {
          if (topic === "/ls_resp") {
            let jsonMsg = JSON.parse(message.toString());
            jsonMsg.payload = JSON.parse(jsonMsg.payload);
            if (jsonMsg.request_id != reqID) return;
            ctx.mqttClient.removeListener('message', handleRes);
            const messageID = jsonMsg.payload.step[1][2][2][1][3];
            const timeStamp = Date.now();
            return callback(null, {
              task: "sendMessage",
              messageID,
              threadID: threadkey,
              timeStamp
            });
          }
        };
        ctx.mqttClient.on('message', handleRes);
      }
        return returnPromise;
    };
  };





