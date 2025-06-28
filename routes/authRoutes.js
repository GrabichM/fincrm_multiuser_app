// routes/authRoutes.js

require('dotenv').config();
const express = require('express');
const router  = express.Router();
const {
  showRegister,
  register,
  showLogin,
  login,
  logout,
  showDashboard
} = require('../controllers/authController');
const { fetchEmails } = require('../controllers/dashboardController');
const ensureAuth = require('../middleware/ensureAuth');

// Registrieren
router.get('/register', showRegister);
router.post('/register', register);

// Login
router.get('/login', showLogin);
router.post('/login', login);

// Logout
router.get('/logout', logout);

// Dashboard und E-Mail-Fetch
router.get('/dashboard', ensureAuth, showDashboard);
router.post('/fetch-emails', ensureAuth, fetchEmails);

module.exports = router;

// routes/authRoutes.js Ende