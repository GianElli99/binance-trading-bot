const { Order } = require('../Order');
const Mutex = require('async-mutex').Mutex;

class GridTrading {
  name;
  account;
  btc_free_amount;
  btc_locked_amount;
  busd_free_amount;
  busd_locked_amount;

  grid_gap = 0.00635; //0.0003; //0.0125;
  grid_trailing_stop_gap = 0.00125; //0.0001; //0.0025;
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
    if (
      Math.abs(close_price - this.last_price) >
      this.last_price * this.calculate_difference
    ) {
      //const release = await this.mutex.acquire();
      const problems = await this.checkForExecutedOrderProblems(close_price);
      if (problems) {
        console.log('Problem at price ', close_price);
        this.account.msgBroker.emit('stop');
        return;
      }
      //release();
      this.last_price = close_price;
      console.log(this.last_price, ' Last price');
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
        const msg = `❗❗BOUGHT❗❗${this.buyOrder.origQty} BTCBUSD at ${this.buyOrder.price}`;
        console.log(msg);
        this.account.msgBroker.emit('bought', msg);
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
        const msg = `💹💹SOLD💹💹${this.sellOrder.origQty} BTCBUSD at ${this.sellOrder.price}`;
        console.log(msg);
        this.account.msgBroker.emit('sold', msg);
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
        const deleteOrderResponse = await this.account.cancelOrder({
          symbol: 'BTCBUSD',
          id: this.buyOrder.orderId,
        });
        console.log(deleteOrderResponse);
        if (deleteOrderResponse.success) {
          const newOrderResponse = await this.account.newOrder(order);
          console.log(newOrderResponse);
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
        if (this.busd_free_amount >= 0.00021 * price && 0.00021 * price >= 10) {
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
          const newOrderResponse = await this.account.newOrder(order);
          console.log(newOrderResponse);
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
        const deleteOrderResponse = await this.account.cancelOrder({
          symbol: 'BTCBUSD',
          id: this.sellOrder.orderId,
        });
        console.log(deleteOrderResponse);
        if (deleteOrderResponse.success) {
          const newOrderResponse = await this.account.newOrder(order);
          console.log(newOrderResponse);
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
        if (this.btc_free_amount >= 0.00021 && 0.00021 * price >= 10) {
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
          const newOrderResponse = await this.account.newOrder(order);
          console.log(newOrderResponse);
          if (newOrderResponse.success) {
            this.sellOrder = newOrderResponse;
            this.sellOrder.placedAt = this.last_price;
          }
        }
      }
    }
    release();
  }

  async setInitialState() {
    const res = await this.account.accountInfo();
    if (res.success) {
      this.btc_free_amount = Number(
        res.data.balances.find((x) => x.asset === 'BTC')?.free,
      );
      this.btc_locked_amount = Number(
        res.data.balances.find((x) => x.asset === 'BTC')?.locked,
      );

      this.busd_free_amount = Number(
        res.data.balances.find((x) => x.asset === 'BUSD')?.free,
      );
      this.busd_locked_amount = Number(
        res.data.balances.find((x) => x.asset === 'BUSD')?.locked,
      );

      console.log(this.btc_free_amount, 'BTC free');
      console.log(this.btc_locked_amount, 'BTC locked');
      console.log(this.busd_free_amount, 'BUSD free');
      console.log(this.busd_locked_amount, 'BUSD locked');
    }
  }
}

module.exports = { GridTrading };
