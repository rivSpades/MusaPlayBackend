const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

const Calendar = mongoose.model('Calendar', calendarSchema);

module.exports = Calendar;
