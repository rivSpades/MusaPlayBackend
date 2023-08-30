const express = require('express');
const authController = require('./../controllers/auth');
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword); //here its patch because we are going to update a field "password" based in a valid token
router.patch(
  '/updateMyPassword',
  authController.isLoggedIn,
  authController.updatePassword
); //run the function first to check if the user is logged in ,if so , then runs the updatePassword workflow where the user inputs the current password , new password, new confirm password ,

module.exports = router;
