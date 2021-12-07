const { Order } = require('../Order');
const Mutex = require('async-mutex').Mutex;

class GridTrading {
  name;
  account;
  btc_free_amount;
  btc_locked_amount;
  busd_free_amount;
  busd_locked_amount;

  grid_gap = 0.005; //0.0003; //0.0125;
  grid_trailing_stop_gap = 0.002; //0.0001; //0.0025;
  calculate_difference = 0.0005;

  initial_price = undefined;
  last_price = undefined;

  sellOrder = undefined;
  buyOrder = undefined;

  mutex;

  constructor(name = 'Grid Trading') {
    this.name = name;
    this.mutex = new Mutex();
  }
  async run(data) {
    if (!this.initial_price) {
      this.initial_price = Number(data.c);
      this.last_price = Number(data.c);
      console.log('Initial price', this.initial_price);
      return;
    }
    let close_price = Number(data.c);
    const problems = await this.checkForExecutedOrderProblems(close_price);
    if (problems) {
      console.log('Problem at price ', close_price);
      this.account.msgBroker.emit('stop');
      return;
    }
    if (
      Math.abs(close_price - this.last_price) >
      this.last_price * this.calculate_difference
    ) {
      this.last_price = close_price;
      console.log(this.last_price, ' Last price');
      this.placeOrder();
    }
  }
  async checkForExecutedOrderProblems(closePrice) {
    if (this.buyOrder && closePrice >= Number(this.buyOrder.price)) {
      const res = await this.account.openOrders();
      let executed = true;
      res.forEach((order) => {
        if (order.orderId === this.buyOrder.orderId) {
          executed = false;
        }
      });
      if (executed) {
        this.initial_price = Number(this.buyOrder.price);
        this.last_price = Number(this.buyOrder.price);
        this.buyOrder = undefined;
      }
      return !executed;
    }

    if (this.sellOrder && closePrice <= Number(this.sellOrder.price)) {
      const res = await this.account.openOrders();
      let executed = true;
      res.forEach((order) => {
        if (order.orderId === this.sellOrder.orderId) {
          executed = false;
        }
      });
      if (executed) {
        this.initial_price = Number(this.sellOrder.price);
        this.last_price = Number(this.sellOrder.price);
        this.sellOrder = undefined;
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
        console.log('Trailing buy order modified to ', price);

        const order = new Order(
          undefined,
          'BTCBUSD',
          price,
          0.00021,
          'GTC',
          'STOP_LOSS_LIMIT',
          'BUY',
          price,
        );
        const deleteOld = await this.account.cancelOrder({
          symbol: 'BTCBUSD',
          id: this.buyOrder.orderId,
        });
        console.log(deleteOld);
        const res = await this.account.newOrder(order);
        console.log(res);
        this.buyOrder = res;
        this.buyOrder.placedAt = this.last_price;
      }
    } else {
      //no hay orden
      if (this.last_price < this.initial_price * (1 - this.grid_gap)) {
        //supera el trigger, hay que crearla entonces
        const price = Number(
          (this.last_price * (1 + this.grid_trailing_stop_gap)).toFixed(2),
        );
        console.log('Place new buy order at ', price);

        const order = new Order(
          undefined,
          'BTCBUSD',
          price,
          0.00021,
          'GTC',
          'STOP_LOSS_LIMIT',
          'BUY',
          price,
        );
        const res = await this.account.newOrder(order);
        console.log(res);
        this.buyOrder = res;
        this.buyOrder.placedAt = this.last_price;
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
        console.log('Trailing sell order modified to ', price);

        const order = new Order(
          undefined,
          'BTCBUSD',
          price,
          0.00021,
          'GTC',
          'STOP_LOSS_LIMIT',
          'SELL',
          price,
        );
        const deleteOld = await this.account.cancelOrder({
          symbol: 'BTCBUSD',
          id: this.sellOrder.orderId,
        });
        console.log(deleteOld);
        const res = await this.account.newOrder(order);
        console.log(res);
        this.sellOrder = res;
        this.sellOrder.placedAt = this.last_price;
      }
    } else {
      //no hay orden
      if (this.last_price > this.initial_price * (1 + this.grid_gap)) {
        //supera el trigger, hay que crearla entonces
        const price = Number(
          (
            this.last_price -
            this.last_price * this.grid_trailing_stop_gap
          ).toFixed(2),
        );
        console.log('Place new sell order at ', price);

        const order = new Order(
          undefined,
          'BTCBUSD',
          price,
          0.00021,
          'GTC',
          'STOP_LOSS_LIMIT',
          'SELL',
          price,
        );
        const res = await this.account.newOrder(order);
        console.log(res);
        this.sellOrder = res;
        this.sellOrder.placedAt = this.last_price;
      }
    }
    release();
  }

  async setInitialState() {
    const res = await this.account.accountInfo();
    console.log(res);
    this.btc_free_amount = Number(
      res.balances.find((x) => x.asset === 'BTC')?.free,
    );
    this.btc_locked_amount = Number(
      res.balances.find((x) => x.asset === 'BTC')?.locked,
    );

    this.busd_free_amount = Number(
      res.balances.find((x) => x.asset === 'BUSD')?.free,
    );
    this.busd_locked_amount = Number(
      res.balances.find((x) => x.asset === 'BUSD')?.locked,
    );

    console.log(this.btc_free_amount, 'BTC free');
    console.log(this.btc_locked_amount, 'BTC locked');
    console.log(this.busd_free_amount, 'BUSD free');
    console.log(this.busd_locked_amount, 'BUSD locked');
  }
}

module.exports = { GridTrading };
