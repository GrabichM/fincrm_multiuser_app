// routes/inboundRoutes.js

const express = require("express");
const router = express.Router();

// Beispiel-Endpoint
router.get("/", (req, res) => {
  res.json({ success: true, message: "Inbound-Routes erreichbar" });
});

module.exports = router;

// routes/inboundRoutes.js Ende
