const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  text: {
    type: String,

    maxlength: 500,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true,
  },
});

reviewSchema.pre('save', async function (next) {
  const Proposal = mongoose.model('Proposal');
  const proposal = await Proposal.findById(this.proposal);

  if (!proposal || proposal.status !== 'completed') {
    const error = new Error(
      'Reviews can only be saved for completed proposals.'
    );
    return next(error);
  }

  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
