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

    this.on('stop', async () => {
      console.log('Stop triggered in Broker');

      this.telegramBot.sendMessage('Stopping');
      this.binanceBot.stop();
    });
    this.on('start', async () => {
      console.log('Start triggered in Broker');

      this.telegramBot.sendMessage('Starting');
      this.binanceBot.start();
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
