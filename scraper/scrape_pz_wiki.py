#!/usr/bin/env python3
"""
Planet Zoo Animal Data Scraper
================================
Scrapes the Planet Zoo Fandom wiki and outputs data matching your
Google Sheet schema exactly:

  Animal Name | Type | Base Appeal | Conservation Status | Regions
  Biomes | Social Structure | Group Size Min/Max | Max Adult Males
  Max Adult Females | Base Land (m²) | Add. Land (m²)
  Base Water (m²) | Add. Water (m²) | Interspecies Enrichment Compatibility

Usage:
    pip install requests beautifulsoup4 lxml
    python scrape_pz_wiki.py               # list only (fast)
    python scrape_pz_wiki.py --all         # full detail scrape (~2 min)
    python scrape_pz_wiki.py --animal Lion # test single animal

Outputs:
    pz_animals_scraped.json   raw data
    pz_animals_patch.js       paste into pz1_animals.js
    pz_animals_sheet.tsv      open in Excel/Sheets directly
    diff_report.txt           human-readable summary
"""

import json, re, time, sys, argparse, csv
from io import StringIO

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Run:  pip install requests beautifulsoup4 lxml")
    sys.exit(1)

BASE  = "https://planetzoo.fandom.com"
LIST  = f"{BASE}/wiki/List_of_Animals"
UA    = {"User-Agent": "Mozilla/5.0 (PlanetZooDataBot/1.0; research)"}

# ── Normalizers ─────────────────────────────────────────────────────────────
STATUS = {
    "lc":"Least Concern","nt":"Near Threatened","vu":"Vulnerable",
    "en":"Endangered","cr":"Critically Endangered","ew":"Extinct in the Wild",
    "least concern":"Least Concern","near threatened":"Near Threatened",
    "vulnerable":"Vulnerable","endangered":"Endangered",
    "critically endangered":"Critically Endangered",
}
SOCIAL = {
    "solitary":"Solitary","pair":"Pair Bond","pair bond":"Pair Bond",
    "gregarious":"Gregarious","matrilineal":"Matrilineal",
    "patrilineal":"Patrilineal","harem":"Matrilineal","herd":"Gregarious",
}
TYPE_KEYWORDS = {
    "exhibit": "Exhibit", "aquarium": "Aquatic", "aviary": "Aviary"
}

def ns(s): return STATUS.get(s.strip().lower(), s.strip().title()) if s else "Unknown"
def nso(s): return SOCIAL.get(s.strip().lower(), s.strip().title()) if s else "Solitary"

def parse_space(text):
    """'510 m² +180 m²/ea.' → (510, 180)"""
    if not text: return 0, 0
    t = text.replace(",","").replace("\u00a0"," ").replace("m²","").replace("m2","")
    m = re.search(r'(\d+)[^+\d]*\+[^+\d]*(\d+)', t)
    if m: return int(m.group(1)), int(m.group(2))
    m = re.search(r'(\d+)', t)
    return (int(m.group(1)), 0) if m else (0, 0)

def guess_type(name, url=""):
    for kw, val in TYPE_KEYWORDS.items():
        if kw in url.lower() or kw in name.lower():
            return val
    return "Animal"

# ── Fetch helpers ────────────────────────────────────────────────────────────
def fetch(url):
    try:
        r = requests.get(url, headers=UA, timeout=20)
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"  WARN {url}: {e}")
        return None

# ── Animal list page ─────────────────────────────────────────────────────────
def get_list():
    print(f"Fetching list…")
    html = fetch(LIST)
    if not html: return []
    soup = BeautifulSoup(html, "lxml")
    animals = []
    for tbl in soup.find_all("table", class_=re.compile("wikitable", re.I)):
        for row in tbl.find_all("tr")[1:]:
            cells = row.find_all(["td","th"])
            if not cells: continue
            link = cells[0].find("a", href=re.compile(r"^/wiki/"))
            if not link: continue
            name = link.get_text(strip=True)
            href = link["href"]
            # Status from alt text or cell text
            status = "Unknown"
            for c in cells:
                img = c.find("img")
                if img:
                    s = ns(img.get("alt",""))
                    if s in STATUS.values(): status = s; break
                s = ns(c.get_text(strip=True))
                if s in STATUS.values(): status = s; break
            animals.append({"name": name, "href": href,
                             "conservationStatus": status,
                             "type": guess_type(name, href)})
    print(f"  {len(animals)} animals found")
    return animals

