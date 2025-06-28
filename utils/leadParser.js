// utils/leadParser.js

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

/**
 * Parst den reinen Text einer E-Mail und extrahiert alle Lead-Felder.
 * Gibt ein Objekt mit allen nötigen Properties zurück, plus validationErrors.
 */
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

  // 1) rohe Extraktion via Regex
  for (const key of Object.keys(fields)) {
    let pattern;
    if (key === 'Angebote anderer Banken') {
      // bis zum Zeilenende (oder Semikolon), um Kommas im Text zu erlauben
      pattern = new RegExp(`${key}\\s*[:\\-]\\s*(.+)`, 'i');
    } else {
      pattern = new RegExp(`${key}\\s*[:\\-]\\s*([^;\\n]+)`, 'i');
    }
    const match = text.match(pattern);
    if (match && match[1]) {
      fields[key] = match[1].trim();
    }
  }

  // 2) in ein sauberes Objekt übersetzen
  const extracted = {
    salutation:         fields['Anrede'] || '',
    lastName:           fields['Nachname'] || '',
    firstName:          fields['Vorname'] || '',
    birthday:           fields['Geburtsdatum'] || '',
    phone:              fields['Telefon privat'] || '',
    mobile:             fields['Telefon mobil'] || '',
    email:              fields['Email'] || '',
    jobStatus:          fields['Berufsstatus'] || '',
    livingSituation:    fields['Aktuelle Wohnsituation'] || '',
    financeType:        fields['Was finanzieren'] || '',
    propertyType:       fields['Immobilie Typ'] || '',
    plotType:           fields['Grundstück Typ'] || '',
    usage:              fields['Nutzung'] || '',
    coBorrower:         fields['Weiterer Darlehensnehmer'] || '',
    netIncome:          fields['Nettoeinkommen'] || '',
    financingPeriod:    fields['Finanzierungszeitraum'] || '',
    startDate:          fields['Start'] || '',
    leadId:             fields['Lead ID'] || '',
    bookingDate:        fields['Buchungsdatum'] || '',
    available:          fields['erreichbar'] || '',
    otherBankOffers:    fields['Angebote anderer Banken'] || ''
  };

  // 3) Spezialbehandlungen für Straße / PLZ-Ort / Immobilie Standort
  if (fields['Straße']) {
    const m = fields['Straße'].match(/^(.+?)\s+(\d+\w*)$/);
    if (m) {
      extracted.street = m[1].trim();
      extracted.streetNumber = m[2].trim();
    } else {
      extracted.street = fields['Straße'].trim();
      extracted.streetNumber = '';
    }
  }

  if (fields['PLZ - Ort']) {
    const m = fields['PLZ - Ort'].match(/(\d{5})\s*[-,]\s*(.+)/);
    if (m) {
      extracted.postalCode = m[1];
      extracted.city = m[2].trim();
    }
  }

  if (fields['Immobilie Standort']) {
    const m = fields['Immobilie Standort'].match(/(\d{5})[,\s]+(.+)/);
    if (m) {
      extracted.propertyPostalCode = m[1];
      extracted.propertyCity = m[2].trim();
    }
  }

  // 4) Zahlen-Felder bereinigen
  if (fields['Kaufpreis']) {
    const num = fields['Kaufpreis'].replace(/\D/g, '');
    extracted.purchasePrice = num ? parseInt(num, 10) : null;
  }
  if (fields['Darlehen']) {
    const num = fields['Darlehen'].replace(/\D/g, '');
    extracted.loanAmount = num ? parseInt(num, 10) : null;
  }

  // 5) Validierung
  const validationErrors = [];
  if (!extracted.firstName || !extracted.lastName) {
    validationErrors.push('Vorname oder Nachname fehlt.');
  }
  if (!extracted.email || !extracted.email.includes('@')) {
    validationErrors.push('Ungültige oder fehlende E-Mail.');
  }
  if (!extracted.postalCode || !/^\d{5}$/.test(extracted.postalCode || '')) {
    validationErrors.push('Ungültige PLZ.');
  }
  if (!extracted.city) {
    validationErrors.push('Ort fehlt.');
  }
  if (!extracted.phone && !extracted.mobile) {
    validationErrors.push('Mindestens eine Telefonnummer muss vorhanden sein.');
  }
  extracted.validationErrors = validationErrors;

  // 6) Formatierungen
  extracted.firstName          = capitalizeFirstLetter(extracted.firstName);
  extracted.lastName           = capitalizeFirstLetter(extracted.lastName);
  extracted.city               = capitalizeFirstLetter(extracted.city);
  extracted.propertyCity       = capitalizeFirstLetter(extracted.propertyCity || '');
  extracted.street             = capitalizeFirstLetter(extracted.street || '');

  extracted.postalCode         = formatPostalCode(extracted.postalCode || '');
  extracted.propertyPostalCode = formatPostalCode(extracted.propertyPostalCode || '');

  extracted.phone              = formatPhoneNumber(extracted.phone);
  extracted.mobile             = formatPhoneNumber(extracted.mobile);

  extracted.email              = formatEmail(extracted.email);

  extracted.jobStatus          = cleanText(extracted.jobStatus);
  extracted.livingSituation    = cleanText(extracted.livingSituation);
  extracted.available          = cleanText(extracted.available);

  return extracted;
}

module.exports = { parseLeadFromText };