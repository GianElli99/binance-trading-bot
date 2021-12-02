class GridTrading {
  shouldContinue;
  constructor() {
    this.shouldContinue = true;
  }
  run() {
    setTimeout(() => {
      console.log('GridTrading');
      if (this.shouldContinue) {
        this.run();
      }
    }, 2000);
  }
  stop() {
    this.shouldContinue = false;
  }
}

module.exports = { GridTrading };
