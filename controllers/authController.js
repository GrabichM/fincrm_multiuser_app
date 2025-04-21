const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../models/userModel');
const { simpleParser } = require('mailparser');
const { ImapFlow } = require('imapflow');
const nodemailer = require('nodemailer');


// Seite "Registrieren" anzeigen
exports.showRegister = (req, res) => {
  res.render('register');
};

// Registrierung (neuer Benutzer)
exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Prüfen, ob Benutzer schon existiert
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      return res.send('⚠️ Benutzer existiert bereits!');
    }

    // Passwort verschlüsseln
    const hashedPassword = await bcrypt.hash(password, 10);

    // Benutzer speichern
    await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
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
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
      if (result.rows.length === 0) {
        return res.send('⚠️ Benutzer nicht gefunden!');
      }
  
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
  
      if (!match) {
        return res.send('❌ Passwort falsch!');
      }
  
      // Session speichern
      req.session.userId = user.id;
      req.session.email = user.email;
  
      console.log(`✅ Erfolgreich eingeloggt: ${email}`);
      res.redirect('/dashboard');
    } catch (error) {
      console.error('❌ Fehler beim Login:', error.message);
      res.send('❌ Fehler beim Login.');
    }
  };
  
  
  // Dashboard-Seite anzeigen
  exports.showDashboard = (req, res) => {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
  
    res.render('dashboard', { email: req.session.email, leads: [], imapStatus: 'Noch keine E-Mails geladen.', emailsFetched: false });
  };
  
  // Hilfsfunktionen für Korrekturen
