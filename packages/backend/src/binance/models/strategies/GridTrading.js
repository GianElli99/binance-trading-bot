const { Order } = require('../Order');
const Mutex = require('async-mutex').Mutex;

class GridTrading {
  account;
  base;
  quote;
  pair;
  base_free_amount;
  base_locked_amount;
  quote_free_amount;
  quote_locked_amount;

  grid_gap;
  grid_trailing_stop_gap;
  calculate_difference;

  initial_price = undefined;
  last_price = undefined;

  sellOrder = undefined;
  buyOrder = undefined;

  mutex;

  constructor(gap, trailingGap, minimumDifference) {
    this.grid_gap = gap || 0.0125; // 0.00635; //0.0003; //0.0125;
    this.grid_trailing_stop_gap = trailingGap || 0.0025; //0.00125; //0.0001; //0.0025;
    this.calculate_difference = minimumDifference || 0.0005;
    this.mutex = new Mutex();
    console.log(
      this.grid_gap,
      this.grid_trailing_stop_gap,
      this.calculate_difference,
    );
  }
  async run(data) {
    if (!this.initial_price) {
      this.initial_price = 45000; //Number(data.c);
      this.last_price = 45000; //Number(data.c);
      log('Initial price', this.initial_price);
      this.account.msgBroker.emit(
        'initial_price',
        `Initial Price: ${this.initial_price}`,
      );
      return;
    }
    let close_price = Number(data.c);
    if (
      Math.abs(close_price - this.last_price) >
      this.last_price * this.calculate_difference
    ) {
      //const release = await this.mutex.acquire();
      const problems = await this.checkForExecutedOrderProblems(close_price);
      if (problems) {
        log('Problem at price ', close_price);
        this.account.msgBroker.emit('stop');
        return;
      }
      //release();
      this.last_price = close_price;
      log(this.last_price, ' Last price');
      this.placeOrder();
    }
  }
  async checkForExecutedOrderProblems(closePrice) {
    if (this.buyOrder && closePrice >= Number(this.buyOrder.price)) {
      // await new Promise((resolve) => setTimeout(resolve, 2000));
      // const res = await this.account.getOrder(this.buyOrder.orderId);
      // console.log('open order', res);

      let executed = !false;
      if (executed) {
        this.initial_price = Number(this.buyOrder.price);
        this.last_price = Number(this.buyOrder.price);
        const msg = `❗BOUGHT❗${this.buyOrder.origQty} BTCBUSD at ${this.buyOrder.price}`;
        log(msg);
        this.account.msgBroker.emit('bought', msg);
        this.account.msgBroker.emit(
          'initial_price',
          `Initial Price: ${this.initial_price}`,
        );
        this.buyOrder = undefined;
        await this.setInitialState();
      }
      return !executed;
    }

    if (this.sellOrder && closePrice <= Number(this.sellOrder.price)) {
      // await new Promise((resolve) => setTimeout(resolve, 2000));

      // const res = await this.account.getOrder(this.sellOrder.orderId);
      // console.log('open order', res);
      let executed = !false;

      if (executed) {
        this.initial_price = Number(this.sellOrder.price);
        this.last_price = Number(this.sellOrder.price);
        const msg = `💹SOLD💹${this.sellOrder.origQty} BTCBUSD at ${this.sellOrder.price}`;
        log(msg);
        this.account.msgBroker.emit('sold', msg);
        this.account.msgBroker.emit(
          'initial_price',
          `Initial Price: ${this.initial_price}`,
        );
        this.sellOrder = undefined;
        await this.setInitialState();
      }
      return !executed;
    }
  }
  placeOrder() {
    if (this.last_price >= this.initial_price) {
      this.sell();
    } else {
      this.buy();
    }
  }
  async buy() {
    const release = await this.mutex.acquire();
    if (this.buyOrder) {
      //hay orden
      if (this.last_price < Number(this.buyOrder.placedAt)) {
        //hay que bajarla
        const price = Number(
          (
            this.last_price +
            this.last_price * this.grid_trailing_stop_gap
          ).toFixed(2),
        );
        const baseQuantityUnfixed = 10 / price; //0.00022222222
        let baseQuantityFixed = undefined;
        if (Number(baseQuantityUnfixed.toFixed(5)) < baseQuantityUnfixed) {
          baseQuantityFixed = Number(
            (baseQuantityUnfixed + 0.00001).toFixed(5),
          );
        } else {
          baseQuantityFixed = Number(baseQuantityUnfixed.toFixed(5));
        }
        log('Trailing buy order modified to ', price);

        const order = new Order(
          undefined,
          'BTCBUSD',
          price,
          baseQuantityFixed,
          'GTC',
          'STOP_LOSS_LIMIT',
          'BUY',
          price,
        );
        const deleteOrderResponse = await this.account.cancelOrder({
          symbol: 'BTCBUSD',
          id: this.buyOrder.orderId,
        });
        log(deleteOrderResponse);
        if (deleteOrderResponse.success) {
          const newOrderResponse = await this.account.newOrder(order);
          log(newOrderResponse);
          if (newOrderResponse.success) {
            this.buyOrder = newOrderResponse.data;
            this.buyOrder.placedAt = this.last_price;
          }
        }
      }
    } else {
      //no hay orden
      if (this.last_price < this.initial_price * (1 - this.grid_gap)) {
        //supera el trigger, hay que crearla entonces
        const price = Number(
          (this.last_price * (1 + this.grid_trailing_stop_gap)).toFixed(2),
        );
        const baseQuantityUnfixed = 10 / price; //0.00022222222
        let baseQuantityFixed = undefined;
        if (Number(baseQuantityUnfixed.toFixed(5)) < baseQuantityUnfixed) {
          baseQuantityFixed = Number(
            (baseQuantityUnfixed + 0.00001).toFixed(5),
          );
        } else {
          baseQuantityFixed = Number(baseQuantityUnfixed.toFixed(5));
        }
        if (
          this.quote_free_amount >= baseQuantityFixed * price &&
          baseQuantityFixed * price >= 10
        ) {
          log('Place new buy order at ', price);

          const order = new Order(
            undefined,
            'BTCBUSD',
            price,
            baseQuantityFixed,
            'GTC',
            'STOP_LOSS_LIMIT',
            'BUY',
            price,
          );
          const newOrderResponse = await this.account.newOrder(order);
          log(newOrderResponse);
          if (newOrderResponse.success) {
            this.buyOrder = newOrderResponse.data;
            this.buyOrder.placedAt = this.last_price;
          }
        }
      }
    }
    release();
  }

