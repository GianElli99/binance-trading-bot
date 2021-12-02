const express = require('express');
const cors = require('cors');
const { MessageBroker } = require('../msg-broker');

const api = express();
api.use(cors());

const msgBroker = new MessageBroker();

api.post('/:message', async (req, res) => {
  const msg = req.params.message;
  console.log('Message in WEB API', msg);
  msgBroker.emit('testMessage', msg);
  res.json(msg);
});

module.exports = {
  api,
};
