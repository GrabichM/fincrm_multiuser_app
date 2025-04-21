// utils/mapper.js

// Salutation (Anrede) Mapping
function mapSalutation(value) {
    const salutations = {
      'Herr': 'Herr',
      'Frau': 'Frau'
    };
    return salutations[value] || 'Herr'; // Fallback auf Herr (Herr)
  }
  
  
  // Country Mapping
  function mapCountry(value) {
    const countries = {
      'Deutschland': 'DE',
      'Österreich': 'AT',
      'Schweiz': 'CH'
    };
    return countries[value] || 'DE'; // Fallback auf Deutschland
  }
  
  // Title Mapping (optional)
  function mapTitle(value) {
    const titles = {
      'Dr.': 'Dr.',
      'Prof.': 'Prof.',
      'Prof. Dr.': 'Prof. Dr.'
    };
    return titles[value] || null;
  }
  
  // Purpose Type (Was finanzieren ➔ fincrm Zweck)
  function mapFinancePurpose(value) {
    const purposes = {
      'Kauf Immobilie': 'PURCHASE',
      'Anschlussfinanzierung': 'FOLLOW_UP_FINANCING',
      'Eigenes Bauvorhaben': 'CONSTRUCTION',
      'Umbau/Modernisieren': 'MODERNIZATION'
    };
    return purposes[value] || 'PURCHASE'; // Fallback auf PURCHASE
  }

  function mapEmploymentState(jobStatus) {
    const mapping = {
      'Angestellte/r': 'EMPLOYED',
      'Selbstständige/r': 'SELF_EMPLOYED',
      'Beamte/r': 'CIVIL_SERVANT',
      'Rentner/in': 'RETIRED',
      'Arbeitslos': 'UNEMPLOYED',
      'Schüler/Student': 'STUDENT'
    };
    return mapping[jobStatus] || null;
  }

  function mapResidentialStatus(livingSituation) {
    const mapping = {
      'Eigentum': 'OWNER',
      'Miete': 'RENT'
    };
    return mapping[livingSituation] || null;
  }
  
  function mapPropertyType(propertyType) {
    const mapping = {
      'Einfamilienhaus': 'SINGLE_FAMILY_HOUSE',
      'Doppelhaushälfte': 'SEMI_DETACHED_HOUSE',
      'Mehrfamilienhaus': 'MULTI_FAMILY_HOUSE',
      'Reihenhaus': 'ROW_HOUSE',
      'Reihenmittelhaus': 'ROW_HOUSE',
      'Eigentumswohnung': 'CONDOMINIUM',
      'Zweifamilienhaus': 'TWO_FAMILY_HOUSE',
      'Nur Grundstück': 'PLOT'
    };
    return mapping[propertyType] || null;
  }

  function mapPlotType(plotType) {
    const mapping = {
      'Sonstiges Grundstück': 'OTHER',
      'Unbebautes Wohngrundstück': 'BUILDING_PLOT',
      'Landwirtschaftliches Grundstück': 'AGRICULTURAL_PLOT',
      'Unbebautes Mischgrundstück': 'MIXED_USE_PLOT'
    };
    return mapping[plotType] || null;
  }
  
  function mapUsageType(usage) {
    const mapping = {
      'selbst genutzt': 'OWN_USE',
      'Vermietet / verpachtet': 'RENTAL',
      'Teilweise vermietet': 'PARTIAL_RENTAL'
    };
    return mapping[usage] || null;
  }

  function mapCoBorrower(coBorrower) {
    if (!coBorrower) return false;
    return coBorrower.includes('Ja') ? true : false;
  }
  
  
  
  module.exports = {
    mapSalutation,
    mapCountry,
    mapTitle,
    mapFinancePurpose,
    mapEmploymentState,
    mapResidentialStatus,
    mapPropertyType,
    mapPlotType,
    mapUsageType,
    mapCoBorrower
  };
  