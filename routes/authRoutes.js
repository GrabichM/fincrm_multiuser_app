const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/register', authController.showRegister);
router.post('/register', authController.register);
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/dashboard', authController.showDashboard);
router.get('/logout', authController.logout);
router.get('/settings', authController.showSettings);
router.post('/settings', authController.saveSettings);
router.post('/fetch-emails', authController.fetchEmails);
router.get('/send-email/:email', authController.showEmailForm);
router.post('/send-email', authController.sendEmailToLead);




module.exports = router;
