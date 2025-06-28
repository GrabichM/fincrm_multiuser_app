// utils/imapFetchLeads.js

const { ImapFlow }        = require('imapflow');
const { simpleParser }    = require('mailparser');
const { decrypt }         = require('./encryption');
const { parseLeadFromText } = require('./leadParser');
const pool                = require('../models/userModels');

/**
 * Verbindet sich mit dem IMAP-Server des aktuell eingeloggten Users,
 * lädt alle Mails seit req.body.sinceDate mit dem Lead-Betreff,
 * parst sie und liefert ein Array mit Lead-Objekten.
 * @param {Express.Request} req 
 * @returns {Promise<Array<{subject:string,from:string,data:object}>>}
 */
async function imapFetchLeads(req) {
  // 1) User mit IMAP-Daten
  const { rows } = await pool.query(
    'SELECT imap_host, imap_port, imap_user, imap_password FROM users WHERE id = $1',
    [req.session.userId]
  );
  const user = rows[0];
  if (!user?.imap_host || !user?.imap_port || !user?.imap_user || !user?.imap_password) {
    throw new Error('IMAP-Daten unvollständig');
  }

  // 2) Passwort entschlüsseln
  let imapPass;
  try { imapPass = decrypt(user.imap_password); }
  catch { imapPass = user.imap_password; }

  // 3) Datum aus Request
  const sinceDate = req.body.sinceDate || new Date().toISOString().slice(0,10);
  const sinceIMAP = new Date(sinceDate);

  // 4) Verbindung aufbauen
  const client = new ImapFlow({
    host:   user.imap_host,
    port:   user.imap_port,
    secure: user.imap_port === 993,
    auth:   { user: user.imap_user, pass: imapPass }
  });
  await client.connect();

  // 5) Mails suchen und parsen
  const parsedLeads = [];
  const lock = await client.getMailboxLock('INBOX');
  try {
    const uids = await client.search({ since: sinceIMAP, subject: 'smartkredit AG - Erworbener Lead' });
    if (uids.length === 0) return [];

    const fetcher = client.fetch(uids, { envelope: true, source: true });
    for await (let msg of fetcher) {
      if (msg.envelope.subject?.trim() === 'smartkredit AG - Erworbener Lead') {
        const parsed = await simpleParser(msg.source);
        const leadData = parseLeadFromText(parsed.text || '');
        // nur gültige Leads
        if (!leadData.validationErrors.length) {
          parsedLeads.push({
            subject: msg.envelope.subject,
            from:    msg.envelope.from[0].address,
            data:    leadData
          });
        }
      }
    }
  } finally {
    lock.release();
    await client.logout();
  }

  return parsedLeads;
}

module.exports = imapFetchLeads;
