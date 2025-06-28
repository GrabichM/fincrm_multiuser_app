// models/leadModel.js

const pool = require('./db');  // Dein zentraler PG-Pool

/**
 * Prüft, ob zu den angegebenen E-Mail-Adressen bereits Leads existieren.
 * @param {string[]} emails
 * @returns {Promise<{email: string}[]>}
 */
async function getExistingEmails(emails) {
  if (!emails.length) return [];
  const placeholders = emails.map((_, i) => `$${i+1}`).join(',');
  const { rows } = await pool.query(
    `SELECT email FROM leads WHERE email IN (${placeholders})`,
    emails
  );
  return rows;
}

/**
 * Liefert alle Leads, sortiert nach Import-Datum absteigend.
 * @returns {Promise<object[]>}
 */
async function getAllLeads() {
  const { rows } = await pool.query(
    `SELECT * FROM leads ORDER BY imported_at DESC`
  );
  return rows;
}

/**
 * Sucht einen einzelnen Lead anhand seiner externen lead_id.
 * @param {number} leadId
 * @returns {Promise<object|null>}
 */
async function getLeadByLeadId(leadId) {
  if (typeof leadId !== 'number') return null;
  const { rows } = await pool.query(
    `SELECT * FROM leads WHERE lead_id = $1 LIMIT 1`,
    [leadId]
  );
  return rows[0] || null;
}

/**
 * Legt einen neuen Lead an (oder updatet bei Konflikt) und gibt dessen interne DB-ID zurück.
 * @param {object} data — Objekt mit camelCase- oder snake_case-Feldern:
 *   { leadId | lead_id, salutation, firstName | first_name, lastName | last_name,
 *     email,
 *     propertyType | property_type,
 *     propertyCity | property_city,
 *     propertyPostalCode | property_postal,
 *     registerLink | register_link }
 * @returns {Promise<number>}
 */
async function saveLead(data) {
  // Mappe beide Varianten auf lokale Variablen
  const lead_id          = data.leadId ?? data.lead_id;
  const salutation       = data.salutation ?? data.salutation;
  const first_name       = data.firstName ?? data.first_name;
  const last_name        = data.lastName ?? data.last_name;
  const email            = data.email;
  const property_type    = data.propertyType ?? data.property_type;
  const property_city    = data.propertyCity ?? data.property_city;
  const property_postal  = data.propertyPostalCode ?? data.property_postal;
  const register_link    = data.registerLink ?? data.register_link;

  if (lead_id == null) {
    throw new Error('saveLead: lead_id fehlt');
  }

  const { rows } = await pool.query(
    `INSERT INTO leads
      (lead_id, salutation, first_name, last_name, email,
       property_type, property_city, property_postal, register_link)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (lead_id) DO UPDATE
       SET salutation       = EXCLUDED.salutation,
           first_name       = EXCLUDED.first_name,
           last_name        = EXCLUDED.last_name,
           email            = EXCLUDED.email,
           property_type    = EXCLUDED.property_type,
           property_city    = EXCLUDED.property_city,
           property_postal  = EXCLUDED.property_postal,
           register_link    = EXCLUDED.register_link,
           imported_at      = NOW()
     RETURNING id`,
    [
      lead_id, salutation, first_name, last_name, email,
      property_type, property_city, property_postal, register_link
    ]
  );

  return rows[0].id;
}

/**
 * Setzt das Feld mail_sent_at auf NOW() für den gegebenen internen DB-PK.
 * @param {number} id — DB-PK aus leads.id
 */
async function markMailSent(id) {
  if (typeof id !== 'number') return;
  await pool.query(
    `UPDATE leads SET mail_sent_at = NOW() WHERE id = $1`,
    [id]
  );
}

/**
 * Setzt das Feld last_contact_at auf NOW() für den gegebenen internen DB-PK.
 * @param {number} id — DB-PK aus leads.id
 */
async function markLastContact(id) {
  if (typeof id !== 'number') return;
  await pool.query(
    `UPDATE leads SET last_contact_at = NOW() WHERE id = $1`,
    [id]
  );
}

module.exports = {
  getExistingEmails,
  getAllLeads,
  getLeadByLeadId,
  saveLead,
  markMailSent,
  markLastContact
};
