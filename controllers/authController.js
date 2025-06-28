// controllers/authController.js

const bcrypt = require('bcryptjs');
const pool = require('../models/userModels');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const { encrypt, decrypt } = require('../utils/encryption');
const { getAllLeads } = require('../models/leadModel');

// Seite "Registrieren" anzeigen
exports.showRegister = (req, res) => {
  res.render('register');
};

// Registrierung (neuer Benutzer)
exports.register = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      return res.send('⚠️ Benutzer existiert bereits!');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (email, password)
       VALUES ($1, $2)`,
      [email, hashedPassword]
    );
    console.log(`✅ Neuer Benutzer registriert: ${email}`);
    res.redirect('/login');
  } catch (error) {
    console.error('❌ Fehler bei Registrierung:', error.message);
    res.send('❌ Fehler bei der Registrierung.');
  }
};

// Login-Seite anzeigen
exports.showLogin = (req, res) => {
    res.render('login');
  };
  
// Login-Prozess verarbeiten
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('Login-Versuch für E-Mail:', email);
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.send('⚠️ Benutzer nicht gefunden!');
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.send('❌ Passwort falsch!');
    }
    req.session.userId = user.id;
    req.session.email = user.email;
    console.log(`✅ Erfolgreich eingeloggt: ${email}`);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('❌ Fehler beim Login:', error.message);
    res.send('❌ Fehler beim Login.');
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('❌ Fehler beim Logout:', err.message);
    res.redirect('/login');
  });
};
  
  
  // Dashboard-Seite anzeigen
exports.showDashboard = (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const successMessage = req.session.successMessage || null;
  const errorMessage   = req.session.errorMessage   || null;
  delete req.session.successMessage;
  delete req.session.errorMessage;
  res.render('dashboard', {
    email: req.session.email,
    leads: [],
    imapStatus: 'Noch keine E-Mails geladen.',
    emailsFetched: false,
    successMessage,
    errorMessage
  });
};
  
// Einstellungen anzeigen
exports.showSettings = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { rows } = await pool.query(`
    SELECT imap_host, imap_port, imap_user, imap_password,
           smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass_enc, smtp_from,
           fincrm_subdomain, fincrm_token
      FROM users WHERE id = $1
  `, [req.session.userId]);
  const user = rows[0] || {};
  const imapPassMasked = user.imap_password ? '********' : '';
  const smtpPassMasked = user.smtp_pass_enc ? '********' : '';
  const apiTokenMasked = user.fincrm_token ? '********' : '';
  const successMessage = req.session.successMessage;
  const errorMessage   = req.session.errorMessage;
  delete req.session.successMessage;
  delete req.session.errorMessage;
  res.render('settings', {
    user: {
      imap_host: user.imap_host, imap_port: user.imap_port, imap_user: user.imap_user,
      imap_password: imapPassMasked,
      smtp_host: user.smtp_host, smtp_port: user.smtp_port,
      smtp_secure: user.smtp_secure, smtp_user: user.smtp_user,
      smtp_pass: smtpPassMasked, smtp_from: user.smtp_from,
      fincrm_subdomain: user.fincrm_subdomain, fincrm_api_token: apiTokenMasked
    },
    successMessage, errorMessage
  });
};
  
// Einstellungen speichern
exports.saveSettings = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const input   = req.body;
  const updates = [];
  const values  = [];
  let   idx     = 1;

  // IMAP
  if (input.imap_host) {
    updates.push(`imap_host = $${idx}`); values.push(input.imap_host); idx++;
  }
  if (input.imap_port) {
    updates.push(`imap_port = $${idx}`); values.push(input.imap_port); idx++;
  }
  if (input.imap_user) {
    updates.push(`imap_user = $${idx}`); values.push(input.imap_user); idx++;
  }
  if (input.imap_password && input.imap_password !== '********') {
    updates.push(`imap_password = $${idx}`); values.push(encrypt(input.imap_password)); idx++;
  }

  // SMTP
  if (input.smtp_host) {
    updates.push(`smtp_host = $${idx}`); values.push(input.smtp_host); idx++;
  }
  if (input.smtp_port) {
    updates.push(`smtp_port = $${idx}`); values.push(input.smtp_port); idx++;
  }
  if (typeof input.smtp_secure !== 'undefined') {
    updates.push(`smtp_secure = $${idx}`); values.push(input.smtp_secure === 'on' || input.smtp_secure === 'true'); idx++;
  }
  if (input.smtp_user) {
    updates.push(`smtp_user = $${idx}`); values.push(input.smtp_user); idx++;
  }
  if (input.smtp_pass && input.smtp_pass !== '********') {
    updates.push(`smtp_pass_enc = $${idx}`); values.push(encrypt(input.smtp_pass)); idx++;
  }
  if (input.smtp_from) {
    updates.push(`smtp_from = $${idx}`); values.push(input.smtp_from); idx++;
  }

  // finCRM
  if (input.fincrm_subdomain) {
    updates.push(`fincrm_subdomain = $${idx}`); values.push(input.fincrm_subdomain); idx++;
  }
  if (input.fincrm_api_token && input.fincrm_api_token !== '********') {
    updates.push(`fincrm_token = $${idx}`); values.push(input.fincrm_api_token); idx++;
  }

  // Nur updaten, wenn tatsächliche Änderungen vorliegen
  if (updates.length > 0) {
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`;
    values.push(req.session.userId);
    try {
      await pool.query(sql, values);
      req.session.successMessage = '✅ Einstellungen wurden gespeichert.';
    } catch (err) {
      console.error('❌ Fehler beim Speichern der Einstellungen:', err.message);
      req.session.errorMessage = '❌ Fehler beim Speichern der Einstellungen.';
    }
  }

  res.redirect('/settings');
}; 

