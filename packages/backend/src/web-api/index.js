const express = require('express');
const cors = require('cors');
const { MessageBroker } = require('../msg-broker');

const api = express();
api.use(cors());

const msgBroker = new MessageBroker();

api.post('/stop', async (req, res) => {
  console.log('WEB API: STOP');
  msgBroker.emit('stop');
  res.status(200).json({});
});

api.post('/start', async (req, res) => {
  console.log('WEB API: START');
  msgBroker.emit('start');
  res.status(200).json({});
});

module.exports = {
  api,
};
