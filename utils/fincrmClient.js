// utils/fincrmClient.js

const axios = require("axios");

function createFincrmApiClient(user) {
  if (!user || !user.fincrm_subdomain || !user.fincrm_token) {
    throw new Error("Fehlende FinCRM-Zugangsdaten.");
  }

  const apiUrl = `https://${user.fincrm_subdomain}.fincrm.de/api/v1`;

  const apiClient = axios.create({
    baseURL: apiUrl,
    headers: {
      Authorization: `Bearer ${user.fincrm_token}`,
      "Content-Type": "application/json",
    },
  });

  return apiClient;
}

module.exports = { createFincrmApiClient };

// utils/fincrmClient.js Ende
