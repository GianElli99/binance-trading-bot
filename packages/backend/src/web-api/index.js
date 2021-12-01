const express = require('express');
const cors = require('cors');

const api = express();
api.use(cors());

api.get('/:message', async (req, res) => {
  const msg = req.params.message;
  console.log(msg);
  res.json(msg);
});

// const addTelegramLogger = (telegramBot) => {
//   telegramBot = telegramBot;
// };

module.exports = {
  api,
  // addTelegramLogger,
};