  async sell() {
    const release = await this.mutex.acquire();
    if (this.sellOrder) {
      //hay orden
      if (this.last_price > Number(this.sellOrder.placedAt)) {
        //hay que elevarla
        const price = Number(
          (
            this.last_price -
            this.last_price * this.grid_trailing_stop_gap
          ).toFixed(2),
        );
        const baseQuantityUnfixed = 10 / price; //0.00022222222
        let baseQuantityFixed = undefined;
        if (Number(baseQuantityUnfixed.toFixed(5)) < baseQuantityUnfixed) {
          baseQuantityFixed = Number(
            (baseQuantityUnfixed + 0.00001).toFixed(5),
          );
        } else {
          baseQuantityFixed = Number(baseQuantityUnfixed.toFixed(5));
        }
        log('Trailing sell order modified to ', price);

        const order = new Order(
          undefined,
          'BTCBUSD',
          price,
          baseQuantityFixed,
          'GTC',
          'STOP_LOSS_LIMIT',
          'SELL',
          price,
        );
        const deleteOrderResponse = await this.account.cancelOrder({
          symbol: 'BTCBUSD',
          id: this.sellOrder.orderId,
        });
        log(deleteOrderResponse);
        if (deleteOrderResponse.success) {
          const newOrderResponse = await this.account.newOrder(order);
          log(newOrderResponse);
          if (newOrderResponse.success) {
            this.sellOrder = newOrderResponse.data;
            this.sellOrder.placedAt = this.last_price;
          }
        }
      }
    } else {
      //no hay orden
      if (this.last_price > this.initial_price * (1 + this.grid_gap)) {
        //supera el trigger, hay que crearla entonces
        //checkear que tenga fondos
        const price = Number(
          (
            this.last_price -
            this.last_price * this.grid_trailing_stop_gap
          ).toFixed(2),
        );
        const baseQuantityUnfixed = 10 / price; //0.00022222222
        let baseQuantityFixed = undefined;
        if (Number(baseQuantityUnfixed.toFixed(5)) < baseQuantityUnfixed) {
          baseQuantityFixed = Number(
            (baseQuantityUnfixed + 0.00001).toFixed(5),
          );
        } else {
          baseQuantityFixed = Number(baseQuantityUnfixed.toFixed(5));
        }
        if (
          this.base_free_amount >= baseQuantityFixed &&
          baseQuantityFixed * price >= 10
        ) {
          log('Place new sell order at ', price);

          const order = new Order(
            undefined,
            'BTCBUSD',
            price,
            baseQuantityFixed,
            'GTC',
            'STOP_LOSS_LIMIT',
            'SELL',
            price,
          );
          const newOrderResponse = await this.account.newOrder(order);
          log(newOrderResponse);
          if (newOrderResponse.success) {
            this.sellOrder = newOrderResponse.data;
            this.sellOrder.placedAt = this.last_price;
          }
        }
      }
    }
    release();
  }

  async setInitialState(baseCurrency, quoteCurrency) {
    this.base = baseCurrency;
    this.quote = quoteCurrency;
    this.pair = this.base + this.quote;
    const res = await this.account.accountInfo();
    if (res.success) {
      this.base_free_amount = Number(
        res.data.balances.find((x) => x.asset === this.base)?.free,
      );
      this.base_locked_amount = Number(
        res.data.balances.find((x) => x.asset === this.base)?.locked,
      );

      this.quote_free_amount = Number(
        res.data.balances.find((x) => x.asset === this.quote)?.free,
      );
      this.quote_locked_amount = Number(
        res.data.balances.find((x) => x.asset === this.quote)?.locked,
      );

      log(this.base_free_amount, this.base, ' free');
      log(this.base_locked_amount, this.base, ' locked');
      log(this.quote_free_amount, this.quote, ' free');
      log(this.quote_locked_amount, this.quote, ' locked');
    }
  }
}

const log = (...rest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...rest);
  }
};

module.exports = { GridTrading };
