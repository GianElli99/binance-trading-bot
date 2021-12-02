require('dotenv').config();
const { BinanceAccount, Order } = require('./binance');
const { CustomTelegramBot } = require('./telegram');
const { api } = require('./web-api');
const { MessageBroker } = require('./msg-broker');
const axios = require('axios');

const apiKey = process.env.TEST_API_KEY;
const apiSecret = process.env.TEST_API_SECRET;
const binanceAccount = new BinanceAccount(apiKey, apiSecret, 'development');

const chatId = parseInt(process.env.CHAT_ID);
const token = process.env.TELEGRAM_TOKEN;
const telegramBot = new CustomTelegramBot(chatId, token);

const msgBroker = new MessageBroker();
msgBroker.addTelegramBot(telegramBot);
msgBroker.addBinanceBot(binanceAccount);

const port = process.env.PORT;
api.listen(port, async () => {
  console.log('Server running on port ' + port);
  // await binanceAccount.accountInfo();
  // await binanceAccount.openOrders();
  const newOrder = new Order(
    9346,
    'BTCBUSD',
    80000,
    0.1,
    'GTC',
    'LIMIT',
    'SELL',
  );
  await binanceAccount.newOrder(newOrder);
  const resp = await binanceAccount.openOrders();
  console.log('Inicializar:', resp);

  // await binanceAccount.cancelOrder(newOrder);
  // await binanceAccount.openOrders();
});
