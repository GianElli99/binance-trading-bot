class Order {
  id;
  symbol;
  price;
  quantity;
  timeInForce;
  type;
  side;
  stopPrice;
  constructor(id, symbol, price, quantity, timeInForce, type, side, stopPrice) {
    this.id = id;
    this.symbol = symbol;
    this.price = price;
    this.quantity = quantity;
    this.timeInForce = timeInForce;
    this.type = type;
    this.side = side;
    this.stopPrice = stopPrice;
  }
  importantValues() {
    return {
      price: this.price,
      quantity: this.quantity,
      timeInForce: this.timeInForce,
      stopPrice: this.stopPrice,
    };
  }
}
module.exports = { Order };
