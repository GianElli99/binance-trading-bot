const TelegramBot = require('node-telegram-bot-api');

class CustomTelegramBot {
  bot;
  chatId;
  constructor(chatId, token, opts = { polling: true }) {
    this.bot = new TelegramBot(token, opts);
    this.chatId = chatId;

    this.bot.on('message', (msg) => {
      this.bot.sendMessage(chatId, msg.text);
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
