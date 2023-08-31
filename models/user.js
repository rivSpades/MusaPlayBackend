const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  userType: {
    type: String,
    enum: ['client', 'talent'],
  },

  profile: {
    type: {
      type: String,
      enum: ['project', 'individual'],
    },
  },

  availability: [
    {
      day: { type: Date, required: true },
      isAvailable: { type: Boolean, default: true },
    },
  ],

  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

/*MIDDLEWARES*/

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

/*CUSTOM METHODS*/

userSchema.methods.checkPassword = async function (
  inputPassword,
  hashedPassword
) {
  //.methods allows to create a custom method in the document level "checkPassword". This method will be avaliable and can be used for  all the documents
  return await bcrypt.compare(inputPassword, hashedPassword); //Returns true or false. "compare" is a method from bcrypt that compares if the password original password matches with the hashed password.
};

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.generateResetToken = function () {
  //this method will generate a random 32 chars long token and saves an encrypted version of the token in the DB

  const resetToken = crypto.randomBytes(32).toString('hex'); //generates a token with 32 chars long. This will be sent to the user and won't be saved in DB

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); //saves and encrypted version of the resetToken in the DB

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //10 min of expiration

  return resetToken;
};

userSchema.methods.findAvailableUsers = async function (date) {
  const availableUsers = await this.constructor.find({
    userType: 'talent',
    availability: {
      $elemMatch: {
        day: date,
        isAvailable: true,
      },
    },
  });
  return availableUsers;
};

userSchema.methods.updateAvailability = async function (date, isAvailable) {
  await this.constructor.updateOne(
    { email: this.email, 'availability.day': date },
    { $set: { 'availability.$.isAvailable': isAvailable } }
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User;
