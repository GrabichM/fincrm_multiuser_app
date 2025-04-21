// server.js

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const leadRoutes = require('./routes/leadRoutes');


const app = express();

// Settings
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET, // oder ein eigenes Session-Secret
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 } // 1 Stunde gültig
}));
app.use((req, res, next) => {
  res.locals.successMessage = req.session.successMessage;
  res.locals.errorMessage = req.session.errorMessage;

  // Danach Session-Messages löschen (sonst würden sie bleiben)
  delete req.session.successMessage;
  delete req.session.errorMessage;

  next();
});


// Routes
app.use('/', authRoutes);
app.use('/', leadRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
