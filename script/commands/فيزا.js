const axios = require('axios');

module.exports = {
  config: {
    name: "فيزا",
    version: "1.8",
    credits: "AYOUB",
    hasPermission: 0,
    description: "توليد وفحص بطاقات الفيزا",
    commandCategory: "أدوات",
    cooldowns: 10,
  },

  apiUrl: "https://visa-generator.onrender.com/api",

  gameState: {},

  async run({ api, event, args, Message }) {
    const userID = event.senderID;
    const threadID = event.threadID;

    try {
      const info = await api.sendMessage(
        '💳 مرحباً بك في مولد الفيزا!\n\n🔢 يرجى إدخال BIN (مثال: 414720، 6-8 أرقام)',
        threadID
      );

      this.gameState[userID] = {
        step: 'bin',
        threadID: threadID,
        messageID: info.messageID
      };

      global.client.handleReply.push({
        name: this.config.name,
        author: userID,
        messageID: info.messageID
      });
    } catch (error) {
      console.error('Error in visa command:', error);
      await Message.reply('❌ حدث خطأ أثناء بدء العملية: ' + error.message);
    }
  },

  async handleReply({ api, event, handleReply, Message }) {
    const userID = event.senderID;
    const threadID = event.threadID;

    if (userID !== handleReply.author) {
      return Message.reply('❌ لست صاحب هذا الطلب! اكتب "فيزا" لبدء عملية خاصة بك.');
    }

    const state = this.gameState[userID];
    if (!state) {
      return Message.reply('❌ لا توجد عملية نشطة! اكتب "فيزا" لبدء عملية جديدة.');
    }

    try {
      const userInput = event.body.trim();

      switch (state.step) {
        case 'bin':
          await this.handleBinInput(api, threadID, userID, userInput);
          break;
        case 'count':
          await this.handleCountInput(api, threadID, userID, userInput);
          break;
        case 'method':
          await this.handleMethodSelection(api, threadID, userID, userInput);
          break;
        case 'check':
          if (userInput.toLowerCase() === 'فحص') {
            await this.checkStoredCards(api, threadID, userID);
          } else {
            await Message.reply('❌ اكتب "فحص" لفحص البطاقات المحفوظة.');
          }
          break;
        default:
          await Message.reply('❌ حالة غير معروفة، يرجى البدء من جديد.');
          delete this.gameState[userID];
      }
    } catch (error) {
      await Message.reply(`❌ حدث خطأ أثناء معالجة طلبك: ${error.message}`);
      delete this.gameState[userID];
    }
  },

  async handleBinInput(api, threadID, userID, bin) {
    if (!/^\d{6,8}$/.test(bin)) {
      return api.sendMessage(
        '❌ BIN غير صحيح! يرجى إدخال 6-8 أرقام (مثال: 414720)',
        threadID
      );
    }

    this.gameState[userID].bin = bin;
    this.gameState[userID].step = 'count';

    const info = await api.sendMessage(
      `✅ تم حفظ BIN: ${bin}\n\n🔢 كم عدد البطاقات التي تريد توليدها؟ (1-10)`,
      threadID
    );

    global.client.handleReply = global.client.handleReply.map(reply =>
      reply.author === userID && reply.name === this.config.name
        ? { ...reply, messageID: info.messageID }
        : reply
    );
  },

  async handleCountInput(api, threadID, userID, countStr) {
    const count = parseInt(countStr);

    if (isNaN(count) || count < 1 || count > 10) {
      return api.sendMessage(
        '❌ العدد غير صحيح! يرجى إدخال رقم بين 1 و10',
        threadID
      );
    }

    this.gameState[userID].count = count;
    this.gameState[userID].step = 'method';

    const info = await api.sendMessage(
      `✅ تم تحديد العدد: ${count} بطاقة\n\n🤖 اختر طريقة العمل:\n1️⃣ توليد وفحص\n2️⃣ توليد فقط\n\nاكتب 1 أو 2`,
      threadID
    );

    global.client.handleReply = global.client.handleReply.map(reply =>
      reply.author === userID && reply.name === this.config.name
        ? { ...reply, messageID: info.messageID }
        : reply
    );
  },

  async handleMethodSelection(api, threadID, userID, method) {
    const state = this.gameState[userID];

    if (method === '1') {
      await this.generateAndCheck(api, threadID, userID, state.bin, state.count);
    } else if (method === '2') {
      await this.generateOnly(api, threadID, userID, state.bin, state.count);
    } else {
      return api.sendMessage(
        '❌ خيار غير صحيح! اكتب 1 للتوليد والفحص أو 2 للتوليد فقط',
        threadID
      );
    }
  },

  async generateOnly(api, threadID, userID, bin, count) {
    try {
      await api.sendMessage(
        `🔄 جاري توليد ${count} بطاقة من BIN: ${bin}...`,
        threadID
      );

      const response = await axios.post(`${this.apiUrl}/generate`, {
        bin: bin,
        count: count
      }, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('Generate API response:', JSON.stringify(response.data, null, 2));

      const data = response.data;

      if (data.success) {
        this.gameState[userID].cards = data.cards;
        this.gameState[userID].step = 'check';

        let resultMessage = `✅ تم توليد ${data.count} بطاقة بنجاح!\n\n`;
        resultMessage += `🔢 BIN: ${bin}\n`;

        if (data.binInfo) {
          resultMessage += `🏦 البنك: ${data.binInfo.bank?.name || 'غير معروف'}\n`;
          resultMessage += `🌍 الدولة: ${data.binInfo.country?.name || 'غير معروف'} ${data.binInfo.country?.emoji || ''}\n`;
          resultMessage += `💳 النوع: ${data.binInfo.type || 'غير معروف'} (${data.binInfo.scheme || 'غير معروف'})\n`;
        }

        resultMessage += `\n═══════════════════════\n`;
        resultMessage += `💳 البطاقات المولدة:\n`;
        resultMessage += `═══════════════════════\n\n`;
        
        data.cards.forEach((card, index) => {
          resultMessage += `${index + 1}. ${card.fullCard}\n`;
          resultMessage += `👤 الاسم: ${card.identity.name}\n`;
          resultMessage += `📧 الإيميل: ${card.identity.email}\n`;
          resultMessage += `📞 الهاتف: ${card.identity.phone}\n`;
          resultMessage += `🏠 العنوان: ${card.identity.address}, ${card.identity.city}\n`;
          resultMessage += `🌍 البلد: ${card.identity.country}\n`;
          resultMessage += `─────────────────────\n`;
        });

        resultMessage += `\n🔍 لفحص البطاقات، اكتب "فحص"`;

        const info = await api.sendMessage(resultMessage, threadID);

        global.client.handleReply = global.client.handleReply.map(reply =>
          reply.author === userID && reply.name === this.config.name
            ? { ...reply, messageID: info.messageID }
            : reply
        );
      } else {
        await api.sendMessage(`❌ فشل في التوليد: ${data.error || 'خطأ غير معروف'}`, threadID);
        delete this.gameState[userID];
      }
    } catch (error) {
      console.error('Error in generateOnly:', error);
      let errorMessage = '❌ حدث خطأ أثناء التوليد';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage += `: ${error.response.data.error}`;
      } else {
        errorMessage += `: ${error.message}`;
      }
      await api.sendMessage(errorMessage, threadID);
      delete this.gameState[userID];
    }
  },

  formatCardResults(results) {
    // تصنيف البطاقات حسب الحالة
    const liveCards = results.filter(result => 
      result.status === 'حية' || 
      result.status === 'live' || 
      result.status === 'Live' ||
      result.status === 'LIVE'
    );
    
    const deadCards = results.filter(result => 
      result.status === 'ميتة' || 
      result.status === 'Die' || 
      result.status === 'Dead' ||
      result.status === 'DEAD'
    );
    
    const unknownCards = results.filter(result => 
      result.status === 'غير معروف' || 
      result.status === 'unknown' || 
      result.status === 'Unknown' ||
      result.status === 'UNKNOWN'
    );
    
    
    const errorCards = results.filter(result => {
      const status = result.status;
      const isLive = status === 'حية' || status === 'live' || status === 'Live' || status === 'LIVE';
      const isDead = status === 'ميتة' || status === 'Die' || status === 'Dead' || status === 'DEAD';
      const isUnknown = status === 'غير معروف' || status === 'unknown' || status === 'Unknown' || status === 'UNKNOWN';
      return !isLive && !isDead && !isUnknown;
    });

    let message = '';

   
    if (liveCards.length > 0) {
      message += `✅ البطاقات الصحيحة (${liveCards.length}):\n`;
      message += `═══════════════════════\n`;
      liveCards.forEach((result, index) => {
        const card = result.card;
        message += `${index + 1}. ${card.fullCard} ✅\n`;
        if (result.binInfo) {
          message += `🏦 البنك: ${result.binInfo.bank?.name || 'غير معروف'}\n`;
          message += `🌍 الدولة: ${result.binInfo.country?.name || 'غير معروف'} ${result.binInfo.country?.emoji || ''}\n`;
          message += `💳 النوع: ${result.binInfo.type || 'غير معروف'} (${result.binInfo.scheme || 'غير معروف'})\n`;
        }
        message += `👤 الاسم: ${card.identity.name}\n`;
        message += `📧 الإيميل: ${card.identity.email}\n`;
        message += `📞 الهاتف: ${card.identity.phone}\n`;
        message += `🏠 العنوان: ${card.identity.address}, ${card.identity.city}\n`;
        message += `🌍 البلد: ${card.identity.country}\n`;
        message += `─────────────────────\n`;
      });
      message += `\n`;
    }

    
    if (deadCards.length > 0) {
      message += `❌ البطاقات الميتة (${deadCards.length}):\n`;
      message += `═══════════════════════\n`;
      deadCards.forEach((result, index) => {
        const card = result.card;
        message += `${index + 1}. ${card.fullCard} ❌\n`;
        if (result.binInfo) {
          message += `🏦 البنك: ${result.binInfo.bank?.name || 'غير معروف'}\n`;
          message += `🌍 الدولة: ${result.binInfo.country?.name || 'غير معروف'} ${result.binInfo.country?.emoji || ''}\n`;
          message += `💳 النوع: ${result.binInfo.type || 'غير معروف'} (${result.binInfo.scheme || 'غير معروف'})\n`;
        }
        message += `👤 الاسم: ${card.identity.name}\n`;
        message += `📧 الإيميل: ${card.identity.email}\n`;
        message += `📞 الهاتف: ${card.identity.phone}\n`;
        message += `🏠 العنوان: ${card.identity.address}, ${card.identity.city}\n`;
        message += `🌍 البلد: ${card.identity.country}\n`;
        message += `─────────────────────\n`;
      });
      message += `\n`;
    }

    
    if (unknownCards.length > 0) {
      message += `❓ البطاقات غير المعروفة (${unknownCards.length}):\n`;
      message += `═══════════════════════\n`;
      unknownCards.forEach((result, index) => {
        const card = result.card;
        message += `${index + 1}. ${card.fullCard} ❓\n`;
        if (result.binInfo) {
          message += `🏦 البنك: ${result.binInfo.bank?.name || 'غير معروف'}\n`;
          message += `🌍 الدولة: ${result.binInfo.country?.name || 'غير معروف'} ${result.binInfo.country?.emoji || ''}\n`;
          message += `💳 النوع: ${result.binInfo.type || 'غير معروف'} (${result.binInfo.scheme || 'غير معروف'})\n`;
        }
        message += `👤 الاسم: ${card.identity.name}\n`;
        message += `📧 الإيميل: ${card.identity.email}\n`;
        message += `📞 الهاتف: ${card.identity.phone}\n`;
        message += `🏠 العنوان: ${card.identity.address}, ${card.identity.city}\n`;
        message += `🌍 البلد: ${card.identity.country}\n`;
        message += `─────────────────────\n`;
      });
      message += `\n`;
    }

    if (errorCards.length > 0) {
      message += `⚠️ البطاقات التي بها خطأ (${errorCards.length}):\n`;
      message += `═══════════════════════\n`;
      errorCards.forEach((result, index) => {
        const card = result.card;
        message += `${index + 1}. ${card.fullCard} ⚠️\n`;
        message += `⚠️ الخطأ: ${result.error}\n`;
        message += `👤 الاسم: ${card.identity.name}\n`;
        message += `📧 الإيميل: ${card.identity.email}\n`;
        message += `📞 الهاتف: ${card.identity.phone}\n`;
        message += `🏠 العنوان: ${card.identity.address}, ${card.identity.city}\n`;
        message += `🌍 البلد: ${card.identity.country}\n`;
        message += `─────────────────────\n`;
      });
    }

    return message;
  },

  async generateAndCheck(api, threadID, userID, bin, count) {
    try {
      await api.sendMessage(
        `🔄 جاري توليد وفحص ${count} بطاقة من BIN: ${bin}\n⏰ قد يستغرق هذا بعض الوقت...`,
        threadID
      );

      const response = await axios.post(`${this.apiUrl}/generate-and-check`, {
        bin: bin,
        count: count
      }, {
        timeout: 120000,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('GenerateAndCheck API response:', JSON.stringify(response.data, null, 2));

      const data = response.data;

      if (data.success) {
        const liveCards = data.results.filter(result => 
          result.status === 'حية' || 
          result.status === 'live' || 
          result.status === 'Live' ||
          result.status === 'LIVE'
        );
        
        const deadCards = data.results.filter(result => 
          result.status === 'ميتة' || 
          result.status === 'Die' || 
          result.status === 'Dead' ||
          result.status === 'DEAD'
        );
        
        const unknownCards = data.results.filter(result => 
          result.status === 'غير معروف' || 
          result.status === 'unknown' || 
          result.status === 'Unknown' ||
          result.status === 'UNKNOWN'
        );

        let resultMessage = `🎯 نتائج التوليد والفحص:\n\n`;
        resultMessage += `🔢 BIN: ${bin}\n`;

        if (data.binInfo) {
          resultMessage += `🏦 البنك: ${data.binInfo.bank?.name || 'غير معروف'}\n`;
          resultMessage += `🌍 الدولة: ${data.binInfo.country?.name || 'غير معروف'} ${data.binInfo.country?.emoji || ''}\n`;
          resultMessage += `💳 النوع: ${data.binInfo.type || 'غير معروف'} (${data.binInfo.scheme || 'غير معروف'})\n`;
        }

        resultMessage += `\n📊 الإحصائيات:\n`;
        resultMessage += `✅ حية: ${liveCards.length}\n`;
        resultMessage += `❌ ميتة: ${deadCards.length}\n`;
        resultMessage += `❓ غير معروف: ${unknownCards.length}\n`;
        resultMessage += `📋 المجموع: ${data.results.length}\n\n`;

        resultMessage += this.formatCardResults(data.results);

        await api.sendMessage(resultMessage, threadID);
        delete this.gameState[userID];
      } else {
        await api.sendMessage(`❌ فشل في العملية: ${data.error || 'خطأ غير معروف'}`, threadID);
        delete this.gameState[userID];
      }
    } catch (error) {
      console.error('Error in generateAndCheck:', error);
      let errorMessage = '❌ حدث خطأ أثناء التوليد والفحص';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage += `: ${error.response.data.error}`;
      } else {
        errorMessage += `: ${error.message}`;
      }
      await api.sendMessage(errorMessage, threadID);
      delete this.gameState[userID];
    }
  },

  async checkStoredCards(api, threadID, userID) {
    try {
      const state = this.gameState[userID];

      if (!state.cards || state.cards.length === 0) {
        await api.sendMessage('❌ لا توجد بطاقات محفوظة للفحص!', threadID);
        delete this.gameState[userID];
        return;
      }

      await api.sendMessage(
        `🔄 جاري فحص ${state.cards.length} بطاقة...\n⏰ قد يستغرق هذا بعض الوقت...`,
        threadID
      );

      const response = await axios.post(`${this.apiUrl}/check`, {
        cards: state.cards
      }, {
        timeout: 120000,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('CheckStoredCards API response:', JSON.stringify(response.data, null, 2));

      const data = response.data;

      if (data.success) {
    
        const liveCards = data.results.filter(result => 
          result.status === 'حية' || 
          result.status === 'live' || 
          result.status === 'Live' ||
          result.status === 'LIVE'
        );
        
        const deadCards = data.results.filter(result => 
          result.status === 'ميتة' || 
          result.status === 'Die' || 
          result.status === 'Dead' ||
          result.status === 'DEAD'
        );
        
        const unknownCards = data.results.filter(result => 
          result.status === 'غير معروف' || 
          result.status === 'unknown' || 
          result.status === 'Unknown' ||
          result.status === 'UNKNOWN'
        );

        let resultMessage = `🎯 نتائج الفحص:\n\n`;
        resultMessage += `📊 الإحصائيات:\n`;
        resultMessage += `✅ حية: ${liveCards.length}\n`;
        resultMessage += `❌ ميتة: ${deadCards.length}\n`;
        resultMessage += `❓ غير معروف: ${unknownCards.length}\n`;
        resultMessage += `📋 المجموع: ${data.results.length}\n\n`;

           
        resultMessage += this.formatCardResults(data.results);

        await api.sendMessage(resultMessage, threadID);
        delete this.gameState[userID];
      } else {
        await api.sendMessage(`❌ فشل في الفحص: ${data.error || 'خطأ غير معروف'}`, threadID);
        delete this.gameState[userID];
      }
    } catch (error) {
      console.error('Error in checkStoredCards:', error);
      let errorMessage = '❌ حدث خطأ أثناء الفحص';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage += `: ${error.response.data.error}`;
      } else {
        errorMessage += `: ${error.message}`;
      }
      await api.sendMessage(errorMessage, threadID);
      delete this.gameState[userID];
    }
  }
};
