// utils/mapper.js

// Salutation (Anrede) Mapping
function mapSalutation(value) {
  const salutations = {
    Herr: "Herr",
    Frau: "Frau",
  };
  return salutations[value] || "Herr"; // Fallback auf Herr (Herr)
}

// Country Mapping
function mapCountry(value) {
  const countries = {
    Deutschland: "DE",
    Österreich: "AT",
    Schweiz: "CH",
  };
  return countries[value] || "DE"; // Fallback auf Deutschland
}

// Title Mapping (optional)
function mapTitle(value) {
  const titles = {
    "Dr.": "Dr.",
    "Prof.": "Prof.",
    "Prof. Dr.": "Prof. Dr.",
  };
  return titles[value] || null;
}

// Purpose Type (Was finanzieren ➔ fincrm Zweck)
function mapFinancePurpose(value) {
  const purposes = {
    "Kauf Immobilie": "PURCHASE",
    Anschlussfinanzierung: "FOLLOW_UP_FINANCING",
    "Eigenes Bauvorhaben": "CONSTRUCTION",
    "Umbau/Modernisieren": "MODERNIZATION",
  };
  return purposes[value] || "PURCHASE"; // Fallback auf PURCHASE
}

function mapEmploymentState(jobStatus) {
  const mapping = {
    "Angestellte/r": "EMPLOYEE",
    "Selbstständige/r": "SELF_EMPLOYMENT",
    "Beamte/r": "CIVIL_SERVANT",
    "Rentner/in": "PENSIONER",
    Arbeitslos: "UNEMPLOYED",
    "Schüler/Student": "OTHER", // FinCRM kennt STUDENT nicht direkt ➔ "OTHER"
    "Hausfrau/Hausmann": "OTHER",
  };
  return mapping[jobStatus] || "OTHER";
}

function mapResidentialStatus(livingSituation) {
  const mapping = {
    Eigentum: ["OWNER"],
    Miete: ["RENT"],
  };
  return mapping[livingSituation] || [];
}

function mapPropertyType(propertyType) {
  const mapping = {
    Einfamilienhaus: "SINGLE_FAMILY_HOUSE",
    Doppelhaushälfte: "SEMI_DETACHED_HOUSE",
    Mehrfamilienhaus: "MULTI_FAMILY_HOUSE",
    Reihenhaus: "ROW_HOUSE",
    Reihenmittelhaus: "ROW_HOUSE",
    Eigentumswohnung: "CONDOMINIUM",
    Zweifamilienhaus: "TWO_FAMILY_HOUSE",
    "Nur Grundstück": "PLOT",
  };
  return mapping[propertyType] || null;
}

function mapPlotType(plotType) {
  const mapping = {
    "Sonstiges Grundstück": "OTHER",
    "Unbebautes Wohngrundstück": "BUILDING_PLOT",
    "Landwirtschaftliches Grundstück": "AGRICULTURAL_PLOT",
    "Unbebautes Mischgrundstück": "MIXED_USE_PLOT",
  };
  return mapping[plotType] || null;
}

function mapUsageType(usage) {
  const mapping = {
    "selbst genutzt": "OWN_USE",
    "Vermietet / verpachtet": "THIRD_PARTY_USE",
    "Teilweise vermietet": "MIXED_USE",
  };
  return mapping[usage] || null;
}

function mapCoBorrower(coBorrower) {
  if (!coBorrower) return false;
  return coBorrower.includes("Ja") ? true : false;
}

function mapPropertyTypeLead(propertyType) {
  const mapping = {
    Einfamilienhaus: "HOUSE_SINGLE_FAMILY",
    Doppelhaushälfte: "HOUSE_SEMI_DETACHED",
    Mehrfamilienhaus: "HOUSE_MULTI_FAMILY",
    Reihenhaus: "HOUSE_ROW_MIDDLE",
    Reihenmittelhaus: "HOUSE_ROW_MIDDLE",
    Eigentumswohnung: "APARTMENT",
    Zweifamilienhaus: "HOUSE_TWO_FAMILY",
    "Nur Grundstück": "PLOT",
  };
  return mapping[propertyType] || "OTHER";
}

function mapPurposeTypeLead(financeType) {
  const mapping = {
    "Kauf Immobilie": "BUY_EXISTING_PROPERTY",
    Anschlussfinanzierung: "REFINANCE",
    "Eigenes Bauvorhaben": "CONSTRUCTION",
    "Umbau/Modernisieren": "MODERNIZATION",
  };
  return mapping[financeType] || "BUY_EXISTING_PROPERTY";
}

function mapOccupationalGroup(jobStatus) {
  const mapping = {
    "Angestellte/r": "EMPLOYEE",
    "Selbstständige/r": "SELF_EMPLOYMENT",
    "Beamte/r": "CIVIL_SERVANT",
    "Rentner/in": "PENSIONER",
    Arbeitslos: "UNEMPLOYED",
    "Schüler/Student": "OTHER",
    "Hausfrau/Hausmann": "HOUSEWIFE",
  };
  return mapping[jobStatus] || "OTHER";
}

module.exports = {
  // Vorhandene Mapper
  mapSalutation,
  mapCountry,
  mapFinancePurpose,
  mapEmploymentState,
  mapResidentialStatus,
  mapPropertyType,
  mapPlotType,
  mapUsageType,
  mapCoBorrower,

  // NEU:
  mapPropertyTypeLead,
  mapPurposeTypeLead,
  mapOccupationalGroup,
  mapTitle,
};

// utils/mapper.js Ende
