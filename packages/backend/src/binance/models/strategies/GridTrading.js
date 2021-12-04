const { Order } = require('../Order');

class GridTrading {
  name;
  account;
  btc_free_amount;
  btc_locked_amount;
  busd_free_amount;
  busd_locked_amount;

  grid_gap = 0.0005; //0.0125;
  grid_trailing_stop_gap = 0.0004; //0.0025;
  calculate_difference = 0.0005;

  initial_price = undefined;
  last_price = undefined;

  sellOrder = undefined;
  buyOrder = undefined;
  constructor(name = 'Grid Trading') {
    this.name = name;
  }
  run(data) {
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
      this.last_price = close_price;
      console.log(
        this.initial_price,
        ' Initial',
        this.last_price,
        ' Last calculated',
      );
      this.placeOrder();
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
    if (this.buyOrder) {
      //hay orden
      if (this.last_price < this.buyOrder.placedAt) {
        //hay que bajarla
        console.log(
          'Trailing buy order modified to ',
          this.last_price + this.last_price * this.grid_trailing_stop_gap,
        );
        this.buyOrder = {
          placedAt: this.last_price,
          price:
            this.last_price + this.last_price * this.grid_trailing_stop_gap,
        };
        console.log(`this.buyOrder `, this.buyOrder);
      }
    } else {
      //no hay orden
      if (this.last_price < this.initial_price * (1 - this.grid_gap)) {
        //supera el trigger, hay que crearla entonces
        console.log(
          'Place new buy order at ',
          this.last_price + this.last_price * this.grid_trailing_stop_gap,
        );

        const price =
          this.last_price + this.last_price * this.grid_trailing_stop_gap;
        const order = new Order(
          undefined,
          'BTCBUSD',
          price.toFixed(2),
          0.001,
          'GTC',
          'LIMIT',
          'BUY',
          undefined,
        );
        const res = await this.account.newOrder(order);
        console.log(res);
        this.buyOrder = {
          placedAt: this.last_price,
          price:
            this.last_price + this.last_price * this.grid_trailing_stop_gap,
        };
        console.log(`this.buyOrder `, this.buyOrder);
      }
    }
  }

  sell() {
    if (this.sellOrder) {
      //hay orden
      if (this.last_price > this.sellOrder.placedAt) {
        //hay que elevarla
        console.log(
          'Trailing sell order modified to ',
          (
            this.last_price -
            this.last_price * this.grid_trailing_stop_gap
          ).toString(),
        );
        this.sellOrder = {
          placedAt: this.last_price,
          price:
            this.last_price - this.last_price * this.grid_trailing_stop_gap,
        };
        console.log(`this.sellOrder `, this.sellOrder);
      }
    } else {
      //no hay orden
      if (this.last_price > this.initial_price * (1 + this.grid_gap)) {
        //supera el trigger, hay que crearla entonces
        console.log(
          'Place new sell order at ',
          (
            this.last_price -
            this.last_price * this.grid_trailing_stop_gap
          ).toString(),
        );
        this.sellOrder = {
          placedAt: this.last_price,
          price:
            this.last_price - this.last_price * this.grid_trailing_stop_gap,
        };
        console.log(`this.sellOrder `, this.sellOrder);
      }
    }
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
