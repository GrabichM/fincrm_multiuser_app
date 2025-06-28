// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const leadRoutes = require("./routes/leadRoutes");
const inboundRoutes = require("./routes/inboundRoutes");
const authRoutes = require("./routes/authRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const emailRoutes = require("./routes/emailRoutes");
const app = express();
const mailerRoutes = require('./webmailer/mailerRoutes');

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // auf true setzen, wenn Du HTTPS nutzt
      maxAge: 1000 * 60 * 60 * 2, // 2 Stunden
    },
  }),
);

// View Engine Setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Webmailer
app.use('/mailer', mailerRoutes);

// Mount API-Routes
app.use("/api/inbound", inboundRoutes);

// Auth-, Dashboard- und Fetch-Routes
app.use("/", authRoutes);

// Lead-Import und FinCRM-Test
app.use("/", leadRoutes);

// Settings-Page
app.use("/settings", settingsRoutes);

// E-Mail-Versand-Formular
app.use("/email", emailRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.path.startsWith("/api/")) {
    // API-Antwort als JSON
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
  // Für alle anderen Routen eine einfache HTML-Antwort
  return res
    .status(500)
    .send(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>500</title></head><body><h1>500 – Internal Server Error</h1></body></html>',
    );
});

// Start Server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} ist bereits belegt. Bitte ENV-VARIABLE PORT anpassen oder Prozess beenden.`,
    );
    process.exit(1);
  }
});
// server.js Ende
