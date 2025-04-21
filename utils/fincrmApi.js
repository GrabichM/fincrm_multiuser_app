// utils/fincrmApi.js

const {
    mapSalutation,
    mapOccupationalGroup,
    mapFinancePurpose,
    mapEmploymentState,
    mapResidentialStatus,
    mapPropertyType,
    mapPlotType,
    mapUsageType,
    mapCoBorrower
  } = require('../utils/mapper');
  
  const { formatBirthday, formatPhoneNumber, formatPostalCode } = require('../utils/formatHelpers');
  
  const axios = require('axios');
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
      // 💬 Lead vorbereiten und Mappings anwenden
      const preparedLead = {
        first_name: lead.firstName,
        last_name: lead.lastName,
        email: lead.email.toLowerCase(),
        salutation: mapSalutation(lead.salutation),
        country: 'DE',
        birthday: formatBirthday(lead.birthday),
        phone_private: formatPhoneNumber(lead.phone),
        phone_mobile: formatPhoneNumber(lead.mobile),
        postal_code: formatPostalCode(lead.postalCode),
        city: lead.city,
        street: lead.street,
        street_number: lead.streetNumber,
        occupational_group: mapOccupationalGroup(lead.jobStatus),
        residential_status: mapResidentialStatus(lead.livingSituation),
        purpose: {
          type: mapFinancePurpose(lead.financeType),
          financial_demand: lead.loanAmount,
          property_location_postal_code: formatPostalCode(lead.propertyPostalCode || lead.postalCode),
          property_location_city: lead.propertyCity || lead.city,
          property_type: mapPropertyType(lead.propertyType),
          plot_type: mapPlotType(lead.plotType),
          usage_type: mapUsageType(lead.usage)
        }
      };
  
      // API-Aufruf
      const response = await axios.post(
        `${process.env.FINCRM_API_URL}/customers`,
        preparedLead,
        {
          headers: {
            Authorization: `Bearer ${process.env.FINCRM_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      console.log('✅ Lead erfolgreich importiert nach fincrm');
      return response.data;
  
    } catch (error) {
      console.error('❌ Fehler beim Import:', error.response?.data || error.message);
  
      // Sonderbehandlung bei "E-Mail existiert schon"
      if (error.response?.data?.message.includes('E-Mail ist schon vergeben.')) {
        console.log('⚠️ Kunde existiert bereits.');
      }
  
      throw error; // Weiterwerfen, damit im Frontend z.B. eine Info gezeigt wird
    }
  }
  
  module.exports = { importLeadToFincrm };
  
