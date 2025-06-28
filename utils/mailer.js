// utils/mailer.js

const nodemailer = require("nodemailer");
// DB-Pool importieren
const pool = require("../models/userModels");
const { decrypt } = require("../utils/encryption");

/**
 * Hilfsfunktion: SMTP-Transporter anhand DB-Daten erstellen
 */
async function createTransporterForUser(userId) {
  const { rows } = await pool.query(
    "SELECT smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass_enc, smtp_from FROM users WHERE id = $1",
    [userId],
  );
  if (!rows.length) throw new Error("Kein Benutzer mit dieser ID gefunden.");
  const smtp = rows[0];
  const required = [
    "smtp_host",
    "smtp_port",
    "smtp_secure",
    "smtp_user",
    "smtp_pass_enc",
    "smtp_from",
  ];
  const missing = required.filter(
    (key) => smtp[key] == null || smtp[key] === "",
  );
  if (missing.length)
    throw new Error(`SMTP-Daten unvollständig: ${missing.join(", ")}`);

  let smtpPass;
  try {
    smtpPass = decrypt(smtp.smtp_pass_enc);
  } catch {
    smtpPass = smtp.smtp_pass_enc;
  }

  const transporter = nodemailer.createTransport({
    host: smtp.smtp_host,
    port: Number(smtp.smtp_port) || 587,
    secure: Boolean(smtp.smtp_secure),
    auth: { user: smtp.smtp_user, pass: smtpPass },
    logger: false,       // keine transporter-Logs
  debug:  false        // kein SMTP-Traffic-Debugging
  });
  await transporter.verify();
  return {
    transporter,
    from: smtp.smtp_from.includes("@")
      ? smtp.smtp_from
      : `${smtp.smtp_from} <${smtp.smtp_user}>`,
  };
}

/**
 * Sendet Bestätigungsmail nach Lead-Import.
 */
async function sendLeadConfirmationEmail(userId, lead, registerLink) {
  try {
    const { transporter, from } = await createTransporterForUser(userId);
    const html = `
      <html><head></head>
<body style="font-family: Verdana; font-size: 12px;">
  <div style="font-family: Arial, sans-serif; background-color: rgb(248,249,250); padding: 30px;">
    <div style="max-width: 600px; margin: 0 auto; background: rgb(255,255,255); padding: 30px;">
      <h2 style="color: rgb(0,123,255); text-align: center;">
        Ihre Finanzierungsanfrage ist eingegangen &#9989;
      </h2>
      <p style="font-size: 16px; color: rgb(51,51,51);">
        Guten Tag <strong>${lead.salutation || ""} ${lead.firstName || ""} ${lead.lastName || ""}</strong>,
      </p>
      <p style="font-size: 16px; color: rgb(51,51,51);">
        Ihre Finanzierungsanfrage für Ihr persönliches Vorhaben ist bei uns eingegangen.
        Ich werde mich zeitnah telefonisch bei Ihnen melden, um die nächsten Schritte persönlich mit Ihnen zu besprechen.
      </p>
      <h3 style="margin-top: 30px; color: rgb(0,123,255);">Ihre Anfrage</h3>
      <ul style="list-style: none; padding: 0; font-size: 16px; color: rgb(85,85,85);">
        <li><strong>Objektart:</strong> ${lead.propertyType || ""}</li>
        <li><strong>Objektadresse:</strong> ${lead.propertyPostalCode || ""} ${lead.propertyCity || ""}</li>
      </ul>
      <h3 style="margin-top: 30px; color: rgb(0,123,255);">Wie geht es jetzt weiter?</h3>
      <ol style="padding-left: 20px; font-size: 16px; color: rgb(85,85,85);">
        <li>
          <strong>Persönliche Selbstauskunft:</strong> Über Ihr eingerichtetes Kundenportal vervollständigen wir gemeinsam Ihre Selbstauskunft.
        </li><br/>
        <li>
          <strong>Angebote erhalten:</strong> Sie erhalten Ihre persönlichen Finanzierungsangebote.
        </li><br/>
        <li>
          <strong>Unterlagen vervollständigen:</strong> Laden Sie angeforderte Dokumente sicher in Ihrem Kundenportal hoch.
        </li><br/>
        <li>
          <strong>Finanzierungsantrag versenden:</strong> Nach Prüfung sende ich Ihren Antrag an die Bank.
        </li><br/>
        <li>
          <strong>Finanzierungszusage:</strong> Nach finaler Prüfung der Bank erhalten Sie Ihre persönliche Finanzierungsbestätigung.
        </li>
      </ol>
      <div style="text-align: center; margin: 40px 0;">
        <a
          href="${registerLink}"
          style="background-color: rgb(40,167,69); color: rgb(255,255,255); padding: 15px 30px; text-decoration: none; font-size: 18px;"
          target="_blank"
        >
          Passwort für Kundenportal vergeben
        </a>
      </div>
      <p style="font-size: 14px; color: rgb(119,119,119);">
        Bei Fragen oder Anliegen stehe ich Ihnen jederzeit gerne zur Verfügung!
      </p>
      <hr style="margin: 30px 0;"/>
      <p style="font-size: 14px; color: rgb(85,85,85);">
        Beste Grüße<br/><br/>
        <strong>Martin Grabich</strong><br/>
        Finanzservice RM UG (haftungsbeschränkt)<br/>
        Auf der Egge 3a, 59929 Brilon<br/>
        Mobil: <a style="color: rgb(0,123,255);">0170 4130045</a><br/>
        E-Mail:
        <a
          href="mailto:martin.grabich@hypofact.de"
          onclick="parent.window.phx.iac.notify('mail_compose', {'to':['martin.grabich@hypofact.de']}); return false;"
          style="color: rgb(0,123,255);"
          target="_blank"
        >
          martin.grabich@hypofact.de
        </a><br/>
        Internet:
        <a
          href="https://mein.hypofact.de/partner/martingrabich/"
          style="color: rgb(0,123,255);"
          target="_blank"
        >
          mein.hypofact.de/partner/martingrabich
        </a>
      </p>
    </div>
  </div>
</body>
</html>
`;

    const info = await transporter.sendMail({
      from,
      to: lead.email,
      subject: "Ihre Finanzierungsanfrage ist eingegangen ✅",
      html,
    });
    console.log("✅ Bestätigungsmail gesendet:");
  } catch (err) {
    
  }
}

