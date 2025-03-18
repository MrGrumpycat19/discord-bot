const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello. I am alive!');
});

function keepAlive() {
  app.listen(3000, () => {
    console.log('Server is ready.');
  });
}

module.exports = keepAlive;