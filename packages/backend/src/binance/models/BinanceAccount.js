const { Spot } = require('@binance/connector');
const { sides } = require('../constants/side');
const { orderTypes } = require('../constants/orderType');

class BinanceAccount {
  account;
  strategy;

  constructor(apiKey, apiSecret, mode) {
    this.account = new Spot(apiKey, apiSecret, {
      baseURL:
        mode === 'development'
          ? 'https://testnet.binance.vision'
          : 'https://api.binance.com',
    });
  }

  start() {
    console.log('Started');
    console.log('Running strat' + this.strategy);
    this.strategy.run();
  }
  stop() {
    if (this.strategy) {
      this.strategy.stop();
      console.log('Stopped');
    }
  }
  changeStrategy(strategy) {
    this.stop();
    this.strategy = strategy;
    this.start();
  }

  async accountInfo() {
    try {
      const response = await this.account.account();
      return response.data;
    } catch (error) {
      return error;
    }
  }
  async openOrders() {
    try {
      const response = await this.account.openOrders();
      return response.data;
    } catch (error) {
      return error;
    }
  }
  async cancelOpenOrders(symbol) {
    try {
      const response = await this.account.cancelOpenOrders(symbol, {
        recvWindow: 3000,
      });
      return response.data;
    } catch (error) {
      return error;
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
  klineWS() {
    const callbacks = {
      open: () => console.log('open'),
      close: () => console.log('closed'),
      message: (data) => console.log(data),
    };
    const wsRef = this.account.miniTickerWS('BTCBUSD', callbacks);

    setTimeout(() => this.account.unsubscribe(wsRef), 20000);
  }
}

module.exports = { BinanceAccount };
