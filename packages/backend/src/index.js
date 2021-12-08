require('dotenv').config();
const { BinanceBot, Order } = require('./binance');
const { CustomTelegramBot } = require('./telegram');
const { api } = require('./web-api');
const { MessageBroker } = require('./msg-broker');
const { GridTrading } = require('./binance/models/strategies/GridTrading');

const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;
const binanceBot = new BinanceBot(apiKey, apiSecret, '');

const chatId = parseInt(process.env.CHAT_ID);
const token = process.env.TELEGRAM_TOKEN;
const telegramBot = new CustomTelegramBot(chatId, token);

const msgBroker = new MessageBroker();
msgBroker.addTelegramBot(telegramBot);
msgBroker.addBinanceBot(binanceBot);

const port = process.env.PORT;
api.listen(port, async () => {
  console.log('Server running on port ' + port);
  // const resp = await binanceBot.accountInfo();
  // console.log(resp);
  //console.log(await binanceBot.openOrders());
  // const newOrder = new Order(
  //   undefined,
  //   'ETHBTC',
  //   0.089,
  //   0.0033,
  //   'GTC',
  //   'STOP_LOSS_LIMIT',
  //   'BUY',
  //   0.09,
  // );
  // console.log(await binanceBot.newOrder(newOrder));
  //console.log(await binanceBot.getOrder(3890954998));
  // console.log(resp);

  //console.log(await binanceBot.cancelOpenOrders('btcbusd'));
  // binanceAccount.changeStrategy(new GridTrading());
  // setTimeout(() => {
  //   binanceAccount.stop();
  // }, 10000);
  binanceBot.changeStrategy(new GridTrading());
  await binanceBot.start();
  // console.log(Date.now());
  // await new Promise((resolve) => setTimeout(resolve, 2000));
  // console.log(Date.now());
});
// binanceAccount.strategy = 3;
// binanceAccount.strategy = 5;
