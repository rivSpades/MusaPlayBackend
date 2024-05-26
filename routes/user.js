const express = require('express');
const authController = require('../controllers/auth');
const userController = require('../controllers/user');
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword); //here its patch because we are going to update a field "password" based in a valid token
router.post('/verify', authController.isLoggedIn, authController.verify); // New route for email verification
router.get(
  '/myDetails',
  authController.isLoggedIn,
  userController.getMyDetails
);

module.exports = router;
