const express = require('express');

const mongoose = require('mongoose');
const dotenv = require('dotenv');

const path = require('path');

dotenv.config({ path: './.env' });
const app = express();
app.get('/', (req, res) => {
  res.send('Hello World!');
});

module.exports = app;
