const { createCustomerAndPurpose } = require('../utils/fincrmApi'); // <- Wichtig

exports.importLead = async (req, res) => {
  const leadIdParam = req.params.leadId.trim();
  
  const lead = global.leads.find(l => (l.data.leadId + '').trim() === leadIdParam);

  if (!lead) {
    return res.send('❌ Lead nicht gefunden.');
  }

  try {
    // API-Aufruf an fincrm
    const response = await createCustomerAndPurpose(lead.data);

    if (response.success) {
      console.log(`✅ Lead erfolgreich importiert: Lead-ID ${lead.data.leadId}`);
      res.send('✅ Lead erfolgreich importiert!');
    } else {
      console.error('❌ Fehler beim Import:', response.message);
      res.send('❌ Fehler beim Import: ' + response.message);
    }
  } catch (error) {
    console.error('❌ Fehler beim Importieren:', error.message);
    res.send('❌ Fehler beim Importieren: ' + error.message);
  }
};
