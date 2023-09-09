const mongoose = require('mongoose');
const proposalSchema = new mongoose.Schema({
  userFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
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
  eventDescription: {
    type: String,
    maxlength: 500,
  },

  eventAddress: {
    street: {
      type: String,
      required: true,
      maxlength: 100,
    },
    city: {
      type: String,
      required: true,
      maxlength: 100,
    },
    zipCode: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
      enum: [
        'Aveiro',
        'Beja',
        'Braga',
        'Bragança',
        'Castelo Branco',
        'Coimbra',
        'Évora',
        'Faro',
        'Guarda',
        'Leiria',
        'Lisboa',
        'Portalegre',
        'Porto',
        'Santarém',
        'Setúbal',
        'Viana do Castelo',
        'Vila Real',
        'Viseu',
      ],
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
  eventPrice: {
    priceType: {
      type: String,
      enum: ['fixed', 'negotiable'],
    },
    amount: {
      type: Number,
    },
    includedCosts: {
      Stay: {
        type: Boolean,
      },
      Food: {
        type: Boolean,
      },
      Travel: {
        type: Boolean,
      },
      Gear: {
        type: Boolean,
      },
      Other: {
        type: String,
        maxlength: 500,
      },
    },
  },

  eventExtraInfo: {
    type: String,
    maxlength: 500,
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
});

const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;
