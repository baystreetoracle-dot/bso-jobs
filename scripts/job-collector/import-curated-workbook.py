"""Import the reviewed BSO investment-banking workbook into Supabase.

The workbook is treated strictly as source data.  This importer is intentionally
separate from the automated collectors because the rows have been manually
curated and occasionally need explicit corrections.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import openpyxl


COMPANIES = {
    "Agentis Capital": ("agentis-capital-advisors", "Agentis Capital Advisors"),
    "BMO Capital Markets": ("bmo-capital-markets", "BMO Capital Markets"),
    "BMO": ("bmo-capital-markets", "BMO Capital Markets"),
    "CIBC Capital Markets": ("cibc", "CIBC Capital Markets"),
    "Deloitte": ("deloitte-corporate-finance", "Deloitte Corporate Finance"),
    "Greenhill": ("mizuho-greenhill", "Mizuho / Greenhill"),
    "JPMorgan": ("jpmorgan", "J.P. Morgan"),
    "Morgan Stanley": ("morgan-stanley", "Morgan Stanley"),
    "RBC Capital Markets": ("rbc-capital-markets", "RBC Capital Markets"),
    "TD Securities": ("td-securities", "TD Securities"),
    "Barclays": ("barclays", "Barclays"),
    "KPMG": ("kpmg-corporate-finance", "KPMG Corporate Finance"),
    "Stifel": ("stifel-canada", "Stifel Canada"),
    "Ventum Financial": ("ventum-financial", "Ventum Financial"),
    "BDO": ("bdo-canada", "BDO Canada"),
    "Scotia Velocity M&A": ("scotiabank", "Scotiabank Global Banking and Markets"),
    "Scotiabank GBM": ("scotiabank", "Scotiabank Global Banking and Markets"),
    "ATB Cormark": ("atb-capital-markets", "ATB Capital Markets"),
    "Alvarez & Marsal": ("alvarez-and-marsal", "Alvarez & Marsal"),
    "Rothschild": ("rothschild-and-co", "Rothschild & Co."),
    "Macquarie": ("macquarie-capital", "Macquarie Capital"),
    "Origin Merchant Partners": ("origin-merchant-partners", "Origin Merchant Partners"),
    "EY Corporate Finance": ("ey-corporate-finance", "EY Corporate Finance"),
    "Fort Capital": ("fort-capital", "Fort Capital"),
    "Raymond James": ("raymond-james-canada", "Raymond James Ltd."),
    "MNP": ("mnp-corporate-finance", "MNP Corporate Finance"),
    "Grant Thorton": ("raymond-chabot-grant-thornton", "Raymond Chabot Grant Thornton"),
    "Baker Tilly": ("baker-tilly-canada-capital", "Baker Tilly Canada Capital"),
    "National Bank Capital Markets": ("national-bank-financial-markets", "National Bank Capital Markets"),
    "Jefferies": ("jefferies", "Jefferies"),
}


def role(title, external_id, location, seniority, program="Full-time", specialization=None, **extra):
    return {
        "title": title,
        "external_job_id": external_id,
        "location_display": location,
        "seniority": seniority,
        "program_type": program,
        "specialization": specialization,
        **extra,
    }


# Explicit row review prevents pasted navigation text from becoming job data.
ROLES = {
    2: role("Investment Banking Analyst - Infrastructure M&A Advisory - 2026", "d5e656b2-ddf0-4431-b051-3cc425d3245a", "Toronto, ON / Vancouver, BC", "Analyst", specialization="Infrastructure M&A Advisory", workplace_type="On-site"),
    3: role("Investment Banking Associate - Public Private Partnership Transaction Advisory", "926c06fa-c9cd-48b9-924e-ed4acd5a2d19", "Toronto, ON / Vancouver, BC", "Associate", specialization="PPP Transaction Advisory", workplace_type="On-site"),
    4: role("Investment Banking Summer Analyst - Infrastructure M&A Advisory - Summer 2027", "af7e9253-cea8-4287-baf9-838a900546b3", "Toronto, ON / Vancouver, BC", "Intern", "Internship", "Infrastructure M&A Advisory", workplace_type="On-site", term_start="2027-05-01", term_end="2027-08-31", term_length_months=4),
    5: role("Investment Banking Analyst, Mergers and Acquisitions (M&A)", "R260024682", "Toronto, ON", "Analyst", specialization="Mergers & Acquisitions", city="Toronto", province="ON", salary_min=100000, salary_max=100000, salary_currency="CAD", salary_period="year"),
    6: role("Investment Banking Analyst, Technology", "R260025058", "Toronto, ON", "Analyst", specialization="Technology", city="Toronto", province="ON", salary_min=100000, salary_max=100000, salary_currency="CAD", salary_period="year"),
    7: role("Investment Banking Associate, Technology", "R260025055", "Toronto, ON", "Associate", specialization="Technology", city="Toronto", province="ON", salary_min=135000, salary_max=135000, salary_currency="CAD", salary_period="year"),
    8: role("BMO Capital Markets Winter 2027 Investment Banking Analyst, Real Estate Brokerage, Toronto", "R260021697", "Toronto, ON", "Intern", "Co-op", "Real Estate", city="Toronto", province="ON", term_start="2027-01-01", term_end="2027-04-30", term_length_months=4),
    9: role("BMO Capital Markets Winter 2027 Investment Banking Analyst, Metals & Mining, Toronto", "R260021761", "Toronto, ON", "Intern", "Co-op", "Metals & Mining", city="Toronto", province="ON", term_start="2027-01-01", term_end="2027-04-30", term_length_months=4),
    10: role("BMO Capital Markets Winter 2027 Investment Banking Analyst, Vancouver", "R260021763", "Vancouver, BC", "Intern", "Co-op", "Investment Banking", city="Vancouver", province="BC", workplace_type="On-site", date_posted="2026-08-25", application_deadline="2026-09-20", term_start="2027-01-01", term_end="2027-04-30", term_length_months=4, application_url="https://jobs.bmo.com/global/en/job/R260021763/BMO-Capital-Markets-Winter-2027-Investment-Banking-Analyst-Vancouver-Co-op-Internship"),
    11: role("Analyst / Associate, Investment Banking - Montreal", "R260010184", "Montreal, QC", "Unspecified", specialization="Investment Banking", city="Montreal", province="QC", date_posted="2026-09-03", quality="Combined Analyst/Associate posting; seniority requires manual review."),
    12: role("Director, Global Investment Banking", "2617415", "Calgary, AB", "Director", specialization="Energy, Infrastructure & Transition", city="Calgary", province="AB", application_deadline="2026-09-24"),
    13: role("Global Investment Banking, Student Analyst, Winter 2027 Montreal - Bilingual", "2617249", "Montreal, QC", "Student", "Co-op", "Investment Banking", city="Montreal", province="QC", term_start="2027-01-01", term_end="2027-04-30", term_length_months=4),
    14: role("Global Investment Banking Analyst, Winter 2027 (Winnipeg)", "2618453", "Winnipeg, MB", "Student", "Co-op", "Investment Banking", city="Winnipeg", province="MB", term_start="2027-01-01", term_end="2027-04-30", term_length_months=4),
    15: role("Global Investment Banking Analyst, Winter 2027 (Calgary)", "2618460", "Calgary, AB", "Student", "Co-op", "Investment Banking", city="Calgary", province="AB", term_start="2027-01-01", term_end="2027-04-30", term_length_months=4),
    16: role("Global Investment Banking Analyst, Summer 2027 Advancement Program", "2618188", "Toronto, ON", "Intern", "Internship", "Investment Banking", city="Toronto", province="ON", term_start="2027-05-01", term_end="2027-08-31", term_length_months=4),
    17: role("Analyst/Consultant, Corporate Finance - New Grad Fall 2027 - Multiple Locations", "134485", "Multiple locations, Canada", "Analyst", "New Graduate Program", "Corporate Finance"),
    18: role("Mizuho | Greenhill - Investment Banking M&A Associate", "R7181", "Toronto, ON", "Associate", specialization="Mergers & Acquisitions", city="Toronto", province="ON"),
    19: role("Investment Banking Associate - Diversified Industries - Canada", "210762506", "Toronto, ON", "Associate", specialization="Diversified Industries", city="Toronto", province="ON"),
    20: role("Canada Investment Banking Analyst", "549798030828", "Toronto, ON", "Analyst", specialization="Investment Banking", city="Toronto", province="ON"),
    21: role("Canada Investment Banking Associate", "549799748436", "Toronto, ON", "Associate", specialization="Investment Banking", city="Toronto", province="ON"),
    22: role("VP, Global Investment Banking, Mining & Metals", "R-0000178260", "Vancouver, BC", "Vice President", specialization="Mining & Metals", city="Vancouver", province="BC"),
    23: role("2027 Full-Time Analyst - Investment Banking, Global Energy", "R_1509729", "Calgary, AB", "Analyst", "New Graduate Program", "Global Energy", city="Calgary", province="AB"),
    24: role("Investment Banking Associate, Global Energy", "R_1508614", "Calgary, AB", "Associate", specialization="Global Energy", city="Calgary", province="AB", application_deadline="2026-09-16", status="closed", quality="Confirmed filled on 2026-09-16."),
    25: role("Investment Banking, Associate", "JR-0000124562", "Calgary, AB", "Associate", specialization="Investment Banking", city="Calgary", province="AB", salary_min=220000, salary_max=270000, salary_currency="CAD", salary_period="year"),
    26: role("Associate, Corporate Finance", "33097", "Toronto / Hamilton / Kitchener / Ottawa, ON", "Associate", specialization="Corporate Finance"),
    27: role("Associate Vice President, Corporate Finance", "33224", "Toronto / Hamilton / Kitchener / Ottawa, ON", "Vice President", specialization="Corporate Finance"),
    29: role("Investment Banking Analyst (Future Opportunities)", "9916", "Toronto, ON", "Analyst", specialization="Investment Banking", city="Toronto", province="ON", quality="Evergreen future-opportunities posting."),
    30: role("Investment Banking Analyst", "1043", "Toronto, ON", "Analyst", specialization="Investment Banking", city="Toronto", province="ON"),
    31: role("Associate, M&A and Capital Markets", "JR7076", "Toronto, ON", "Associate", specialization="Mergers & Acquisitions", city="Toronto", province="ON"),
    32: role("Co-op or Intern, M&A and Capital Markets - January 2027", "JR6802", "Toronto, ON", "Intern", "Co-op", "Mergers & Acquisitions", city="Toronto", province="ON", term_start="2027-01-01"),
    34: role("Velocity - Mergers & Acquisitions Internship/Co-op - Winter 2027", "272366", "Toronto, ON", "Intern", "Co-op", "Mergers & Acquisitions", city="Toronto", province="ON", term_start="2027-01-01", term_end="2027-04-30", term_length_months=4),
    35: role("Investment Banking Summer Student, Mining", "3249", "Toronto, ON", "Student", "Internship", "Mining", city="Toronto", province="ON", term_start="2027-05-01", term_end="2027-08-31", term_length_months=4),
    36: role("Investment Banking Summer Student, Energy", "3204", "Calgary, AB", "Student", "Internship", "Energy", city="Calgary", province="AB", term_start="2027-05-01", term_end="2027-08-31", term_length_months=4),
    37: role("VP, Investment Banking, Mining", "3236", "Toronto, ON", "Vice President", specialization="Mining", city="Toronto", province="ON", application_deadline="2026-09-23"),
    38: role("Analyst, Corporate Finance", "18014934", "Toronto, ON", "Analyst", specialization="Restructuring / Corporate Finance", city="Toronto", province="ON"),
    39: role("Global Advisory, Metals & Mining, Junior Associate", "JR015548", "Toronto, ON", "Associate", specialization="Metals & Mining", city="Toronto", province="ON"),
    40: role("2027 Macquarie Capital Summer Analyst Internship Program, Critical Minerals and Energy", "24194", "Toronto, ON", "Intern", "Internship", "Critical Minerals & Energy", city="Toronto", province="ON", employment_type="Fixed term", date_posted="2026-09-10", application_deadline="2026-10-12", term_start="2027-05-01", term_end="2027-08-31", term_length_months=4),
    41: role("Analyst, Investment Banking, Mining, Global Banking and Markets", "272530", "Vancouver, BC", "Analyst", specialization="Mining", city="Vancouver", province="BC"),
    42: role("Experienced Investment Banking Analyst", "origin-ft-analyst-june-2026", "Toronto, ON", "Analyst", specialization="Investment Banking", city="Toronto", province="ON"),
    43: role("Associate (Manager), M&A", "1738980", "Montreal, QC", "Associate", specialization="Mergers & Acquisitions", city="Montreal", province="QC", quality="Employer title pairs Associate with Manager; normalized to Associate from the supplied level."),
    44: role("Investment Banking Winter Analyst - January to April 2027", "fort-winter-analyst-vancouver-2027", "Vancouver, BC", "Intern", "Internship", "Investment Banking", city="Vancouver", province="BC", term_start="2027-01-01", term_end="2027-04-30", term_length_months=4),
    45: role("Investment Banking Summer Analyst - May to August 2027", "fort-summer-analyst-toronto-2027", "Toronto, ON", "Intern", "Internship", "Investment Banking", city="Toronto", province="ON", application_deadline="2026-10-02", term_start="2027-05-01", term_end="2027-08-31", term_length_months=4),
    46: role("Investment Banking Analyst / Associate (Future Opportunities)", "643320", "Toronto, ON", "Unspecified", specialization="Investment Banking", city="Toronto", province="ON", quality="Combined Analyst/Associate future-opportunities posting; seniority requires manual review."),
    47: role("Analyst, Corporate Finance - Capital Advisory", "ANALY018148", "Calgary, AB", "Analyst", specialization="Capital Advisory", city="Calgary", province="AB", date_posted="2026-08-06"),
    48: role("Associate, Corporate Finance", "ASSOC018710", "Vancouver, BC", "Associate", specialization="Corporate Finance", city="Vancouver", province="BC", date_posted="2026-09-15"),
    49: role("Vice President, Corporate Finance", "VICEP017942", "Toronto, ON", "Vice President", specialization="Corporate Finance", city="Toronto", province="ON", date_posted="2026-09-14"),
    50: role("Senior Analyst - M&A and Corporate Finance", "R006805", "Montreal, QC", "Analyst", specialization="Mergers & Acquisitions", city="Montreal", province="QC"),
    51: role("Associate / Senior Associate, Mergers & Acquisitions", "associate-senior-associate-mergers-acquisitions", "Toronto, ON", "Associate", specialization="Mergers & Acquisitions", city="Toronto", province="ON", quality="Combined Associate/Senior Associate posting."),
    52: role("Real Estate Brokerage Analyst (Investment Banking)", "35236", "Montreal, QC", "Analyst", specialization="Real Estate Investment Banking", city="Montreal", province="QC", workplace_type="On-site", date_posted="2026-09-01"),
    53: role("Investment Banking Associate - Canada", "4048", "Toronto, ON", "Associate", specialization="Generalist", city="Toronto", province="ON"),
}


def clean_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    if not parsed.scheme:
        return url
    essential = {}
    query = urllib.parse.parse_qs(parsed.query)
    for key in ("cid", "ccId", "jobId", "opportunityId", "fromDetail"):
        if key in query:
            essential[key] = query[key][0]
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urllib.parse.urlencode(essential), ""))


def load_env(path: Path):
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def request(method, base_url, key, table, *, query="", payload=None, prefer=None):
    url = f"{base_url.rstrip('/')}/rest/v1/{table}{query}"
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    if prefer:
        headers["Prefer"] = prefer
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            content = response.read()
            return json.loads(content) if content else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase {method} {table} failed ({exc.code}): {detail}") from exc


def build_jobs(workbook: Path):
    sheet = openpyxl.load_workbook(workbook, data_only=True, read_only=True)["Investment Banking"]
    now = datetime.now(timezone.utc).isoformat()
    jobs = []
    duplicates = []
    seen = set()
    for row_number, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        firm, _group, _level, _blank, _description, link = row
        if not firm:
            continue
        firm = str(firm).strip()
        if firm not in COMPANIES:
            raise ValueError(f"Row {row_number}: unmapped firm {firm!r}")
        if row_number == 28 or row_number == 33:
            duplicates.append(row_number)
            continue
        spec = dict(ROLES[row_number])
        company_id, company_name = COMPANIES[firm]
        identity = (company_id, spec["external_job_id"])
        if identity in seen:
            duplicates.append(row_number)
            continue
        seen.add(identity)
        source_url = spec.pop("application_url", None) or clean_url(str(link or ""))
        quality = spec.pop("quality", None)
        job = {
            "company_id": company_id,
            "company_name": company_name,
            "country": "Canada",
            "category": "Investment Banking",
            "application_url": source_url,
            "source_url": source_url,
            "source_name": "BSO curated workbook / company careers",
            "source_record_id": f"curated:{company_id}:{spec['external_job_id']}",
            "employment_type": spec.pop("employment_type", "Full-time"),
            "program_type": spec.get("program_type", "Unspecified"),
            "status": "active",
            "last_verified_at": now,
            "updated_at": now,
            "data_quality_notes": f"Imported from reviewed workbook row {row_number}." + (f" {quality}" if quality else ""),
            **spec,
        }
        jobs.append(job)
    return jobs, duplicates


COMPARE_FIELDS = {
    "company_name", "title", "location_display", "country", "category", "seniority",
    "application_url", "source_url", "source_name", "city", "province", "workplace_type",
    "specialization", "employment_type", "program_type", "term_start", "term_end",
    "term_length_months", "date_posted", "application_deadline", "salary_min", "salary_max",
    "salary_currency", "salary_period", "data_quality_notes", "status",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("--write", action="store_true", help="Perform the Supabase upsert")
    args = parser.parse_args()
    if not args.workbook.exists():
        raise FileNotFoundError(args.workbook)

    load_env(Path(".env.local"))
    base_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    read_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    write_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    key = write_key if args.write else (read_key or write_key)
    if not base_url or not key:
        raise RuntimeError("Supabase URL/key is unavailable")
    if args.write and not write_key:
        raise RuntimeError("--write requires SUPABASE_SERVICE_ROLE_KEY")

    jobs, duplicate_rows = build_jobs(args.workbook)
    existing = request("GET", base_url, key, "jobs", query="?select=*") or []
    by_identity = {(j["company_id"], j["external_job_id"]): j for j in existing}
    inserted, changed, unchanged = [], [], []
    for job in jobs:
        current = by_identity.get((job["company_id"], job["external_job_id"]))
        if current:
            job["source_record_id"] = current["source_record_id"]
            different = any(
                current.get(field) != job.get(field)
                for field in COMPARE_FIELDS
                if field in job
            )
            (changed if different else unchanged).append(job)
        else:
            inserted.append(job)

    print(json.dumps({
        "mode": "WRITE" if args.write else "DRY RUN",
        "workbook_rows": len(jobs) + len(duplicate_rows),
        "unique_jobs": len(jobs),
        "duplicate_rows_skipped": duplicate_rows,
        "would_insert": len(inserted),
        "would_update": len(changed),
        "unchanged_but_reverified": len(unchanged),
    }, indent=2))
    for job in jobs:
        action = "INSERT" if job in inserted else "UPDATE" if job in changed else "REVERIFY"
        print(f"{action:8} | {job['company_name']} | {job['title']} | {job['location_display']} | {job['external_job_id']}")

    if not args.write:
        return

    company_payload = [
        {"company_id": company_id, "name": company_name}
        for company_id, company_name in sorted(set(COMPANIES.values()))
    ]
    request("POST", base_url, write_key, "companies", query="?on_conflict=company_id", payload=company_payload,
            prefer="resolution=merge-duplicates,return=minimal")
    # PostgREST bulk inserts require identical object keys.  The curated rows
    # intentionally have different optional fields, so write them separately;
    # omitted keys then preserve existing optional values instead of nulling them.
    for job in jobs:
        request("POST", base_url, write_key, "jobs", query="?on_conflict=company_id,external_job_id", payload=job,
                prefer="resolution=merge-duplicates,return=minimal")
    print(f"WRITE COMPLETE: {len(inserted)} inserted, {len(changed)} updated, {len(unchanged)} reverified; 0 jobs closed.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
