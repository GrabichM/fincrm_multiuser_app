// routes/leadRoutes.js
const express    = require('express');
const router     = express.Router();
const ensureAuth = require('../middleware/ensureAuth');
const leadCtrl   = require('../controllers/leadController');


router.get('/import-lead/:leadId',     ensureAuth, leadCtrl.importLead);
router.get('/test-fincrm-connection',  ensureAuth, leadCtrl.testFincrmConnection);
router.get('/test-smtp',               ensureAuth, leadCtrl.testSmtp);
router.get('/last-contact/:leadId',    ensureAuth, leadCtrl.lastContact);
router.get('/leads',                   ensureAuth, leadCtrl.listLeads);

module.exports = router;