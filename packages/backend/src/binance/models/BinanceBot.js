const { Spot } = require('@binance/connector');
const { sides } = require('../constants/side');
const { orderTypes } = require('../constants/orderType');
const { MessageBroker } = require('../../msg-broker');
const { formatError } = require('../helpers/formatError');
const { formatSuccess } = require('../helpers/formatSuccess');

class BinanceBot {
  account;
  strategy;
  webSocketRef;
  msgBroker;
  constructor(apiKey, apiSecret, mode) {
    this.msgBroker = new MessageBroker();
    this.account = new Spot(apiKey, apiSecret, {
      baseURL:
        mode === 'production'
          ? 'https://api.binance.com'
          : 'https://testnet.binance.vision',
    });
  }

  async start() {
    await this.strategy.setInitialState();
    this.miniTickerWS();
    console.log('BINANCE: START');
  }
  stop() {
    if (this.strategy) {
      this.account.unsubscribe(this.webSocketRef);
      console.log('BINANCE: STOP');
    }
  }
  changeStrategy(strategy) {
    this.stop();
    this.strategy = strategy;
    this.strategy.account = this;
  }

  async accountInfo() {
    try {
      const response = await this.account.account();
      return formatSuccess(response);
    } catch (error) {
      return formatError(error);
    }
  }
  async getOrder(id) {
    try {
      const response = await this.account.getOrder('BTCBUSD', {
        orderId: id,
        recvWindow: 3000,
      });
      return formatSuccess(response);
    } catch (error) {
      return formatError(error);
    }
  }
  async isOrderFilled(orderId) {
    const response = await this.getOrder(orderId);
    if (response.success && response.data.status === 'FILLED') {
      return true;
    }
    return false;
  }
  async openOrders() {
    try {
      const response = await this.account.openOrders();
      console.log(response);
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
      return formatError({ message: 'Invalid order type' });
    }

    try {
      const response = await this.account.newOrder(
        order.symbol,
        order.side,
        order.type,
        { ...order.importantValues(), newOrderRespType: 'RESULT' },
      );
      return formatSuccess(response);
    } catch (error) {
      return formatError(error);
    }
  }

  async cancelOrder(order) {
    try {
      const response = await this.account.cancelOrder(order.symbol, {
        orderId: order.id,
      });
      return formatSuccess(response);
    } catch (error) {
      return formatError(error);
    }
  }
  miniTickerWS() {
    const callbacks = {
      open: () => {
        console.log('BINANCE WS: OPEN');
        this.msgBroker.emit('started');
      },
      close: () => {
        console.log('BINANCE WS: CLOSE');
        this.msgBroker.emit('stopped');
      },
      message: (data) => {
        const dataParsed = JSON.parse(data);
        this.strategy.run(dataParsed);
      },
    };
    this.webSocketRef = this.account.miniTickerWS('BTCBUSD', callbacks);
  }
}

module.exports = { BinanceBot };
