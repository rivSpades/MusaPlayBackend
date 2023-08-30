const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const Email = require('./../utils/email');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AppError = require('./../utils/appError');

const getJWTToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    // validating the login with JWT. Check also config.env file where the secret is defined.

    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendJWTTokenCookie = (user, statusCode, req, res) => {
  //this function will send the JWT token generated to the client in a cookie file for security reasons

  const token = getJWTToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), //converts days into ms

    //secure: true , we should removed from here, but basicly if sets to true only works for https protocol

    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true; //set cookie functionality https only into prod env
  }

  res.cookie('jwt', token, cookieOptions); //sends cookie to the client

  user.password = undefined; //removes the password from the output setting to undefined but won't save it on the db because we dont commit with .save()

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //function that handles the signup

  const newUser = await User.create({
    //only select the fields that we need to save in DB instead saving the whole body to avoid exploits
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get('host')}/myDetails`;
  await new Email(newUser, url).sendWelcome(); //send welcome email to the user

  sendJWTTokenCookie = (newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; // Get the email and password from the request body

  if (!email || !password) {
    // If the email or password is missing, return an error
    return next(new AppError('Provide an email and password', 400));
  }

  // Find the user by their email and select the password field
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.checkPassword(password, user.password))) {
    // If the user is not found or the password doesn't match, return an error
    return next(new AppError('Incorrect email or password', 401));
  }

  // Assuming you have the following function defined to send the JWT token as a cookie
  sendJWTTokenCookie(user, 200, req, res);
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // 1. Get the token from the request header or cookies
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in, because you don't have a token", 401)
    );
  }

  // 2. Verify the token's validity
  const verifyToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3. Check if the user still exists
  const currentUser = await User.findById(verifyToken.id);
  if (!currentUser) {
    return next(new AppError('The user no longer exists', 401));
  }

  // 4. Check if the user changed the password after the token was issued
  if (currentUser.changedPasswordAfter(verifyToken.iat)) {
    return next(
      new AppError('User recently changed password. Log in again', 401)
    );
  }

  // Attach the user details to the request
  req.user = currentUser;
  res.locals.user = currentUser; // This can be used in templates

  next(); // Move to the next middleware (e.g., grantPermissions)
});

exports.logout = (req, res) => {
  //As we cannot manipulate/delete the cookies in the front end  , this will do a request to the server and ask for a empty token cookie, which will be not valid , and the user will be no longer logged in
  res.cookie('jwt', 'loggedout', {
    //sends a cookie with a dummy message logged out
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }); // Find user by email

  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  const resetToken = user.generateResetToken(); // Generate reset token

  // Save the token to the user document (turn off validation)
  await user.save({ validateBeforeSave: false });

  // Build the reset URL
  const buildResetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  try {
    // Send password reset email
    await new Email(user, buildResetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'URL to reset password sent to email',
    });
  } catch (err) {
    // If sending email fails, reset the token fields and handle the error
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Something went wrong in the email service', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex'); // Hash the token from the URL

  // Find the user based on the hashed token and expiration date
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // Check if expiration date is greater than current time
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Update user's password and reset token fields
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Save the changes with validation
  await user.save();

  // Get a new JWT token and send it to the client
  const token = getJWTToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password'); // Find the user by their ID and select the password field

  // Check if the current password provided is correct
  if (!(await user.checkPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // Update the user's password and password confirmation fields
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // Save the changes with validation
  await user.save();

  // Assuming you have the following function defined to send the JWT token as a cookie
  sendJWTTokenCookie(user, 200, req, res);
});
