const EventEmitter = require('events');

class MessageBroker extends EventEmitter {
  static instance;
  telegramBot;
  binanceBot;
  constructor() {
    if (MessageBroker.instance) {
      return MessageBroker.instance;
    }
    super();
    MessageBroker.instance = this;

    this.on('testMessage', async (msg) => {
      console.log('Message in MsgBroker:', msg);

      this.telegramBot.sendMessage('Message in Telegram' + msg);
      const resp = await this.binanceBot.openOrders();
      console.log(resp);
    });
  }

  addTelegramBot(telegramBot) {
    this.telegramBot = telegramBot;
  }
  addBinanceBot(binanceBot) {
    this.binanceBot = binanceBot;
  }
}

module.exports = {
  MessageBroker,
};
