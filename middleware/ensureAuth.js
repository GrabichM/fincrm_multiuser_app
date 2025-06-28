// middleware/ensureAuth.js

/**
 * Middleware zum Prüfen, ob der Benutzer eingeloggt ist.
 * Wenn nicht, wird er auf die Login-Seite weitergeleitet.
 */
module.exports = function ensureAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

// middleware/ensureAuth.js Ende