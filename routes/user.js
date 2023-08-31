const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword); //here its patch because we are going to update a field "password" based in a valid token

module.exports = router;
