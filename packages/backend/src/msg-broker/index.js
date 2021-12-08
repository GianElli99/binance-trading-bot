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

    this.on('stop', async () => {
      console.log('MSG BROKER: STOP');

      this.telegramBot.sendMessage('Stop in progress');
      this.binanceBot.stop();
    });

    this.on('start', async () => {
      console.log('MSG BROKER: START');

      this.telegramBot.sendMessage('Start in progress');
      this.binanceBot.start();
    });
    this.on('started', async () => {
      console.log('MSG BROKER: STARTED');

      this.telegramBot.sendMessage('Started');
    });
    this.on('stopped', async () => {
      console.log('MSG BROKER: STOPED');

      this.telegramBot.sendMessage('Stopped');
    });
    this.on('sold', async (msg) => {
      console.log('MSG BROKER: SOLD');

      this.telegramBot.sendMessage(msg);
    });
    this.on('bought', async (msg) => {
      console.log('MSG BROKER: BOUGHT');

      this.telegramBot.sendMessage(msg);
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