# ── Individual animal page ───────────────────────────────────────────────────
def get_detail(entry):
    html = fetch(BASE + entry["href"])
    if not html: return entry
    soup = BeautifulSoup(html, "lxml")
    r = dict(entry)

    def text(el): return el.get_text(" ", strip=True) if el else ""

    # Portable infobox (modern Fandom layout)
    for item in soup.find_all(class_=re.compile(r"pi-data\b", re.I)):
        lbl = text(item.find(class_=re.compile("pi-data-label", re.I))).lower()
        val = text(item.find(class_=re.compile("pi-data-value", re.I)))
        if not lbl or not val: continue

        if any(k in lbl for k in ["continent","region"]):
            r["region"] = val
        elif "biome" in lbl:
            r["biomes"] = [b.strip() for b in re.split(r"[,/\n•]", val) if b.strip()]
        elif "social" in lbl:
            r["socialStructure"] = nso(val)
        elif "land" in lbl and "space" in lbl:
            r["baseLand"], r["addLand"] = parse_space(val)
        elif "water" in lbl and "space" in lbl:
            r["baseWater"], r["addWater"] = parse_space(val)
        elif "group" in lbl and "min" in lbl:
            m = re.search(r"\d+", val)
            if m: r["minGroupSize"] = int(m.group())
        elif "group" in lbl and "max" in lbl:
            m = re.search(r"\d+", val)
            if m: r["maxGroupSize"] = int(m.group())
        elif "male" in lbl and "max" in lbl:
            m = re.search(r"\d+", val)
            if m: r["maxAdultMales"] = int(m.group())
        elif "female" in lbl and "max" in lbl:
            m = re.search(r"\d+", val)
            if m: r["maxAdultFemales"] = int(m.group())
        elif "compatible" in lbl or "enrichment" in lbl:
            r["compatibleAnimals"] = [a.strip() for a in re.split(r"[,\n•]", val) if a.strip()]
        elif "conservation" in lbl:
            s = ns(val)
            if s in STATUS.values(): r["conservationStatus"] = s

    # Fallback: old-style table infobox
    if "baseLand" not in r:
        for tbl in soup.find_all("table", class_=re.compile("infobox|wikitable", re.I)):
            for row in tbl.find_all("tr"):
                cells = row.find_all(["th","td"])
                if len(cells) < 2: continue
                lbl = cells[0].get_text(strip=True).lower()
                val = cells[-1].get_text(" ", strip=True)
                if "land" in lbl and "space" in lbl:
                    r["baseLand"], r["addLand"] = parse_space(val)
                elif "water" in lbl and "space" in lbl:
                    r["baseWater"], r["addWater"] = parse_space(val)
                elif "social" in lbl:
                    r["socialStructure"] = nso(val)

    # Body text fallback for space
    if not r.get("baseLand"):
        body = soup.get_text(" ")
        m = re.search(r"(\d[\d,]*)\s*m²\s*\+\s*(\d[\d,]*)\s*m²", body)
        if m:
            r["baseLand"] = int(m.group(1).replace(",",""))
            r["addLand"]  = int(m.group(2).replace(",",""))

    return r

# ── JS entry formatter ────────────────────────────────────────────────────────
def to_js(a):
    biomes = json.dumps(a.get("biomes", []))
    compat = json.dumps(a.get("compatibleAnimals", []))
    return (
        f'  {{ name: {json.dumps(a["name"])}, type: {json.dumps(a.get("type","Animal"))}, '
        f'appeal: {a.get("appeal",0)}, '
        f'conservationStatus: {json.dumps(a.get("conservationStatus","Unknown"))}, '
        f'region: {json.dumps(a.get("region",""))}, '
        f'biomes: {biomes}, '
        f'socialStructure: {json.dumps(a.get("socialStructure","Solitary"))}, '
        f'minGroupSize: {a.get("minGroupSize",1)}, maxGroupSize: {a.get("maxGroupSize",10)}, '
        f'maxAdultMales: {a.get("maxAdultMales",1)}, maxAdultFemales: {a.get("maxAdultFemales",1)}, '
        f'baseLand: {a.get("baseLand",0)}, addLand: {a.get("addLand",0)}, '
        f'baseWater: {a.get("baseWater",0)}, addWater: {a.get("addWater",0)}, '
        f'compatibleAnimals: {compat} }}'
    )