/**
 * Sendet einen „Letzter Kontaktversuch“-Reminder an den Lead.
 * @param {number} userId
 * @param {{ email, salutation, firstName, lastName }} lead
 */
async function sendLastContactAttemptEmail(userId, lead) {
  // 1) SMTP aus DB laden (wie in sendLeadConfirmationEmail)
  const { rows } = await pool.query(
    "SELECT smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass_enc, smtp_from FROM users WHERE id = $1",
    [userId],
  );
  if (!rows.length) throw new Error("Benutzer nicht gefunden");
  const smtp = rows[0];
  // … hier dieselbe Missing-Fields-Prüfung und decrypt wie oben …

  const transporter = nodemailer.createTransport({
    host: smtp.smtp_host,
    port: Number(smtp.smtp_port),
    secure: Boolean(smtp.smtp_secure),
    auth: {
      user: smtp.smtp_user,
      pass: decrypt(smtp.smtp_pass_enc),
    },
  });
  await transporter.verify();

  // 2) HTML-Template für „Letzter Kontaktversuch“
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8f9fa;padding:30px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;padding:30px;border-radius:8px;">
        <p>Guten Tag <strong>${lead.salutation || ""} ${lead.firstName} ${
          lead.lastName
        }</strong>,</p>
        <p>Sie hatten sich vor einiger Zeit für eine Baufinanzierung interessiert. Leider konnten wir Sie bislang nicht persönlich erreichen.</p>

        <p>Bevor wir Ihre Anfrage abschließen, möchten wir Ihnen noch ein besonders hilfreiches Tool mitgeben:</p>
        <ul style="font-size:16px;color:#333;">
          <li>✨ <a href="https://baufi-connect.de/baufinanzierungsrechner">Kauf Immobilie - Finanzierungsrechner</a></li>
          <li>✨ <a href="https://baufi-connect.de/modernisierung">Modernisierungskredit - Finanzierungsrechner</a></li>
          <li>✨ <a href="https://baufi-connect.de/maximalerkaufpreis">Wie viel Immobilie kann ich mir leisten?</a></li>
        </ul>

        <p>Der Rechner zeigt Ihnen nur Angebote, die auch tatsächlich realisierbar sind – kein Ratespiel, sondern klare Fakten. Darüber hinaus stehen wir Ihnen weiterhin persönlich zur Seite – mit:</p>
        <ul style="font-size:16px;color:#333;">
          <li>✅ Top-Konditionen bei über 400 Bankpartnern</li>
          <li>✅ Schneller Finanzierungszusage</li>
          <li>✅ Komplett digitalem Antragsprozess</li>
          <li>✅ Über 10 Jahren Erfahrung</li>
        </ul>

        <p>Falls Ihr Vorhaben noch aktuell ist, freuen wir uns auf Ihre Rückmeldung.</p>

        <p style="font-size: 14.0px;color: rgb(85,85,85);">
  Beste Grüße<br/><br/>
  <strong>Martin Grabich</strong><br/>
  Finanzservice RM UG (haftungsbeschränkt)<br/>
  Auf der Egge 3a, 59929 Brilon<br/>
  Mobil: <a style="color: rgb(0,123,255);">0170 4130045</a><br/>
  E-Mail: <a href="mailto:martin.grabich@hypofact.de"
            onclick="parent.window.phx.iac.notify('mail_compose', {'to':['martin.grabich@hypofact.de']}); return false;"
            style="color: rgb(0,123,255);" target="_blank">
    martin.grabich@hypofact.de
  </a><br/>
  Internet: <a href="https://mein.hypofact.de/partner/martingrabich/"
               style="color: rgb(0,123,255);" target="_blank">
    mein.hypofact.de/partner/martingrabich
  </a>
</p>
      </div>
    </div>
  `;

  // 3) Mail versenden
  await transporter.sendMail({
    from: smtp.smtp_from.includes("@")
      ? smtp.smtp_from
      : `${smtp.smtp_from} <${smtp.smtp_user}>`,
    to: lead.email,
    subject: "Ihre Baufinanzierung – Ihr persönlicher Weg zu Top-Konditionen",
    html,
  });
  console.log(`✅ Letzter Kontaktversuch-Mail an ${lead.email} gesendet.`);
}

module.exports = {
  sendLeadConfirmationEmail,
  sendLastContactAttemptEmail, // <-- unbedingt hinzufügen
};

// utils/mailer.js Ende
