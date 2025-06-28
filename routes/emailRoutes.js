// routes/emailRoutes.js
const express = require("express");
const router = express.Router();
const {
  showEmailForm,
  sendEmailToLead,
} = require("../controllers/authController");
const ensureAuth = require("../middleware/ensureAuth");

// GET  /email/send/:email
router.get("/send/:email", ensureAuth, showEmailForm);

// POST /email/send
router.post("/send", ensureAuth, sendEmailToLead);

module.exports = router;
