// controllers/dashboardController.js
// ------------------------------------------------

const simpleParser = require('mailparser').simpleParser;
const { decrypt }        = require('../utils/encryption');
const { ImapFlow } = require('imapflow');
const pool = require('../models/userModels');
const { getLeadsByLeadIds } = require('../models/leadModel');
const { parseLeadFromText } = require('../utils/leadParser'); // dein Parser

exports.showDashboard = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const successMessage = req.session.successMessage;
  const errorMessage   = req.session.errorMessage;
  delete req.session.successMessage;
  delete req.session.errorMessage;
  res.render('dashboard', {
    email:         req.session.email,
    leads:         [],
    imapStatus:    'Noch keine E-Mails geladen.',
    emailsFetched: false,
    successMessage,
    errorMessage
  });
};

exports.fetchEmails = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  // 1) Datum aus Formular
  const sinceDateInput = req.body.sinceDate; // "YYYY-MM-DD"
  let sinceIMAP;
  try {
    const [y, m, d] = sinceDateInput.split('-').map(Number);
    // UTC Mitternacht
    sinceIMAP = new Date(Date.UTC(y, m - 1, d));
  } catch {
    sinceIMAP = new Date();
  }

  // 2) IMAP-Config aus DB laden
  const { rows } = await pool.query(
    'SELECT imap_host, imap_port, imap_user, imap_password FROM users WHERE id = $1',
    [req.session.userId]
  );
  const user = rows[0];
  if (!user.imap_host || !user.imap_user || !user.imap_password) {
    req.session.errorMessage = '⚠️ Keine IMAP-Daten hinterlegt.';
    return res.redirect('/dashboard');
  }

  // 3) Passwort entschlüsseln
  let imapPass;
  try { imapPass = decrypt(user.imap_password); }
  catch { imapPass = user.imap_password; }

  // 4) Verbindung aufbauen
  const client = new ImapFlow({
    host:   user.imap_host,
    port:   user.imap_port,
    secure: user.imap_port === 993,
    auth: { user: user.imap_user, pass: imapPass },
    logger: false
  });

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');

  let parsedLeads = [];
  let imapStatus;

  try {
    // 5) Suche seit dem Datum
    const uids = await client.search({
      since: sinceIMAP,
      subject: 'smartkredit AG - Erworbener Lead'
    });

    if (!uids.length) {
      imapStatus = `✅ Keine neuen Leads seit ${sinceDateInput}.`;
    } else {
      // 6) Fetch & parse
      const messages = client.fetch(uids, { envelope: true, source: true });
      for await (let msg of messages) {
        if (msg.envelope.subject?.trim() === 'smartkredit AG - Erworbener Lead') {
          const parsed = await simpleParser(msg.source);
          const lead = parseLeadFromText(parsed.text || '');
          if (!lead.validationErrors.length) {
            parsedLeads.push({
              subject: msg.envelope.subject,
              from:    msg.envelope.from[0].address,
              data:    lead
            });
          }
        }
      }
      imapStatus = `✅ ${parsedLeads.length} Lead(s) seit ${sinceDateInput} geladen.`;
    }
  } catch (err) {
    console.error('❌ Fehler bei IMAP-Abruf:', err);
    imapStatus = `❌ IMAP-Fehler: ${err.message}`;
  } finally {
    lock.release();
    await client.logout();
  }

  // 7) DB-Abgleich auf bereits gespeicherte Lead-IDs
  const mailLeadIds = parsedLeads
    .map(l => l.data.leadId)
    .filter(id => typeof id === 'number');

  const existing = mailLeadIds.length
    ? await getLeadsByLeadIds(mailLeadIds)
    : [];

  const existSet = new Set(existing.map(r => r.lead_id));
  parsedLeads = parsedLeads.map(l => ({
    ...l,
    inDb: existSet.has(l.data.leadId)
  }));

  // 8) Flash-Messages
  const successMessage = req.session.successMessage;
  const errorMessage   = req.session.errorMessage;
  delete req.session.successMessage;
  delete req.session.errorMessage;

  // in Session speichern, damit importLead darauf zugreifen kann
  req.session.parsedLeads = parsedLeads;

  // 9) Render
  res.render('dashboard', {
    email:         req.session.email,
    leads:         parsedLeads,
    imapStatus,
    emailsFetched: true,
    successMessage,
    errorMessage
  });
};

// controllers/dashboardController.js Ende