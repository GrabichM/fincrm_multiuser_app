// webmailer/mailerRoutes.js

const express = require('express');
const router = express.Router();
const ensureAuth = require('../middleware/ensureAuth');
const {
  showMailerForm,
  sendMailerEmail,
  showTemplates,
  saveTemplate,
  showHistory
} = require('./mailerController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/', ensureAuth, showMailerForm);

router.get('/templates', ensureAuth, showTemplates);
router.post('/templates', ensureAuth, saveTemplate);

router.get('/history', ensureAuth, showHistory);

router.post('/send', ensureAuth, upload.single('attachment'), sendMailerEmail);

module.exports = router;
