// controllers/leadController.js
// ------------------------------------------------

const {
  getAllLeads,
  getLeadByLeadId,
  saveLead,
  markMailSent,
  markLastContact,
} = require("../models/leadModel");
const {
  sendLeadConfirmationEmail,
  sendLastContactAttemptEmail,
} = require("../utils/mailer");
const { importLeadToFincrm } = require('../utils/fincrmLeadApi');
const pool = require("../models/userModels");
const { createFincrmApiClient } = require("../utils/fincrmClient");
const imapFetchLeads = require("../utils/imapFetchLeads");

exports.fetchEmails = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  let parsedLeads = [];
  let imapStatus = "IMAP-Verbindung nicht getestet.";
  try {
    parsedLeads = await imapFetchLeads(req);
    imapStatus = parsedLeads.length
      ? `✅ ${parsedLeads.length} Lead(s) geladen.`
      : "✅ Keine neuen relevanten E-Mails gefunden.";
  } catch (err) {
    console.error("❌ Fehler beim E-Mail-Abruf:", err.message);
    parsedLeads = [];
    imapStatus = `❌ IMAP-Fehler: ${err.message}`;
  }

  // in Session speichern, damit importLead darauf zugreifen kann
  req.session.parsedLeads = parsedLeads;
  res.render("dashboard", {
    email: req.session.email,
    leads: parsedLeads,
    imapStatus,
    emailsFetched: true,
    successMessage,
    errorMessage,
  });
};

/** Test FinCRM-Connection */
exports.testFincrmConnection = async (req, res) => {
  const { rows } = await pool.query(
    "SELECT fincrm_subdomain, fincrm_token FROM users WHERE id = $1",
    [req.session.userId],
  );
  const user = rows[0];
  if (!user?.fincrm_subdomain || !user?.fincrm_token) {
    req.session.errorMessage = "❌ FinCRM-Zugangsdaten fehlen.";
    return res.redirect("/settings");
  }
  try {
    const api = createFincrmApiClient(user);
    const response = await api.get("/customers");
    req.session.successMessage =
      response.status === 200
        ? "✅ FinCRM Verbindung erfolgreich!"
        : "❌ Unerwartete Antwort von FinCRM.";
  } catch (err) {
    console.error(err);
    req.session.errorMessage = "❌ Verbindung fehlgeschlagen.";
  }
  res.redirect("/settings");
};

/** Test SMTP-Connection */
exports.testSmtp = async (req, res) => {
  const { rows } = await pool.query(
    "SELECT smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass_enc FROM users WHERE id = $1",
    [req.session.userId],
  );
  const smtp = rows[0];
  if (!smtp?.smtp_host) {
    req.session.errorMessage = "❌ SMTP-Daten fehlen.";
    return res.redirect("/settings");
  }
  let pass;
  try {
    pass = decrypt(smtp.smtp_pass_enc);
  } catch {
    pass = smtp.smtp_pass_enc;
  }
  const transporter = nodemailer.createTransport({
    host: smtp.smtp_host,
    port: Number(smtp.smtp_port) || 587,
    secure: Boolean(smtp.smtp_secure),
    auth: { user: smtp.smtp_user, pass },
  });
  try {
    await transporter.verify();
    req.session.successMessage = "✅ SMTP-Verbindung erfolgreich!";
  } catch (err) {
    console.error(err);
    req.session.errorMessage = "❌ SMTP-Verbindung fehlgeschlagen.";
  }
  res.redirect("/settings");
};

/** Lead in finCRM importieren */
exports.importLead = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const leadIdParam = parseInt(req.params.leadId, 10);
  const parsedLeads = req.session.parsedLeads || [];

  // 1) gefundenen Lead-Datensatz
  const entry = parsedLeads.find((l) => Number(l.data.leadId) === leadIdParam);
  if (!entry) {
    req.session.errorMessage =
      "❌ Bitte zuerst E-Mails abrufen und dann diesen Lead auswählen.";
    return res.redirect("/dashboard");
  }

  const lead = entry.data;

  try {
    // 2) FinCRM-Zugang prüfen
    const { rows } = await pool.query(
      "SELECT fincrm_subdomain, fincrm_token FROM users WHERE id = $1",
      [req.session.userId],
    );
    const user = rows[0];
    if (!user?.fincrm_subdomain || !user?.fincrm_token) {
      req.session.errorMessage =
        "❌ FinCRM-Zugangsdaten fehlen. Bitte in den Einstellungen hinterlegen.";
      return res.redirect("/settings");
    }

    // 3) Lead in FinCRM anlegen
    console.log(`→ importLead mit leadId = ${leadIdParam}`);
    const response = await importLeadToFincrm(lead, user);
    const regLink = response.register_link;
    if (!regLink) {
      req.session.errorMessage = '⚠️ FinCRM hat keinen Registrierung-Link zurückgegeben.';
      return res.redirect('/dashboard');
    }
  

    // 4) Welcome-Mail senden
    console.log(`→ Versende Willkommens-Mail an: ${lead.email}`);
    await sendLeadConfirmationEmail(req.session.userId, lead, regLink);
    console.log('✅ Bestätigungsmail gesendet');

    // 5) In DB speichern (erst nachdem wir regLink haben)
    const dbId = await saveLead({
      leadId:             leadIdParam,
      salutation:         lead.salutation || '',
      firstName:          lead.firstName || '',
      lastName:           lead.lastName || '',
      email:              lead.email || '',
      propertyType:       lead.propertyType || '',
      propertyCity:       lead.propertyCity || '',
      propertyPostalCode: lead.propertyPostalCode || '',
      registerLink:       regLink
    });
    console.log(`✅ Lead in DB gespeichert (id=${dbId})`);

    // 6) Sendedatum markieren
    await markMailSent(dbId);

    req.session.successMessage = `✅ Lead ${leadIdParam} importiert, Mail gesendet und gespeichert.`;
    console.log(`✅ Lead ${leadIdParam} erfolgreich verarbeitet.`);
    res.redirect('/dashboard');

  } catch (err) {
    console.error('❌ Fehler beim Lead-Import:', err);
    req.session.errorMessage = '❌ Fehler beim Lead-Import: ' + err.message;
    res.redirect('/dashboard');
  }
};

/** Letzter Kontaktversuch */
exports.lastContact = async (req, res) => {
  const leadId = parseInt(req.params.leadId, 10);
  const leadRecord = await getLeadByLeadId(leadId);
  if (!leadRecord) {
    req.session.errorMessage = "❌ Lead nicht gefunden.";
    return res.redirect("/dashboard");
  }
  try {
    await sendLastContactAttemptEmail(req.session.userId, {
      salutation: leadRecord.salutation,
      firstName: leadRecord.first_name,
      lastName: leadRecord.last_name,
      email: leadRecord.email,
    });
    await markLastContact(leadRecord.id);
    req.session.successMessage = "✅ Letzter Kontaktversuch gesendet.";
  } catch (err) {
    console.error(err);
    req.session.errorMessage = "❌ Fehler beim letzten Kontaktversuch.";
  }
  res.redirect("/dashboard");
};

/** Liste aller DB-Leads */
exports.listLeads = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const leads = await getAllLeads();
    const successMessage = req.session.successMessage;
    const errorMessage = req.session.errorMessage;
    delete req.session.successMessage;
    delete req.session.errorMessage;
    res.render("leads", {
      email: req.session.email,
      leads,
      successMessage,
      errorMessage,
    });
  } catch (err) {
    console.error(err);
    req.session.errorMessage = "❌ Konnte Leads nicht laden.";
    res.redirect("/dashboard");
  }
};

// controllers/leadController.js Ende
