import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { stableUrlId } from "./adapters/shared.mjs";
import { FIRMS } from "./sources/firms.mjs";

function companyKey(value) {
  return String(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

const aliases = new Map([
  ["cppib", "cpp-investments"], ["cpp investments", "cpp-investments"], ["otpp", "ontario-teachers"],
  ["ontario teachers", "ontario-teachers"], ["cdpq", "la-caisse"], ["la caisse", "la-caisse"],
  ["ccl", "ccl"], ["cc l", "ccl"], ["cc and l", "ccl"], ["ci financial", "ci-financial"], ["fengate", "fengate"],
  ["crestpoint", "crestpoint"], ["nicola wealth", "nicola-wealth"], ["upp", "upp"],
  ["canada infrastructure bank", "canada-infrastructure-bank"], ["choice properties", "choice-properties"],
  ["capreit", "capreit"], ["anson funds", "anson-funds"], ["manulife", "manulife-investment-management"],
  ["brookfield", "brookfield-asset-management"], ["psp", "psp-investments"], ["agentis", "agentis"],
  ["atb cormark", "atb-cormark"], ["scotiabank", "scotia"], ["franklin templeton", "franklin-templeton"],
  ["purpose", "purpose-investments"], ["cibc", "cibc-asset-management"], ["bmo", "bmo-capital-partners"], ["deloitte", "deloitte-cf"],
]);
for (const firm of FIRMS) aliases.set(companyKey(firm.name), firm.key);

function locatePython() {
  const candidates = [
    process.env.PYTHON_BIN,
    "C:/Users/thoma/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe",
    "python",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate === "python" || existsSync(candidate)) return candidate;
  }
  throw new Error("Python with openpyxl is required to read the workbook.");
}

export function readWorkbook(workbookPath) {
  const run = spawnSync(locatePython(), [new URL("./workbook-seed.py", import.meta.url).pathname.replace(/^\/(.:)/, "$1"), workbookPath], {
    encoding: "utf8", maxBuffer: 50 * 1024 * 1024, env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  if (run.status !== 0) throw new Error(`Workbook reader failed: ${run.stderr || run.stdout}`);
  const data = JSON.parse(run.stdout);
  const unknownCompanies = [];
  const buySideCandidates = data.buySide.map((row) => {
    const key = aliases.get(companyKey(row.company));
    const firm = FIRMS.find((item) => item.key === key);
    if (!firm) unknownCompanies.push({ row: row.row, company: row.company });
    return {
      firm: firm ?? { key: `workbook-${companyKey(row.company).replace(/\s+/g, "-")}`, name: row.company, companyId: `workbook-${companyKey(row.company).replace(/\s+/g, "-")}`, universe: "buy-side", careerPath: row.careerPath },
      externalId: row.externalId || stableUrlId(row.url), title: row.title,
      locations: row.locations, description: row.description,
      metadataText: `${row.careerPath} reviewed workbook seed`, applicationUrl: row.url, sourceUrl: row.url,
      employmentType: null, workbookRow: row.row, workbookDeclaredCompany: row.declaredCompany,
    };
  });
  return { ...data, buySideCandidates, unknownCompanies };
}