function capitalizeFirstLetter(string) {
  if (!string) return '';
  string = string.trim().toLowerCase();
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatPostalCode(plz) {
  if (!plz) return '';
  return plz.replace(/\D/g, '').padStart(5, '0');
}

function formatPhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

function formatEmail(email) {
  if (!email) return '';
  return email.trim().toLowerCase();
}

function cleanText(text) {
  if (!text) return '';
  return text.trim();
}

  
  // Funktion um Leads zu parsen
  function parseLeadFromText(text) {
    const fields = {
      'Anrede': null,
      'Nachname': null,
      'Vorname': null,
      'Straße': null,
      'PLZ - Ort': null,
      'Geburtsdatum': null,
      'Telefon privat': null,
      'Telefon mobil': null,
      'Email': null,
      'Berufsstatus': null,
      'Aktuelle Wohnsituation': null,
      'Was finanzieren': null,
      'Immobilie Typ': null,
      'Grundstück Typ': null,
      'Immobilie Standort': null,
      'Nutzung': null,
      'Kaufpreis': null,
      'Weiterer Darlehensnehmer': null,
      'Darlehen': null,
      'Nettoeinkommen': null,
      'Finanzierungszeitraum': null,
      'Start': null,
      'Lead ID': null,
      'Buchungsdatum': null,
      'erreichbar': null,
      'Angebote anderer Banken': null
    };
  
    for (const field in fields) {
      let regex;
      if (field === 'Angebote anderer Banken') {
        regex = new RegExp(`${field}\\s*:\\s*([^;]*)`, 'i');
      } else {
        regex = new RegExp(`${field}\\s*:\\s*([^;\\n]*)`, 'i');
      }
      const match = text.match(regex);
      if (match && match[1]) {
        fields[field] = match[1].trim();
      }
    }
  
    const extracted = {};
  
    extracted.salutation = fields['Anrede'] || '';
    extracted.lastName = fields['Nachname'] || '';
    extracted.firstName = fields['Vorname'] || '';
    extracted.birthday = fields['Geburtsdatum'] || '';
    extracted.phone = fields['Telefon privat'] || '';
    extracted.mobile = fields['Telefon mobil'] || '';
    extracted.email = fields['Email'] || '';
    extracted.jobStatus = fields['Berufsstatus'] || '';
    extracted.livingSituation = fields['Aktuelle Wohnsituation'] || '';
    extracted.financeType = fields['Was finanzieren'] || '';
    extracted.propertyType = fields['Immobilie Typ'] || '';
    extracted.plotType = fields['Grundstück Typ'] || '';
    extracted.usage = fields['Nutzung'] || '';
    extracted.coBorrower = fields['Weiterer Darlehensnehmer'] || '';
    extracted.netIncome = fields['Nettoeinkommen'] || '';
    extracted.financingPeriod = fields['Finanzierungszeitraum'] || '';
    extracted.startDate = fields['Start'] || '';
    extracted.leadId = fields['Lead ID'] || '';
    extracted.available = fields['erreichbar'] || '';
    extracted.otherBankOffers = fields['Angebote anderer Banken'] || '';
  
    // Spezialbehandlungen
    if (fields['Straße']) {
      const streetMatch = fields['Straße'].match(/^(.+?)\s+(\d+\w*)$/);
      if (streetMatch) {
        extracted.street = streetMatch[1].trim();
        extracted.streetNumber = streetMatch[2].trim();
      } else {
        extracted.street = fields['Straße'].trim();
        extracted.streetNumber = '';
      }
    }
  
    if (fields['PLZ - Ort']) {
      const plzOrtMatch = fields['PLZ - Ort'].match(/(\d{5})\s*-\s*(.+)/);
      if (plzOrtMatch) {
        extracted.postalCode = plzOrtMatch[1];
        extracted.city = plzOrtMatch[2].trim();
      }
    }
  
    if (fields['Immobilie Standort']) {
      const propertyMatch = fields['Immobilie Standort'].match(/(\d{5}),\s*(.+)/);
      if (propertyMatch) {
        extracted.propertyPostalCode = propertyMatch[1];
        extracted.propertyCity = propertyMatch[2].trim();
      }
    }
  
    if (fields['Kaufpreis']) {
      const priceMatch = fields['Kaufpreis'].replace(/\D/g, '');
      extracted.purchasePrice = priceMatch ? parseInt(priceMatch, 10) : null;
    }
  
    if (fields['Darlehen']) {
      const loanMatch = fields['Darlehen'].replace(/\D/g, '');
      extracted.loanAmount = loanMatch ? parseInt(loanMatch, 10) : null;
    }
  
    if (fields['Buchungsdatum']) {
      const dateMatch = fields['Buchungsdatum'].match(/(\d{2}\.\d{2}\.\d{4})/);
      if (dateMatch) {
        extracted.bookingDate = dateMatch[1];
      }
    }
  
    const validationErrors = [];
  
    if (!extracted.firstName || !extracted.lastName) {
      validationErrors.push('Vorname oder Nachname fehlt.');
    }
    if (!extracted.email || !extracted.email.includes('@')) {
      validationErrors.push('Ungültige oder fehlende E-Mail.');
    }
    if (!extracted.postalCode || !/^\d{5}$/.test(extracted.postalCode)) {
      validationErrors.push('Ungültige PLZ.');
    }
    if (!extracted.city) {
      validationErrors.push('Ort fehlt.');
    }
    if (!extracted.phone && !extracted.mobile) {
      validationErrors.push('Mindestens eine Telefonnummer muss vorhanden sein.');
    }
  
    extracted.validationErrors = validationErrors;
  
    // Formatierungen
    extracted.firstName = capitalizeFirstLetter(extracted.firstName);
    extracted.lastName = capitalizeFirstLetter(extracted.lastName);
    extracted.city = capitalizeFirstLetter(extracted.city);
    extracted.propertyCity = capitalizeFirstLetter(extracted.propertyCity);
    extracted.street = capitalizeFirstLetter(extracted.street);
  
    extracted.postalCode = formatPostalCode(extracted.postalCode);
    extracted.propertyPostalCode = formatPostalCode(extracted.propertyPostalCode);
  
    extracted.phone = formatPhoneNumber(extracted.phone);
    extracted.mobile = formatPhoneNumber(extracted.mobile);
  
    extracted.email = formatEmail(extracted.email);
  
    extracted.jobStatus = cleanText(extracted.jobStatus);
    extracted.livingSituation = cleanText(extracted.livingSituation);
    extracted.available = cleanText(extracted.available);
  
    return extracted;
  }
  
  
  
  
  
  
  
  
  
  

// Middleware zum Überprüfen, ob der Benutzer eingeloggt ist
  exports.logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Fehler beim Logout:', err.message);
      }
      res.redirect('/login');
    });
  };
  
  // Einstellungen anzeigen
