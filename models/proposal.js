const mongoose = require('mongoose');
const proposalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  eventType: {
    type: String,
    enum: ['publico', 'privado'],
  },
  eventGenre: {
    type: [String], // Array of strings
    validate: {
      validator: function (genres) {
        return genres.length <= 5; // Validate that the array has at most 5 items
      },
      message: 'Event genres can have at most 5 items.',
    },
  },
  eventStartTime: {
    type: Date, // Store the full date and time
    required: true,
  },
  eventEndTime: {
    type: Date, // Store the full date and time
    required: true,
  },

  createdOn: {
    type: Date,
    default: Date.now,
  },
  deadlineDate: {
    type: Date,
    required: true,
  },
  paymentAmount: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return value > 0; // Check if paymentAmount is more than 0
      },
      message: 'Payment amount must be more than 0.',
    },
  },

  eventDescription: String,
  // Add other fields relevant to proposals
});

const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;
