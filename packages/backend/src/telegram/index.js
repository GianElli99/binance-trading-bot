const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;
const chatId = parseInt(process.env.CHAT_ID);

const opt = { polling: true };
const telegramBot = new TelegramBot(token, opt);

telegramBot.on('message', (msg) => {
  telegramBot.sendMessage(chatId, msg.text);
});

telegramBot.on('polling_error', console.log);

const sendMessage = async (msg) => {
  try {
    await telegramBot.sendMessage(chatId, msg);
    return { error: false, message: 'Message sent' };
  } catch (error) {
    return { error: true, message: error };
  }
};

module.exports = { sendMessage };
