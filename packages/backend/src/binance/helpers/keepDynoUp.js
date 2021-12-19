const axios = require('axios').default;
const keepDynoUp = (minutes, url) => {
  setInterval(() => {
    try {
      const currentHour = new Date().getUTCHours();
      if (currentHour < 12 || currentHour >= 18) {
        axios.get(url);
      }
    } catch (error) {
      console.log(error);
    }
  }, 1000 * 60 * minutes);
};
module.exports = { keepDynoUp };
