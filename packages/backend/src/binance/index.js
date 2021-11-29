const { Spot } = require('@binance/connector');

const apiKey = process.env.TEST_API_KEY;
const apiSecret = process.env.TEST_API_SECRET;

const client = new Spot(apiKey, apiSecret, {
  baseURL: 'https://testnet.binance.vision',
});

const getAccountInfo = async () => {
  try {
    const response = await client.openOrders();
    // const response = await client.newOrder('BTCBUSD', 'SELL', 'LIMIT', {
    //   price: '100000',
    //   quantity: 0.0002,
    //   timeInForce: 'GTC',
    // });
    // const response = await client.cancelOrder('BTCBUSD', { orderId: 7500 });
    client.logger.log(response.data);
  } catch (error) {
    client.logger.error(error);
  }
  // client
  //   .account()
  //   .then((response) => client.logger.log(response.data))
  //   .catch((error) => client.logger.error(error));

  // client
  //   .newOrder('BTCBUSD', 'SELL', 'LIMIT', {
  //     price: '70000',
  //     quantity: 0.0002,
  //     timeInForce: 'GTC',
  //   })
  //   .then((response) => client.logger.log(response.data))
  //   .catch((error) => client.logger.error(error));
};

module.exports = { getAccountInfo };
