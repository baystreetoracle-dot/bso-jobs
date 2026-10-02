import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const LOGO_DIRECTORY = path.join(process.cwd(), "public", "company-logos", "bso-supplied");
const BSO_LOGO_PATH = path.join(process.cwd(), "public", "email-assets", "baystreetoracle-logo.jpeg");

const COMPANY_LOGO_ALIASES = {
  "ATB Capital Markets": "atb-capital-markets.webp",
  "ATB Cormark Capital Markets": "atb-capital-markets.webp",
  Barclays: "barclays-bank.webp",
  "BDO Canada": "bdo.webp",
  "BDO M&A & Capital Markets": "bdo.webp",
  "Canaccord Genuity": "canaccord-financial.webp",
  "Crédit Agricole": "credit-agricole-cib.webp",
  "Crédit Agricole CIB": "credit-agricole-cib.webp",
  "Deloitte Corporate Finance": "deloitte.webp",
  "Desjardins Capital Markets": "desjardins.webp",
  "EdgePoint Investment Group": "edgepoint.webp",
  "EdgePoint Wealth Management": "edgepoint.webp",
  Evercore: "evercore-inc.webp",
  "EY Corporate Finance": "ey-parthenon.webp",
  "EY-Parthenon Corporate Finance": "ey-parthenon.webp",
  "J.P. Morgan": "jpmorgan.webp",
  JPMorgan: "jpmorgan.webp",
  "KPMG Corporate Finance": "kpmg.webp",
  Macquarie: "macquariegroup.webp",
  "Macquarie Capital": "macquariegroup.webp",
  "Mizuho / Greenhill": "greenhill-co.webp",
  "National Bank Capital Markets": "national-bank.webp",
  "Ontario Teachers' Pension Plan": "ontario-teachers-pension-plan.webp",
  PwC: "pwc.webp",
  "PwC Corporate Finance / Deals": "pwc.webp",
  "Raymond Chabot Grant Thornton": "grant-thornton-us.webp",
  "Raymond James Ltd.": "raymond-james-financial-inc.webp",
  "Rothschild & Co.": "rothschildandco.webp",
  "Scotiabank Global Banking and Markets": "scotiabank-gbm.webp",
  "Stifel Canada": "stifel-financial-corp.webp",
  "TD Securities": "td.webp",
  TPH: "tudor-pickering-holt.webp",
};

function slugify(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").replace(/-{2,}/g, "-");
}

async function companyLogoFilename(companyName) {
  if (COMPANY_LOGO_ALIASES[companyName]) return COMPANY_LOGO_ALIASES[companyName];
  const target = slugify(companyName);
  const files = await readdir(LOGO_DIRECTORY);
  return files.find((filename) => slugify(path.parse(filename).name) === target) ?? null;
}

async function pngAttachment(sourcePath, filename, contentId) {
  const content = await sharp(sourcePath)
    .resize(112, 112, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  return {
    content: content.toString("base64"),
    filename,
    content_type: "image/png",
    content_id: contentId,
  };
}

export async function buildJobAlertLogoAttachments(jobs) {
  const attachments = [{
    content: (await readFile(BSO_LOGO_PATH)).toString("base64"),
    filename: "bay-street-oracle.jpeg",
    content_type: "image/jpeg",
    content_id: "bso-logo",
  }];
  const companyLogoCids = new Map();
  for (const job of jobs) {
    if (companyLogoCids.has(job.company_name)) continue;
    const filename = await companyLogoFilename(job.company_name);
    if (!filename) continue;
    const slug = slugify(job.company_name);
    const contentId = `company-${slug}`;
    attachments.push(await pngAttachment(path.join(LOGO_DIRECTORY, filename), `${slug}.png`, contentId));
    companyLogoCids.set(job.company_name, contentId);
  }
  return { attachments, companyLogoCids };
}
