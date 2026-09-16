const html = (key, name, provider, careersUrl, searchUrls, linkPattern, options = {}) => ({
  key, name, provider, careersUrl, adapter: "official-html", config: { searchUrls, linkPattern, ...options },
});

const workday = (key, name, careersUrl, boards) => ({
  key, name, provider: "Workday", careersUrl, adapter: "workday", config: { boards },
});

const talnet = (key, name, careersUrl, searchUrls) => ({
  key, name, provider: "Tal.net", careersUrl, adapter: "talnet", config: { searchUrls },
});

const CORE_FIRMS = [
  { key: "rbc", name: "RBC Capital Markets", provider: "Phenom / Workday apply", careersUrl: "https://jobs.rbc.com/ca/en/search-results", adapter: "rbc" },
  workday("td", "TD Securities", "https://www.tdsecurities.com/ca/en/careers", [
    { host: "https://td.wd3.myworkdayjobs.com", tenant: "td", site: "TD_Bank_Careers" },
  ]),
  { key: "bmo", name: "BMO Capital Markets", provider: "Phenom / Workday apply", careersUrl: "https://capitalmarkets.bmo.com/en/careers/", adapter: "phenom", config: { baseUrl: "https://jobs.bmo.com", searchUrl: "https://jobs.bmo.com/ca/en/search-results", refNum: "BOMOGLOBAL", pageId: "page406-migration" } },
  html("scotia", "Scotiabank Global Banking and Markets", "SAP SuccessFactors", "https://www.scotiabank.com/careers/", ["https://jobs.scotiabank.com/search/?q=&locationsearch=Canada"], /jobs\.scotiabank\.com\/job\//i),
  workday("cibc", "CIBC Capital Markets", "https://www.cibc.com/en/about-cibc/careers.html", [
    { host: "https://cibc.wd3.myworkdayjobs.com", tenant: "cibc", site: "search" },
    { host: "https://cibc.wd3.myworkdayjobs.com", tenant: "cibc", site: "campus" },
  ]),
  html("nbf", "National Bank Financial Markets", "Public custom careers platform", "https://www.nbc.ca/en/capitalmarkets/opportunities.html", ["https://emplois.bnc.ca/en_CA/careers/searchjobs/?jobRecordsPerPage=100"], /emplois\.bnc\.ca\/en_CA\/careers\/JobDetail\//i),

  { key: "goldman", name: "Goldman Sachs", provider: "Higher.gs GraphQL", careersUrl: "https://www.goldmansachs.com/careers", adapter: "goldman", config: {} },
  html("jpmorgan", "J.P. Morgan", "JPMorganChase public careers platform", "https://www.jpmorganchase.com/careers", ["https://www.jpmorganchase.com/careers/search-results?location=Canada"], /jpmorganchase\.com\/careers\/job-detail\//i),
  { key: "morganstanley", name: "Morgan Stanley", provider: "Eightfold", careersUrl: "https://www.morganstanley.com/people", adapter: "eightfold", config: { searchUrls: ["https://morganstanley.eightfold.ai/careers?location=Canada"] } },
  html("bofa", "Bank of America", "Public careers search", "https://careers.bankofamerica.com/", ["https://careers.bankofamerica.com/en-us/job-search/canada"], /careers\.bankofamerica\.com\/en-us\/job-detail\//i),
  html("citi", "Citi", "Radancy public careers search", "https://jobs.citi.com/", ["https://jobs.citi.com/location/canada-jobs/287/6251999/2"], /jobs\.citi\.com\/job\//i),
  html("barclays", "Barclays", "Radancy public careers search", "https://search.jobs.barclays/", ["https://search.jobs.barclays/en/search-jobs/?location=Canada"], /search\.jobs\.barclays\/(?:en\/)?job\//i),
  html("ubs", "UBS", "UBS public job board", "https://www.ubs.com/global/en/careers/search-jobs.html", ["https://jobs.ubs.com/TGnewUI/Search/Home/Home?partnerid=25008&siteid=5012#keyWordSearch=&locationSearch=Canada"], /jobs\.ubs\.com\/job\//i),
  html("bnpparibas", "BNP Paribas", "BNP Paribas public careers platform", "https://group.bnpparibas/en/careers/all-job-offers/canada", ["https://group.bnpparibas/en/careers/all-job-offers/canada", "https://www.bnpparibas.ca/en/our-job-offers/"], /(?:group\.bnpparibas|bnpparibas\.ca)\/(?:en\/)?(?:jobs?|careers\/job-offer)\//i),
  html("socgen", "Société Générale", "Société Générale public careers API/site", "https://careers.societegenerale.com/en/search", ["https://careers.societegenerale.com/en/search?location=Canada"], /careers\.societegenerale\.com\/en\/job-offers\//i),

  talnet("evercore", "Evercore", "https://www.evercore.com/careers/", ["https://evercore.tal.net/vx/lang-en-GB/mobile-0/channel-1/appcentre-ext/brand-6/candidate/jobboard/vacancy/2/adv/"]),
  html("rothschild", "Rothschild & Co.", "Rothschild public vacancies platform", "https://www.rothschildandco.com/en/careers/", ["https://www.rothschildandco.com/en/careers/experienced-professionals/vacancies/"], /rothschildandco\.com\/en\/careers\/.+\/vacanc(?:y|ies)\//i),
  talnet("pwp", "Perella Weinberg Partners / TPH", "https://pwpartners.com/careers/", ["https://pwpcareers.tal.net/vx/lang-en-GB/mobile-0/appcentre-pwpext/brand-4/candidate/jobboard/vacancy/3/adv/", "https://pwpcareers.tal.net/vx/lang-en-GB/mobile-0/appcentre-5/brand-7/candidate/jobboard/vacancy/2/adv/"]),
  workday("mizuho", "Mizuho / Greenhill", "https://www.mizuhogroup.com/americas/careers", [
    { host: "https://mizuho.wd1.myworkdayjobs.com", tenant: "mizuho", site: "mizuhoamericas" },
  ]),

  talnet("jefferies", "Jefferies", "https://www.jefferies.com/careers/apply-now/", ["https://jefferies.tal.net/vx/lang-en-GB/mobile-0/appcentre-ext/brand-4/candidate/jobboard/vacancy/3/adv/"]),
  html("macquarie", "Macquarie", "Macquarie public careers platform", "https://www.macquarie.com/ca/en/careers.html", ["https://recruitment.macquarie.com/en_US/careers/SearchJobs/?location=Canada"], /recruitment\.macquarie\.com\/en_US\/careers\/JobDetail\//i),
  workday("wellsfargo", "Wells Fargo", "https://www.wellsfargo.com/cib/careers/", [
    { host: "https://wf.wd1.myworkdayjobs.com", tenant: "wf", site: "WellsFargoJobs" },
  ]),
  html("cantor", "Cantor Fitzgerald", "Cantor/BGC public careers platform", "https://www.cantor.com/careers/", ["https://careers.cantor.com/"], /careers\.cantor\.com\/(?:job|jobs)\//i),
  workday("mufg", "MUFG", "https://careers.mufgamericas.com/mufg", [
    { host: "https://mufgub.wd3.myworkdayjobs.com", tenant: "mufgub", site: "MUFG-Careers" },
  ]),
  html("creditagricole", "Crédit Agricole", "Crédit Agricole public careers platform", "https://www.ca-cib.com/en/career", ["https://groupecreditagricole.jobs/en/our-offers/locations/55/", "https://jobs.ca-cib.com/Pages/Offre/ListeOffre.aspx?LCID=2057&changefacet=1&facet_JobCountry=55&mode=layer&showSearchUrl=1"], /(?:groupecreditagricole\.jobs\/en\/our-offers\/job|jobs\.ca-cib\.com\/offre-de-emploi\/emploi-[^/]+_\d+\.aspx)/i),
  html("natixis", "Natixis", "Natixis/Groupe BPCE public careers platform", "https://home.cib.natixis.com/careers", ["https://recrutement.natixis.com/nos-offres-demploi?location=Canada"], /recrutement\.natixis\.com\/(?:offre|job)\//i),
];

export const FIRMS = [...CORE_FIRMS, ...CANADIAN_FIRMS];

export const FIRMS_BY_KEY = new Map(FIRMS.map((firm) => [firm.key, firm]));
import { CANADIAN_FIRMS } from "./canadian-firms.mjs";
