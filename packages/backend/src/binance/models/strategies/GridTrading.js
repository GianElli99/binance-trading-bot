class GridTrading {
  name;
  account;
  btc_free_amount;
  btc_locked_amount;
  busd_free_amount;
  busd_locked_amount;

  static grid_gap = 0.0125;
  static grid_trailing_stop_gap = 0.0025;
  calculate_difference = 0.0005;

  initial_price = undefined;
  constructor(name = 'Grid Trading') {
    this.name = name;
  }
  run(data) {
    if (!this.initial_price) {
      this.initial_price = Number(data.c);
      return;
    }
    let close_price = Number(data.c);
    if (
      Math.abs(close_price - this.initial_price) >
      this.initial_price * this.calculate_difference
    ) {
      console.log(this.initial_price, ' Initial ', close_price, ' Close');
      this.initial_price = close_price;
    }
  }
  async setInitialState() {
    const res = await this.account.accountInfo();
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
