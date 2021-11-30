class Order {
  id;
  symbol;
  price;
  quantity;
  timeInForce;
  type;
  side;
  constructor(id, symbol, price, quantity, timeInForce, type, side) {
    this.id = id;
    this.symbol = symbol;
    this.price = price;
    this.quantity = quantity;
    this.timeInForce = timeInForce;
    this.type = type;
    this.side = side;
  }
  importantValues() {
    return {
      price: this.price,
      quantity: this.quantity,
      timeInForce: this.timeInForce,
    };
  }
}
module.exports = { Order };
