"""Read the reviewed BSO workbook and emit normalized JSON. Never writes the workbook or database."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import sys
import urllib.parse
from pathlib import Path

import openpyxl


def load_curated_importer(path: Path):
    spec = importlib.util.spec_from_file_location("curated_importer", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


SKIP_TITLE = re.compile(
    r"^(?:skip to|search for|career opportunities|sign in|apply|logo|remote type|locations?|time type|posted on|job requisition|about us|create a job alert)",
    re.I,
)
TITLE_SIGNAL = re.compile(
    r"\b(?:intern|co-?op|student|analyst|associate|principal|vice president|director|portfolio manager|researcher|investment|private equity|private credit|real estate|fixed income|credit)\b",
    re.I,
)


def clean_url(value):
    if not value:
        return ""
    parsed = urllib.parse.urlsplit(str(value).strip())
    keep = {}
    query = urllib.parse.parse_qs(parsed.query)
    for key in ("gh_jid", "jobId", "opportunityId", "fromDetail"):
        if key in query:
            keep[key] = query[key][0]
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urllib.parse.urlencode(keep), ""))


def title_from_description(description, company, level, career_path):
    lines = [re.sub(r"\s+", " ", line).strip() for line in str(description or "").splitlines()]
    page_loaded = re.search(r"\n\s*([^\n]{3,160}?)\s+page is loaded\s*(?:\n|$)", f"\n{description}\n", re.I)
    if page_loaded and TITLE_SIGNAL.search(page_loaded.group(1)):
        return page_loaded.group(1).strip()
    explicit = re.search(r"(?:^|\n)\s*Title\s*:\s*([^\n]{3,160})", str(description or ""), re.I)
    if explicit:
        return explicit.group(1).strip()
    seeking = re.search(r"\bseeking an?\s+([A-Z][^\n.]{2,90}?)\s+to join\b", str(description or ""), re.I)
    if seeking and TITLE_SIGNAL.search(seeking.group(1)):
        return seeking.group(1).strip()
    candidates = []
    level_words = [word.lower() for word in re.findall(r"[A-Za-z]+", str(level or "")) if len(word) > 3]
    path_words = [word.lower() for word in re.findall(r"[A-Za-z]+", str(career_path or "")) if len(word) > 3]
    for index, line in enumerate(lines):
        if not line or len(line) > 180 or SKIP_TITLE.search(line):
            continue
        if TITLE_SIGNAL.search(line) and not re.search(r"\b(?:responsibilities|qualifications|experience|opportunity|overview|what you|similar jobs|pleased to welcome|assist with|responsible for|conduct|support|strong understanding|knowledge of|ability to)\b", line, re.I):
            lower = line.lower()
            score = (4 if any(word in lower for word in level_words) else 0) + (4 if any(word in lower for word in path_words) else 0)
            score += 2 if index < 35 else 0
            score -= 3 if line.endswith(".") or len(line.split()) > 18 else 0
            candidates.append((score, -index, line.replace(" page is loaded", "").strip()))
    if candidates:
        return max(candidates)[2]
    return f"{level or 'Unspecified'} - {career_path or 'Investment role'} at {company}"


def external_id(url, title):
    patterns = [r"_([A-Z]{1,5}\d{2,})(?:[-/?]|$)", r"gh_jid=(\d+)", r"/(?:job|jobs)/(?:[^/?]+/)*[^/?]*_([A-Z]{1,5}\d{2,})(?:[-/?]|$)", r"/([A-Z]?R?\d{4,})(?:\?|$)"]
    for pattern in patterns:
        match = re.search(pattern, url, re.I)
        if match:
            return match.group(1)
    return "workbook-" + hashlib.sha256(f"{url}|{title}".encode()).hexdigest()[:20]


def buyside_rows(workbook: Path):
    sheet = openpyxl.load_workbook(workbook, data_only=True, read_only=True)["Buyside"]
    rows = []
    for row_number, values in enumerate(sheet.iter_rows(values_only=True), start=1):
        company, level, career_path, description, raw_url = (list(values) + [None] * 5)[:5]
        if not company:
            continue
        company = str(company).strip()
        description = str(description or "").strip()
        url = clean_url(raw_url)
        title = title_from_description(description, company, level, career_path)
        location_matches = re.findall(
            r"\b(?:Toronto|Calgary|Vancouver|Victoria|Montr[eé]al|Ottawa|Edmonton|Winnipeg|Halifax|Waterloo|Mississauga|Markham)(?:\s*,\s*(?:ON|AB|BC|QC|NS|MB|Ontario|Alberta|British Columbia|Qu[eé]bec))?\b",
            description,
            re.I,
        )
        locations = list(dict.fromkeys(location_matches))
        rows.append({
            "row": row_number,
            "company": company,
            "level": str(level or "Unspecified").strip(),
            "careerPath": str(career_path or "").strip(),
            "title": title,
            "description": description,
            "url": url,
            "externalId": external_id(url, title),
            "locations": locations,
            "declaredCompany": (re.search(r"\bCompany\s*:\s*([^\n]{2,80})", description, re.I).group(1).strip()
                                if re.search(r"\bCompany\s*:\s*([^\n]{2,80})", description, re.I) else None),
        })
    return rows


def main():
    workbook = Path(sys.argv[1]).resolve()
    importer_path = Path(__file__).with_name("import-curated-workbook.py")
    importer = load_curated_importer(importer_path)
    ib_jobs, duplicate_rows = importer.build_jobs(workbook)
    print(json.dumps({
        "investmentBanking": ib_jobs,
        "investmentBankingDuplicateRows": duplicate_rows,
        "buySide": buyside_rows(workbook),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