// Formular zum E-Mail-Versand
exports.showEmailForm = (req, res) => {
  const { email, name, ort, telefon, leadid } = req.query;
  res.render('sendEmail', { leadEmail: email, leadName: name, leadOrt: ort, leadTelefon: telefon, leadId: leadid });
};
  
// E-Mail versenden an Lead
exports.sendEmailToLead = async (req, res) => {
  const { to, subject, message, customerName } = req.body;
  try {
    // SMTP-Einstellungen aus DB laden
    const { rows } = await pool.query(
      'SELECT smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass_enc, smtp_from FROM users WHERE id = $1',
      [req.session.userId]
    );
    const smtp = rows[0];
    if (!smtp?.smtp_host || !smtp.smtp_user || !smtp.smtp_pass_enc) {
      req.session.errorMessage = '❌ SMTP-Daten fehlen. Bitte in den Einstellungen hinterlegen.';
      return res.redirect('/settings');
    }

    // Passwort entschlüsseln (oder Klartext nutzen)
    let smtpPass;
    try {
      smtpPass = decrypt(smtp.smtp_pass_enc);
    } catch {
      smtpPass = smtp.smtp_pass_enc;
    }

    // Transporter erstellen
    const transporter = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: Number(smtp.smtp_port) || 587,
      secure: Boolean(smtp.smtp_secure),
      auth: { user: smtp.smtp_user, pass: smtpPass }
    });

    // Nachricht personalisieren
    const processedMessage = message.replace(/\[Name\]/g, customerName);

    // Mail versenden
    await transporter.sendMail({
      from: smtp.smtp_from || smtp.smtp_user,
      to,
      subject,
      html: processedMessage
    });

    req.session.successMessage = `✅ E-Mail erfolgreich an ${to} gesendet.`;
    console.log(`✅ E-Mail erfolgreich an ${to} gesendet.`);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('❌ Fehler beim E-Mail Versand:', error.message);
    req.session.errorMessage = `❌ Fehler beim Senden der E-Mail: ${error.message}`;
    res.redirect('/dashboard');
  }
};

// controllers/authController.js Ende