// utils/fincrmLeadApi.js

const {
  mapSalutation,
  mapPropertyTypeLead,
  mapPurposeTypeLead,
  mapUsageType,
  mapOccupationalGroup,
} = require("./mapper");
const {
  formatBirthday,
  formatPhoneNumber,
  formatPostalCode,
} = require("./formatHelpers");
const { createFincrmApiClient } = require("./fincrmClient");
const { sendLeadConfirmationEmail } = require("../utils/mailer");

/**
 * Importiert einen Lead in FinCRM und sendet eine Bestätigungsmail mit Registrierungslink.
 * @param {object} lead - geparste Lead-Daten
 * @param {object} user - DB-User-Objekt mit user.id, email, smtp-Daten
 * @returns {object} responseData - Antwortdaten von FinCRM
 */
async function importLeadToFincrm(lead, user) {
  // Payload für FinCRM
  const payload = {
    assign_to: user.email,
    source: { type: "CUSTOMER", id: null, email: lead.email },
    applicants: [
      {
        salutation: mapSalutation(lead.salutation),
        first_name: lead.firstName,
        last_name: lead.lastName,
        email: lead.email,
        birthday: formatBirthday(lead.birthday),
        postal_code: formatPostalCode(lead.postalCode),
        city: lead.city,
        street: lead.street,
        street_number: lead.streetNumber,
        country: "DE",
        phone_private: formatPhoneNumber(lead.phone),
        mobile: formatPhoneNumber(lead.mobile),
        occupational_group: mapOccupationalGroup(lead.jobStatus),
      },
    ],
    property: {
      type: mapPropertyTypeLead(lead.propertyType),
      usage: mapUsageType(lead.usage),
      postal_code: formatPostalCode(lead.propertyPostalCode || lead.postalCode),
      city: lead.propertyCity || lead.city,
    },
    purpose: {
      type: mapPurposeTypeLead(lead.financeType),
      financial_demand: lead.loanAmount || 0,
    },
    notify: true,
    register_link: true,
  };

  try {
    // API-Client erzeugen und POST ausführen
    const api = createFincrmApiClient(user);
    const response = await api.post("/leads", payload);
    const responseData = response.data;

    console.log("✅ Lead erfolgreich als Lead in FinCRM importiert!");

    // Bei vorhandenem Registrierungslink Mail senden
    if (responseData.register_link) {
      await sendLeadConfirmationEmail(
        user.id,
        lead,
        responseData.register_link,
      );
    } else {
      console.warn("⚠️ Kein Registrierung-Link von FinCRM erhalten.");
    }

    return responseData;
  } catch (error) {
    console.error(
      "❌ Fehler beim Lead-Import:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

module.exports = { importLeadToFincrm };

// utils/fincrmLeadApi.js Ende
