const express = require('express');
const router = express.Router();
const { importLeadToFincrm } = require('../utils/fincrmApi');
const { mapSalutation, mapCountry, mapTitle, mapFinancePurpose, mapEmploymentState, mapResidentialStatus, mapPropertyType, mapPlotType, mapUsageType, mapCoBorrower } = require('../utils/mapper');

// Importieren-Route
router.get('/import-lead/:leadId', async (req, res) => {
  const leadId = req.params.leadId;

  if (!global.leads || global.leads.length === 0) {
    return res.send('❌ Keine Leads im Speicher. Bitte E-Mails abrufen.');
  }

  const lead = global.leads.find(l => l.data.leadId == leadId);

  if (!lead) {
    return res.send('❌ Lead nicht gefunden.');
  }

  try {
    // ✨ Mapping anwenden
    const mappedLead = {
      salutation: mapSalutation(lead.data.salutation),
      firstName: lead.data.firstName,
      lastName: lead.data.lastName,
      email: lead.data.email,
      phone: lead.data.phone,
      mobile: lead.data.mobile,
      birthday: lead.data.birthday,
      jobStatus: mapEmploymentState(lead.data.jobStatus),
      livingSituation: mapResidentialStatus(lead.data.livingSituation),
      street: lead.data.street,
      streetNumber: lead.data.streetNumber,
      postalCode: lead.data.postalCode,
      city: lead.data.city,
      country: mapCountry('Deutschland'), // Standard auf DE
      coBorrower: mapCoBorrower(lead.data.coBorrower),
      netIncome: lead.data.netIncome,
      financingPeriod: lead.data.financingPeriod,
      startDate: lead.data.startDate,
      purchasePrice: lead.data.purchasePrice,
      loanAmount: lead.data.loanAmount,
      propertyPostalCode: lead.data.propertyPostalCode,
      propertyCity: lead.data.propertyCity,
      propertyType: mapPropertyType(lead.data.propertyType),
      plotType: mapPlotType(lead.data.plotType),
      usageType: mapUsageType(lead.data.usage),
      purposeType: mapFinancePurpose(lead.data.financeType),
      source: "smartkredit_ag"
    };

    // API-Aufruf an FinCRM
    const result = await importLeadToFincrm(mappedLead);

    console.log('✅ Lead erfolgreich importiert:', result);
    res.send('✅ Lead erfolgreich in FinCRM importiert!');
  } catch (error) {
    console.error('❌ Fehler beim Import:', error.response?.data || error.message);
    res.send('❌ Fehler beim Import: ' + (error.response?.data?.message || error.message));
  }
});

module.exports = router;
