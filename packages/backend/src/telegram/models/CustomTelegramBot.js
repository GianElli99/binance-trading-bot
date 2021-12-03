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
          this.msgBroker.emit('start');
          break;
        case 'stop':
          this.msgBroker.emit('stop');
          break;

        default:
          return this.bot.sendMessage(chatId, msg.text);
      }
    });
    this.bot.on('polling_error', console.log);
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