# ── TSV row (for Sheets import) ──────────────────────────────────────────────
def to_tsv_row(a):
    return [
        a.get("name",""),
        a.get("type","Animal"),
        a.get("appeal",""),
        a.get("conservationStatus",""),
        a.get("region",""),
        ", ".join(a.get("biomes",[])),
        a.get("socialStructure",""),
        a.get("minGroupSize",""),
        a.get("maxGroupSize",""),
        a.get("maxAdultMales",""),
        a.get("maxAdultFemales",""),
        a.get("baseLand",""),
        a.get("addLand",""),
        a.get("baseWater",""),
        a.get("addWater",""),
        ", ".join(a.get("compatibleAnimals",[])),
    ]

TSV_HEADERS = [
    "Animal Name","Type","Base Appeal","Conservation Status",
    "Regions / Continents","Biomes","Social Structure",
    "Group Size Min","Group Size Max","Max Adult Males","Max Adult Females",
    "Base Land (m²)","Add. Land (m²)","Base Water (m²)","Add. Water (m²)",
    "Interspecies Enrichment Compatibility"
]

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(description="Planet Zoo wiki scraper")
    p.add_argument("--all",    action="store_true", help="Scrape all detail pages")
    p.add_argument("--animal", type=str, help="Single animal name to test")
    args = p.parse_args()

    animals = get_list()
    if not animals:
        print("Could not fetch animal list. Wiki structure may have changed.")
        sys.exit(1)

    if args.animal:
        animals = [a for a in animals if args.animal.lower() in a["name"].lower()]
        print(f"Filtered to: {[a['name'] for a in animals]}")

    detailed = []
    if args.all or args.animal:
        print(f"\nFetching {len(animals)} detail pages (0.5s delay)…")
        for i, a in enumerate(animals):
            print(f"  [{i+1}/{len(animals)}] {a['name']}")
            detailed.append(get_detail(a))
            time.sleep(0.5)
    else:
        detailed = animals
        print("(Run with --all to also scrape habitat/space/social data)")

    # ── JSON ──
    with open("pz_animals_scraped.json","w",encoding="utf-8") as f:
        json.dump(detailed, f, indent=2, ensure_ascii=False)
    print(f"\n✅  pz_animals_scraped.json  ({len(detailed)} animals)")

    # ── JS patch ──
    with open("pz_animals_patch.js","w") as f:
        f.write("// Paste entries into src/data/pz1_animals.js\n")
        f.write("// Review appeal, maxAdultMales, maxAdultFemales manually\n\n")
        f.write("export const SCRAPED_ANIMALS = [\n")
        f.write(",\n".join(to_js(a) for a in detailed))
        f.write("\n];\n")
        f.write("export const SCRAPED_MAP = Object.fromEntries(SCRAPED_ANIMALS.map(a => [a.name, a]));\n")
    print(f"✅  pz_animals_patch.js")

    # ── TSV (paste into Google Sheets) ──
    buf = StringIO()
    w = csv.writer(buf, delimiter="\t")
    w.writerow(TSV_HEADERS)
    for a in sorted(detailed, key=lambda x: x["name"]):
        w.writerow(to_tsv_row(a))
    with open("pz_animals_sheet.tsv","w",encoding="utf-8") as f:
        f.write(buf.getvalue())
    print(f"✅  pz_animals_sheet.tsv  (open in Sheets: File → Import → Upload)")

    # ── Diff report ──
    with open("diff_report.txt","w") as f:
        f.write(f"Planet Zoo Scrape  —  {len(detailed)} animals\n{'='*70}\n")
        f.write(f"{'Name':<33} {'Status':<22} {'Land':>10} {'Water':>10}  Social\n")
        f.write(f"{'-'*70}\n")
        for a in sorted(detailed, key=lambda x: x["name"]):
            land  = f"{a.get('baseLand','?')}+{a.get('addLand','?')}"
            water = f"{a.get('baseWater','?')}+{a.get('addWater','?')}"
            f.write(f"{a['name']:<33} {a.get('conservationStatus','?'):<22} {land:>10} {water:>10}  {a.get('socialStructure','?')}\n")
    print(f"✅  diff_report.txt\n")
    print("Next steps:")
    print("  1. Open pz_animals_sheet.tsv → import into your Google Sheet PZ1_Animals tab")
    print("  2. Fill in appeal scores from the Steam guide")
    print("  3. Verify maxAdultMales / maxAdultFemales per species")
    print("  4. Copy entries from pz_animals_patch.js into src/data/pz1_animals.js")

if __name__ == "__main__":
    main()
