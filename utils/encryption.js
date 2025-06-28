// utils/encryption.js
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bit für GCM
const TAG_LENGTH = 16; // 128 bit Auth-Tag

// Schlüssel aus Umgebungsvariable ableiten
const KEY = crypto.scryptSync(
  process.env.ENCRYPTION_SECRET || "default_secret",
  "email-salt",
  32,
);

/**
 * Verschlüsselt einen Klartext und gibt Base64-String zurück:
 * [IV][TAG][CIPHERTEXT]
 */
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let ct = cipher.update(text, "utf8");
  ct = Buffer.concat([ct, cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

/**
 * Entschlüsselt einen Base64-String, der mit encrypt() erzeugt wurde.
 */
function decrypt(data) {
  const bData = Buffer.from(data, "base64");
  const iv = bData.slice(0, IV_LENGTH);
  const tag = bData.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ct = bData.slice(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  let plain = decipher.update(ct);
  plain = Buffer.concat([plain, decipher.final()]);
  return plain.toString("utf8");
}

module.exports = { encrypt, decrypt };

// utils/encryption.js Ende
