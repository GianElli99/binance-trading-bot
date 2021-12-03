const express = require('express');
const cors = require('cors');
const { MessageBroker } = require('../msg-broker');

const api = express();
api.use(cors());

const msgBroker = new MessageBroker();

api.post('/stop', async (req, res) => {
  console.log('Stopping received in WEB API');
  msgBroker.emit('stop');
  res.json('Stop procces started');
});
api.post('/start', async (req, res) => {
  console.log('Start received in WEB API');
  msgBroker.emit('start');
  res.json('Start procces started');
});

api.post('/test/:message', async (req, res) => {
  const msg = req.params.message;
  console.log('Message in WEB API', msg);
  msgBroker.emit('testMessage', msg);
  res.json(msg);
});

module.exports = {
  api,
};
