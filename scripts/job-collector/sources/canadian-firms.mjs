const cohort = "canadian-independent";

const staticPage = (key, name, careersUrl, pageUrls = [careersUrl], options = {}) => ({
  key, name, careersUrl, cohort, provider: "Official static careers page", adapter: "static-careers",
  config: { pageUrls, ...options }, ...options.firmOptions,
});

const html = (key, name, provider, careersUrl, searchUrls, linkPattern, options = {}) => ({
  key, name, provider, careersUrl, cohort, adapter: "official-html",
  config: { searchUrls, linkPattern, ...options }, ...options.firmOptions,
});

const workday = (key, name, careersUrl, boards, options = {}) => ({
  key, name, provider: "Workday", careersUrl, cohort, adapter: "workday", config: { boards }, ...options,
});

const purePlay = { purePlayInvestmentBank: true };
const corporateFinance = { includeCorporateFinance: true };

export const CANADIAN_FIRMS = [
  staticPage("canaccord", "Canaccord Genuity", "https://www.canaccordgenuity.com/careers/"),
  {
    key: "stifel-canada", name: "Stifel Canada", provider: "iCIMS Jibe public API",
    careersUrl: "https://join.stifel.com/jobs/locations/country/Canada", cohort, adapter: "jibe",
    config: { host: "https://join.stifel.com", query: { country: "Canada" } },
  },
  html("raymond-james-canada", "Raymond James Ltd.", "Official Raymond James careers platform", "https://www.raymondjames.ca/about-us/careers", ["https://jobs.raymondjames.com/search-jobs/Canada"], /jobs\.raymondjames\.com\/(?:job|search-jobs)\//i),
  workday("desjardins-capital-markets", "Desjardins Capital Markets", "https://www.desjardins.com/en/careers.html", [
    { host: "https://desjardins.wd10.myworkdayjobs.com", tenant: "desjardins", site: "Desjardins" },
  ]),
  html("atb-cormark", "ATB Cormark Capital Markets", "Eightfold", "https://atbcm.atb.com/", ["https://careers.atb.com/careers?domain=atb.com&location=Canada"], /careers\.atb\.com\/careers\/job\//i),
  staticPage("infor-financial", "INFOR Financial", "https://inforfinancial.com/", undefined, { firmOptions: purePlay }),
  staticPage("origin-merchant", "Origin Merchant Partners", "https://www.originmerchant.com/culture-careers/", undefined, { contextText: "Origin offers investment banking and M&A advisory careers.", firmOptions: purePlay }),
  staticPage("peters-co", "Peters & Co.", "https://www.petersco.com/"),
  staticPage("agentis", "Agentis Capital", "https://www.agentiscapital.com/careers", ["https://agentis-capital.squarespace.com/current-opportunities"], { firmOptions: purePlay }),
  staticPage("bloom-burton", "Bloom Burton", "https://www.bloomburton.com/careers/", undefined, { firmOptions: purePlay }),

  workday("ia-capital-markets", "iA Capital Markets", "https://iacapitalmarkets.ca/careers", [
    { host: "https://ia.wd3.myworkdayjobs.com", tenant: "ia", site: "Professional" },
  ]),
  html("deloitte-cf", "Deloitte Corporate Finance", "SAP SuccessFactors", "https://careers.deloitte.ca/", ["https://careers.deloitte.ca/search/?q=corporate+finance&locationsearch=Canada"], /careers\.deloitte\.ca\/job\//i, { firmOptions: corporateFinance }),
  {
    key: "kpmg-cf", name: "KPMG Corporate Finance", provider: "iCIMS Jibe public API",
    careersUrl: "https://careers.kpmg.ca/", cohort, adapter: "jibe", ...corporateFinance,
    config: { host: "https://careers.kpmg.ca", query: { keywords: "corporate finance", country: "Canada" } },
  },
  html("pwc-cf", "PwC Corporate Finance / Deals", "Radancy", "https://jobs-ca.pwc.com/ca/en/", ["https://jobs-ca.pwc.com/ca/en/c/deals-mergers-and-acquisitions-jobs"], /jobs-ca\.pwc\.com\/ca\/en\/job\//i, { firmOptions: corporateFinance }),
  html("ey-parthenon-cf", "EY-Parthenon Corporate Finance", "SAP SuccessFactors", "https://www.ey.com/en_ca/careers", ["https://careers.ey.com/ey/search/?q=corporate+finance&locationsearch=Canada"], /careers\.ey\.com\/ey\/job\//i, { firmOptions: corporateFinance }),
  html("mnp-cf", "MNP Corporate Finance", "MNP public careers platform", "https://www.mnp.ca/careers", ["https://recruitment.mnp.ca/jobs?search=corporate%20finance"], /recruitment\.mnp\.ca\/jobs\//i, { firmOptions: corporateFinance }),
  html("baker-tilly-cf", "Baker Tilly Canada Capital Corporation", "Official opportunities board", "https://www.bakertilly.ca/careers/opportunities", ["https://www.bakertilly.ca/careers/opportunities"], /bakertilly\.ca\/careers\/opportunities\//i, { firmOptions: corporateFinance }),
  workday("bdo-ma", "BDO M&A & Capital Markets", "https://www.bdo.ca/careers", [
    { host: "https://bdo.wd3.myworkdayjobs.com", tenant: "bdo", site: "BDO" },
  ], corporateFinance),
  html("alvarez-marsal", "Alvarez & Marsal", "Official A&M careers platform", "https://careers.alvarezandmarsal.com/", ["https://careers.alvarezandmarsal.com/search/jobs/in/country/canada"], /careers\.alvarezandmarsal\.com\/job\//i, { firmOptions: corporateFinance }),
  html("rsm-canada", "RSM Canada", "RSM public careers platform", "https://jobs.rsmus.com/canada/", ["https://jobs.rsmus.com/canada/"], /jobs\.rsmus\.com\/job\//i, { firmOptions: corporateFinance }),
  staticPage("richter", "Richter", "https://www.richter.ca/careers/", undefined, { firmOptions: corporateFinance }),
  html("doane-grant-thornton", "Doane Grant Thornton", "iCIMS", "https://www.doanegrantthornton.ca/careers/", ["https://careers-doanegrantthornton.icims.com/jobs/search?ss=1"], /careers-doanegrantthornton\.icims\.com\/jobs\/\d+\//i, { firmOptions: corporateFinance }),

  html("ventum", "Ventum Financial", "Official careers board", "https://ventumfinancial.com/current-positions/", ["https://ventumfinancial.com/current-positions/"], /ventumfinancial\.com\/career\//i),
  staticPage("maxit", "Maxit Capital", "https://maxitcapital.com/", undefined, { firmOptions: purePlay }),
  staticPage("scp-resource", "SCP Resource Finance", "https://www.scp-rf.com/", undefined, { firmOptions: purePlay }),
  staticPage("red-cloud", "Red Cloud Securities", "https://redcloudsecurities.com/careers/"),
  html("haywood", "Haywood Securities", "Official careers board", "https://www.haywood.com/career-opportunities", ["https://www.haywood.com/career-opportunities"], /haywood\.com\/(?:career|job)[^"']*/i),
  staticPage("paradigm-capital", "Paradigm Capital", "https://www.paradigmcap.com/"),
  staticPage("crosbie", "Crosbie & Company", "https://www.crosbieco.com/", undefined, { firmOptions: purePlay }),
  staticPage("fort-capital", "Fort Capital", "https://www.fortcapital.ca/careers/", undefined, {
    contextText: "Fort Capital describes these openings as investment banking analyst roles.",
    skipHeadingPattern: /^Student\s*&\s*Co-op Analyst Application$/i,
    firmOptions: purePlay,
  }),
  staticPage("morrison-park", "Morrison Park Advisors", "https://morrisonpark.com/", undefined, { firmOptions: purePlay }),
  staticPage("osprey-capital", "Osprey Capital Partners", "https://ospreycapital.ca/contact/", undefined, { firmOptions: purePlay }),
  staticPage("sampford", "Sampford Advisors", "https://www.sampfordadvisors.com/", undefined, { firmOptions: purePlay }),
  staticPage("research-capital", "Research Capital Corporation", "https://www.researchcapital.com/about/careers"),
  staticPage("leede", "Leede Financial", "https://www.leede.ca/careers"),
  staticPage("beacon-securities", "Beacon Securities", "https://beaconsecurities.ca/"),
  staticPage("clarus", "Clarus Securities", "https://www.clarussecurities.com/home"),
  staticPage("blair-franklin", "Blair Franklin Capital Partners", "https://www.blairfranklin.com/", undefined, { firmOptions: purePlay }),
  staticPage("ijw", "IJW & Co.", "https://ijw.ca/", undefined, { firmOptions: purePlay }),
  html("firepower", "FirePower Capital", "Collage public ATS", "https://www.firepowercapital.com/careers", ["https://secure.collage.co/jobs/firepowercapital"], /secure\.collage\.co\/jobs\/firepowercapital\/(?:[^"']+)/i, { firmOptions: purePlay }),
  staticPage("valitas", "Valitas Capital Partners", "https://www.valitascapital.com/careers", undefined, { firmOptions: purePlay }),
  staticPage("clariti-advisors", "Clariti Strategic Advisors", "https://claritiadvisors.com/", undefined, { firmOptions: purePlay }),
  staticPage("clairfield-canada", "NewPoint / Clairfield Canada", "https://www.clairfield.com/clairfield-in-canada/", ["https://www.clairfield.com/join-us/"], { firmOptions: purePlay }),
  staticPage("eq-capital-partners", "EQ Capital Partners", "https://eqcapitalpartners.ca/", undefined, { firmOptions: purePlay }),
];
