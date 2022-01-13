const express = require('express');
const cors = require('cors');
const { MessageBroker } = require('../msg-broker');

const api = express();
api.use(cors());

const msgBroker = new MessageBroker();

// api.post('/stop', async (req, res) => {
//   console.log('WEB API: STOP');
//   msgBroker.emit('stop');
//   res.status(200).json({});
// });

// api.post('/start', async (req, res) => {
//   console.log('WEB API: START');
//   msgBroker.emit('start');
//   res.status(200).json({});
// });
api.get('/', async (req, res) => {
  console.log('WEB API: PREVENT SLEEPING');
  res.status(200).json({ msg: 'Preventing app from sleeping' });
});

module.exports = {
  api,
};
