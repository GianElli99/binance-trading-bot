require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendMessage } = require('./telegram');
const { getAccountInfo } = require('./binance');

const port = process.env.PORT;
const app = express();
app.use(cors());

app.get('/:message', async (req, res) => {
  const msg = req.params.message;
  const result = await sendMessage(msg);
  console.log(result);
  if (result.error) {
    res.status(500).send(result.message);
  } else {
    res.status(200).send(result.message);
  }
});

app.listen(port, () => {
  console.log('Server running on port ' + port);
  getAccountInfo();
});
