const express = require('express');
const router = express.Router();
const { importCustomer, importLead } = require('../controllers/leadController');

// Importieren als **Kunde** (Customer + Purpose)
router.get('/import-customer/:leadId', importCustomer);

// Importieren als **Lead** (nur Lead-Objekt)
router.get('/import-lead/:leadId', importLead);

module.exports = router;