exports.showSettings = (req, res) => {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    res.render('settings');
  };
  
  // Einstellungen speichern
  exports.saveSettings = async (req, res) => {
    const { imap_host, imap_port, imap_user, imap_password, fincrm_token } = req.body;
  
    try {
      await pool.query(
        'UPDATE users SET imap_host = $1, imap_port = $2, imap_user = $3, imap_password = $4, fincrm_token = $5 WHERE id = $6',
        [imap_host, imap_port, imap_user, imap_password, fincrm_token, req.session.userId]
      );
      console.log('✅ Einstellungen gespeichert!');
      res.redirect('/dashboard');
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Einstellungen:', error); // vollständiges Error-Objekt ausgeben
        res.status(500).send('❌ Fehler beim Speichern der Einstellungen.');
      }
      
  };

  // E-Mails abrufen und Leads parsen
  exports.fetchEmails = async (req, res) => {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    global.leads = [];
  
    const sinceDate = req.body.sinceDate || new Date().toISOString().slice(0, 10); // Standard: heute
    const sinceIMAP = new Date(sinceDate);
  
    let imapStatus = 'IMAP-Verbindung nicht getestet.';
    let parsedLeads = [];
  
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
      const user = result.rows[0];
  
      if (!user.imap_host || !user.imap_user || !user.imap_password || !user.imap_port) {
        imapStatus = '⚠️ Keine IMAP-Daten hinterlegt.';
      } else {
        const client = new ImapFlow({
          host: user.imap_host,
          port: user.imap_port,
          secure: user.imap_port === 993,
          auth: {
            user: user.imap_user,
            pass: user.imap_password
          }
        });
  
        await client.connect();
        let lock = await client.getMailboxLock('INBOX');
  
        try {
          let messages = await client.search({
            since: sinceIMAP,
            subject: 'smartkredit AG - Erworbener Lead'
          });
  
          if (messages.length === 0) {
            imapStatus = '✅ Keine neuen relevanten E-Mails gefunden.';
          } else {
            let fetched = await client.fetch(messages, { envelope: true, source: true });
  
            for await (let message of fetched) {
              if (message.envelope.subject && message.envelope.subject.trim() === 'smartkredit AG - Erworbener Lead') {
                let parsed = await simpleParser(message.source);
                let bodyText = parsed.text || '';
  
                const extractedLead = parseLeadFromText(bodyText);
  
                if (Object.keys(extractedLead).length > 0) {
                  parsedLeads.push({
                    subject: message.envelope.subject,
                    from: message.envelope.from[0].address,
                    data: extractedLead
                  });
                }
              }
            }
  
            imapStatus = `✅ ${parsedLeads.length} Lead(s) geladen.`;
          }
        } finally {
          lock.release();
        }
  
        await client.logout();
      }
    } catch (error) {
      console.error('❌ Fehler bei E-Mail-Abruf:', error.message);
      imapStatus = `❌ IMAP-Verbindung fehlgeschlagen: ${error.message}`;
    }
  
    // HIER: Alle Leads global speichern ✅
    global.leads = parsedLeads;
  
    res.render('dashboard', { email: req.session.email, leads: parsedLeads, imapStatus, emailsFetched: true });
  };
  

  // Formular anzeigen
  exports.showEmailForm = (req, res) => {
    const leadEmail = req.params.email;
    const leadName = req.query.name || '';
    const leadOrt = req.query.ort || '';
    const leadTelefon = req.query.telefon || '';
    const leadId = req.query.leadid || '';
  
    res.render('sendEmail', { leadEmail, leadName, leadOrt, leadTelefon, leadId });
  };
  
  

// E-Mail versenden
exports.sendEmailToLead = async (req, res) => {
  const { to, subject, message, customerName } = req.body;

  try {
    const processedMessage = message.replace(/\[Name\]/g, customerName);

    const transporter = nodemailer.createTransport({
      host: 'mail.agenturserver.de',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"Dein Unternehmen" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: processedMessage
    });

    console.log(`✅ E-Mail erfolgreich an ${to} gesendet.`);

    req.session.successMessage = `✅ E-Mail erfolgreich an ${to} gesendet.`;
    res.redirect('/dashboard');
  } catch (error) {
    console.error('❌ Fehler beim E-Mail Versand:', error.message);

    req.session.errorMessage = `❌ Fehler beim Senden der E-Mail: ${error.message}`;
    res.redirect('/dashboard');
  }
};

