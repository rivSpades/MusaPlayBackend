const mongoose = require('mongoose');
const AppError = require('../utils/appError');

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
    return next(
      new AppError('Reviews can only be saved for completed proposals.', 400)
    );
  }

  if (
    !proposal.userFrom.equals(this.user) &&
    !proposal.userTo.equals(this.user)
  ) {
    return next(
      new AppError('You can only review users from the same proposal.', 400)
    );
  }

  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
