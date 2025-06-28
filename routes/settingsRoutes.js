// routes/settingsRoutes.js
const express = require("express");
const router = express.Router();
const { showSettings, saveSettings } = require("../controllers/authController");
const ensureAuth = require("../middleware/ensureAuth"); // falls noch nicht vorhanden

// Nur eingeloggte Benutzer
router.use(ensureAuth);

// Einstellungen anzeigen & speichern
router.get("/", showSettings);
router.post("/", saveSettings);

module.exports = router;

// routes/settingsRoutes.js Ende
