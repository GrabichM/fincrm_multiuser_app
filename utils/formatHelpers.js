// utils/formatHelpers.js

// Geburtstag umformatieren: von 08.11.1997 ➔ 1997-11-08
function formatBirthday(dateString) {
  const parts = dateString.split(".");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return null;
}

// Telefonnummern vereinheitlichen
function formatPhoneNumber(phone) {
  return phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
}

// Postleitzahlen korrigieren
function formatPostalCode(plz) {
  return plz.padStart(5, "0"); // Immer 5 Stellen
}

module.exports = {
  formatBirthday,
  formatPhoneNumber,
  formatPostalCode,
};

// utils/formatHelpers.js Ende
