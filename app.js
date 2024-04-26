const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: './.env' });

// Create an instance of the Express application
const app = express();
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

app.use(helmet());

//Parameter duplication , activate this later with the paramaters that we need to whitelist. The ones below are just placeholders as an example
/*app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
)*/

app.use(cors()); //allow access to all urls to everyone (get , post)

app.use(hpp()); //no paramater duplication

const limiter = rateLimit({
  max: 100, // Max 100 requests per hour
  windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use(limiter);

// Middleware to parse JSON requests
app.use(express.json({ limit: '10kb' })); //limits the body file up to 10kb of information to be sent to the server

// Data sanitization against NoSQL query injection
app.use(mongoSanitize()); //removes all the $ from the body

// Data sanitization against XSS
app.use(xss()); //disable all the html or js by adding extra codes

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
