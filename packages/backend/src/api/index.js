const express = require('express');
const cors = require('cors');

const api = express();
api.use(cors());
let telegramLogger = undefined;

api.get('/:message', async (req, res) => {
  const msg = req.params.message;
  const result = await telegramLogger.sendMessage(msg);
  console.log(result);
  if (result.error) {
    res.status(500).send(result.message);
  } else {
    res.status(200).send(result.message);
  }
});

const addTelegramLogger = (telegramBot) => {
  telegramLogger = telegramBot;
};

module.exports = {
  api,
  addTelegramLogger,
};
