const User = require('../models/user');

exports.getMyDetails = async (req, res, next) => {
  try {
    // Find the current user by ID
    const user = await User.findById(req.user.id);

    // If user not found, return error
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    // Send the response with user's firstName and lastName
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          verification: user.verification,
          verified: user.verified,
          emailVerificationCode: user.emailVerificationCode && true,
          mobileVerificationCode: user.mobileVerificationCode && true,
        },
      },
    });
  } catch (err) {
    // If any error occurs, pass it to the error handling middleware
    next(err);
  }
};
