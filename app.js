const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: './.env' });

// Create an instance of the Express application
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the "public" directory (optional)
app.use(express.static(path.join(__dirname, 'public')));

// Define your routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Include your authentication routes (if any)
const userRoutes = require('./routes/user');
app.use('/user', userRoutes);

// ...

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

module.exports = app;
