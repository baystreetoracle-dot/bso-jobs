const IDS = new Map(Object.entries({
  rbc: "rbc-capital-markets", td: "td-securities", bmo: "bmo-capital-markets",
  scotia: "scotiabank", cibc: "cibc", nbf: "national-bank-financial-markets",
  morganstanley: "morgan-stanley", mizuho: "mizuho-greenhill",
  macquarie: "macquarie-capital", rothschild: "rothschild-and-co",
}));

export function canonicalCompanyId(firm) {
  return firm.companyId ?? IDS.get(firm.key) ?? firm.key;
}

export function normalizedCompanyName(value = "") {
  return String(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}
