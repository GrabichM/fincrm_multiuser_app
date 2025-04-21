// utils/fincrmLeadApi.js

const axios = require('axios');
const {
  mapSalutation,
  mapPropertyTypeLead,
  mapPurposeTypeLead,
  mapUsageType,
  mapOccupationalGroup
} = require('./mapper');
const { formatBirthday, formatPhoneNumber, formatPostalCode } = require('./formatHelpers');

require('dotenv').config();

const api = axios.create({
  baseURL: process.env.FINCRM_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.FINCRM_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function importLeadToFincrm(lead) {
  try {
    const payload = {
      assign_to: process.env.FINCRM_DEFAULT_USER_EMAIL || 'grabich.privat@gmail.com', // optional: kannst du konfigurieren
      source: {
        type: "CUSTOMER", // wir gehen aktuell davon aus, dass der Lead Kunde ist
        id: null,         // wir haben keine ID im Lead, also lassen wir sie leer
        email: lead.email
      },
      applicants: [
        {
          salutation: mapSalutation(lead.salutation),
          first_name: lead.firstName,
          last_name: lead.lastName,
          birthday: formatBirthday(lead.birthday),
          postal_code: formatPostalCode(lead.postalCode),
          city: lead.city,
          street: lead.street,
          street_number: lead.streetNumber,
          country: 'DE',
          phone_private: formatPhoneNumber(lead.phone),
          mobile: formatPhoneNumber(lead.mobile),
occupational_group: mapOccupationalGroup(lead.jobStatus),
        }
      ],
      property: {
        type: mapPropertyTypeLead(lead.propertyType),
        usage: mapUsageType(lead.usage),
        postal_code: formatPostalCode(lead.propertyPostalCode || lead.postalCode),
        city: lead.propertyCity || lead.city,
        street: lead.street,
        street_number: lead.streetNumber,
      },
      purpose: {
        type: mapPurposeTypeLead(lead.financeType),
        financial_demand: lead.loanAmount || 0
      },
      notify: true,
      register_link: true
    };

    const response = await api.post('/leads', payload);

    console.log('✅ Lead erfolgreich als Lead in FinCRM importiert!');
    return response.data;
  } catch (error) {
    console.error('❌ Fehler beim Lead-Import:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { importLeadToFincrm };
