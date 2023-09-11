const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please tell us your first name!'],
    },
    lastName: {
      type: String,
      required: [true, 'Please tell us your last name!'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    birthDate: {
      type: { type: Date },
    },
    phone: {
      type: Number,
    },
    vat: {
      type: Number,
      maxlength: 9,
    },
    cc: {
      type: Number,
      maxlength: 8,
    },
    media: {
      profilePicture: {
        type: String,
        default: 'default.jpg',
      },
      videos: [
        {
          videoUrl: {
            type: String,
          },
          duration: {
            type: Number,
            max: 30,
          },
        },

        {
          validator: function () {
            return this.media.videos.length <= 3;
          },
          message: 'Cannot have more than 3 videos',
        },
      ],
    },

    type: {
      type: String,

      enum: ['client', 'talent'],
    },

    profile: {
      type: String,
      enum: ['project', 'individual'],
      validate: {
        validator: function () {
          return this.type === 'talent';
        },
        message: 'Client users cannot change profile',
      },
    },

    verification: {
      emailVerified: {
        type: Boolean,
        default: false,
      },
      phoneVerified: {
        type: Boolean,
        default: false,
      },
      ccVerified: {
        type: Boolean,
        default: false,
      },
      vatVerified: {
        type: Boolean,
        default: false,
      },
    },

    address: {
      street: {
        type: String,
        maxlength: 100,
      },
      city: {
        type: String,
        maxlength: 100,
      },
      district: {
        type: String,
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
    createdOn: {
      type: Date,
      default: Date.now,
    },
  },

  {
    toJSON: { virtuals: true }, //we need to allow virtuals fields show in the  Output JSON sent in the response
    toObject: { virtuals: true }, // also in a object format
  }
);

/*VIRTUAL FIELDS */
userSchema.virtual('verified').get(function () {
  if (
    this.verification.emailVerified &&
    this.verification.phoneVerified &&
    this.verification.ccVerified &&
    this.verification.vatVerified
  )
    return true;

  return false;
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
    type: 'talent',
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
