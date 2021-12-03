const TelegramBot = require('node-telegram-bot-api');
const { MessageBroker } = require('../../msg-broker');

class CustomTelegramBot {
  bot;
  chatId;
  msgBroker;
  constructor(chatId, token, opts = { polling: true }) {
    this.msgBroker = new MessageBroker();
    this.bot = new TelegramBot(token, opts);
    this.chatId = chatId;

    this.bot.on('message', (msg) => {
      switch (msg.text) {
        case 'start':
          console.log('TELEGRAM: START');
          this.msgBroker.emit('start');
          break;
        case 'stop':
          console.log('TELEGRAM: STOP');
          this.msgBroker.emit('stop');
          break;

        default:
          console.log('TELEGRAM: NOT RECOGNIZED');
          return this.bot.sendMessage(chatId, 'Message not recognized');
      }
    });
    this.bot.on('polling_error', (error) => {
      this.sendMessage(error.message);
    });
  }

  async sendMessage(msg) {
    try {
      await this.bot.sendMessage(this.chatId, msg);
      return { error: false, message: 'Message sent' };
    } catch (error) {
      return { error: true, message: error };
    }
  }
}
module.exports = { CustomTelegramBot };
