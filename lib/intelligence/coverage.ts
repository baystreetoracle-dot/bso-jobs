// BSO Intelligence coverage as shown on its homepage (checked 2026-10-06). Update when coverage grows.
export const COVERAGE = { firms: 202, people: 961, deals: 3383 } as const;

// The firms the post-signup reel spins through: the same list and order as the "Build my plan" reel
// on the Intelligence sign-in page, alternating banks and the buy side.
export const REEL_FIRMS = [
  "RBC Capital Markets",
  "Goldman Sachs",
  "Onex",
  "CPP Investments",
  "Evercore",
  "TD Securities",
  "Brookfield",
  "J.P. Morgan",
  "Ontario Teachers' Pension Plan",
  "Citadel",
] as const;
