const express = require('express');
const cors = require('cors');

const broker = express();
broker.use(cors());
let telegram = undefined;

broker.post('/events/:eventName', async (req, res) => {
  const { eventName } = req.params;
  console.log(eventName);
  const result = await telegram.sendMessage(eventName);
  if (result.error) {
    res.status(500).send(result.message);
  } else {
    res.status(200).send(result.message);
  }
});

const addTelegramLogger = (telegramBot) => {
  telegramBot = telegramBot;
};

module.exports = {
  broker,
  addTelegramLogger,
};
