class GridTrading {
  name;
  constructor(name = 'Grid Trading') {
    this.name = name;
  }
  run(data) {
    console.log('The price is ' + data.c);
  }
}

module.exports = { GridTrading };
