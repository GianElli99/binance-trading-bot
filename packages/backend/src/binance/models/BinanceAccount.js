const { Spot } = require('@binance/connector');
const { sides } = require('../constants/side');
const { orderTypes } = require('../constants/orderType');

class BinanceAccount {
  account;

  constructor(apiKey, apiSecret, mode) {
    this.account = new Spot(apiKey, apiSecret, {
      baseURL:
        mode === 'development'
          ? 'https://testnet.binance.vision'
          : 'https://api.binance.com',
    });
  }

  async accountInfo() {
    try {
      const response = await this.account.account();
      this.account.logger.log(response.data);
    } catch (error) {
      this.account.logger.error(error);
    }
  }
  async openOrders() {
    try {
      const response = await this.account.openOrders();
      this.account.logger.log(response.data);
    } catch (error) {
      this.account.logger.error(error);
    }
  }
  async newOrder(order) {
    let validOrderType = false;
    for (const key in orderTypes) {
      if (orderTypes[key] === order.type) {
        validOrderType = true;
        break;
      }
    }
    if (!validOrderType) {
      return { error: true, message: 'Invalid order type' };
    }

    try {
      const response = await this.account.newOrder(
        order.symbol,
        order.side,
        order.type,
        order.importantValues(),
      );
      this.account.logger.log(response.data);
    } catch (error) {
      this.account.logger.error(error);
    }
  }

  async cancelOrder(order) {
    try {
      const response = await this.account.cancelOrder(order.symbol, {
        orderId: order.id,
      });
      this.account.logger.log(response.data);
    } catch (error) {
      this.account.logger.error(error);
    }
  }
}
// const getAccountInfo = async (client) => {
//   try {
//     const response = await client.openOrders();
//     // const response = await client.newOrder('BTCBUSD', 'SELL', 'LIMIT', {
//     //   price: '100000',
//     //   quantity: 0.0002,
//     //   timeInForce: 'GTC',
//     // });
//     // const response = await client.cancelOrder('BTCBUSD', { orderId: 7500 });
//     client.logger.log(response.data);
//   } catch (error) {
//     client.logger.error(error);
//   }
//   // client
//   //   .account()
//   //   .then((response) => client.logger.log(response.data))
//   //   .catch((error) => client.logger.error(error));

//   // client
//   //   .newOrder('BTCBUSD', 'SELL', 'LIMIT', {
//   //     price: '70000',
//   //     quantity: 0.0002,
//   //     timeInForce: 'GTC',
//   //   })
//   //   .then((response) => client.logger.log(response.data))
//   //   .catch((error) => client.logger.error(error));
// };

module.exports = { BinanceAccount };
