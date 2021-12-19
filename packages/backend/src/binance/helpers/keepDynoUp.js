const axios = require('axios').default;
const keepDynoUp = (minutes, url) => {
  setInterval(() => {
    try {
      axios.get(url);
    } catch (error) {
      console.log(error);
    }
  }, 1000 * 60 * minutes);
};
module.exports = { keepDynoUp };
