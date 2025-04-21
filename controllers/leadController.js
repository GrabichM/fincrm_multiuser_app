// controllers/leadController.js

const { createCustomerAndPurpose } = require('../utils/fincrmApi');
const { importLeadToFincrm } = require('../utils/fincrmLeadApi'); // ✨ wichtig!

// 👉 Kunde importieren (Customer + Purpose)
exports.importCustomer = async (req, res) => {
  const leadIdParam = req.params.leadId.trim();

  const lead = global.leads.find(l => (l.data.leadId + '').trim() === leadIdParam);

  if (!lead) {
    return res.send('❌ Lead nicht gefunden.');
  }

  try {
    const response = await createCustomerAndPurpose(lead.data);

    console.log(`✅ Kunde erfolgreich importiert: Lead-ID ${lead.data.leadId}`);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('❌ Fehler beim Kunden-Import:', error.response?.data || error.message);
    res.send('❌ Fehler beim Kunden-Import: ' + (error.response?.data?.message || error.message));
  }
};

// 👉 Lead importieren (nur Lead anlegen)
exports.importLead = async (req, res) => {
  const leadIdParam = req.params.leadId.trim();

  const lead = global.leads.find(l => (l.data.leadId + '').trim() === leadIdParam);

  if (!lead) {
    return res.send('❌ Lead nicht gefunden.');
  }

  try {
    const response = await importLeadToFincrm(lead.data);

    console.log(`✅ Lead erfolgreich importiert: Lead-ID ${lead.data.leadId}`);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('❌ Fehler beim Lead-Import:', error.response?.data || error.message);
    res.send('❌ Fehler beim Lead-Import: ' + (error.response?.data?.message || error.message));
  }
};
