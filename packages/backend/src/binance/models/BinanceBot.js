const { Spot } = require('@binance/connector');
const { sides } = require('../constants/side');
const { orderTypes } = require('../constants/orderType');

class BinanceBot {
  account;
  strategy;
  webSocketRef;

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
    console.log('Running strat' + this.strategy.name);
    this.klineWS();
  }
  stop() {
    if (this.strategy) {
      this.account.unsubscribe(this.webSocketRef);
      console.log('Stopped');
    }
  }
  changeStrategy(strategy) {
    this.stop();
    this.strategy = strategy;
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
      message: (data) => {
        const dataParsed = JSON.parse(data);
        this.strategy.run(dataParsed);
      },
    };
    this.webSocketRef = this.account.miniTickerWS('BTCBUSD', callbacks);
  }
}

module.exports = { BinanceBot };
