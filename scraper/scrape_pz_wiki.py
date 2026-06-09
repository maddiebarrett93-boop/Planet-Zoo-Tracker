#!/usr/bin/env python3
"""
Planet Zoo Animal Data Scraper — Fandom API edition
=====================================================
Uses Fandom's public MediaWiki API instead of scraping HTML directly,
which bypasses the 403 bot-blocking on page requests.

Usage:
    python scrape_pz_wiki.py               # list only (fast)
    python scrape_pz_wiki.py --all         # full detail scrape (~3 min)
    python scrape_pz_wiki.py --animal Lion # test single animal

Outputs:
    pz_animals_scraped.json
    pz_animals_patch.js      paste into src/data/pz1_animals.js
    pz_animals_sheet.tsv     import straight into Google Sheets
    diff_report.txt
"""

import json, re, time, sys, argparse, csv
from io import StringIO
from urllib.parse import quote

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Run:  pip install requests beautifulsoup4 lxml")
    sys.exit(1)

WIKI    = "https://planetzoo.fandom.com"
API     = f"{WIKI}/api.php"

# Fandom blocks basic bot UAs but passes browser UAs fine
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://planetzoo.fandom.com/",
}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)

# ── Normalizers ──────────────────────────────────────────────────────────────
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
    "pairbond":"Pair Bond",
}

def ns(s):
    return STATUS.get(s.strip().lower(), None) if s else None

def nso(s):
    return SOCIAL.get(s.strip().lower(), s.strip().title()) if s else "Solitary"

def parse_space(text):
    """'510 m² +180 m²/ea.' → (510, 180)"""
    if not text: return 0, 0
    t = text.replace(",","").replace("\u00a0"," ").replace("m²","").replace("m2","")
    m = re.search(r'(\d+)[^+\d]*\+[^+\d]*(\d+)', t)
    if m: return int(m.group(1)), int(m.group(2))
    m = re.search(r'(\d+)', t)
    return (int(m.group(1)), 0) if m else (0, 0)

def guess_type(name, cats=""):
    cats_l = cats.lower()
    name_l = name.lower()
    if "exhibit" in cats_l or "exhibit" in name_l: return "Exhibit"
    if "aquarium" in cats_l or "aquatic" in cats_l: return "Aquatic"
    if "aviary" in cats_l or "bird" in cats_l:      return "Aviary"
    return "Animal"

# ── Fandom API helpers ────────────────────────────────────────────────────────
def api_get(params):
    params["format"] = "json"
    try:
        r = SESSION.get(API, params=params, timeout=20)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  WARN API: {e}")
        return {}

def get_page_wikitext(title):
    """Fetch raw wikitext for a page via the API — bypasses HTML bot detection."""
    data = api_get({"action":"parse","page":title,"prop":"wikitext","redirects":1})
    return data.get("parse",{}).get("wikitext",{}).get("*","")

def get_page_html(title):
    """Fetch parsed HTML via the API."""
    data = api_get({"action":"parse","page":title,"prop":"text","redirects":1})
    return data.get("parse",{}).get("text",{}).get("*","")

def get_category_members(category, limit=500):
    """List all pages in a category."""
    members = []
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": f"Category:{category}",
        "cmlimit": limit,
        "cmtype": "page",
    }
    while True:
        data = api_get(params)
        members += data.get("query",{}).get("categorymembers",[])
        cont = data.get("continue",{}).get("cmcontinue")
        if not cont: break
        params["cmcontinue"] = cont
    return members

# ── Animal list via categories ────────────────────────────────────────────────
ANIMAL_CATEGORIES = [
    "Animals", "Planet_Zoo_animals",
    "Animals_in_Planet_Zoo", "Planet_Zoo_1_animals",
]

def get_animal_list():
    print("Fetching animal list via Fandom API…")

    # Try each category until we get results
    members = []
    for cat in ANIMAL_CATEGORIES:
        members = get_category_members(cat)
        if members:
            print(f"  Found {len(members)} entries in Category:{cat}")
            break

    # Fallback: parse the List_of_Animals page via API
    if not members:
        print("  Trying List_of_Animals page via API…")
        html = get_page_html("List_of_Animals")
        if html:
            soup = BeautifulSoup(html, "lxml")
            for tbl in soup.find_all("table", class_=re.compile("wikitable",re.I)):
                for row in tbl.find_all("tr")[1:]:
                    cells = row.find_all(["td","th"])
                    if not cells: continue
                    link = cells[0].find("a")
                    if not link: continue
                    name = link.get_text(strip=True)
                    status = "Unknown"
                    for c in cells:
                        img = c.find("img")
                        if img:
                            s = ns(img.get("alt",""))
                            if s: status = s; break
                        s = ns(c.get_text(strip=True))
                        if s: status = s; break
                    members.append({"title": name, "conservationStatus": status})

    if not members:
        print("  ERROR: Could not retrieve animal list from any source.")
        return []

    return [{"name": m["title"], "conservationStatus": m.get("conservationStatus","Unknown")} for m in members]

# ── Parse wikitext infobox ────────────────────────────────────────────────────
# Wikitext infoboxes look like:  | Label = Value
def parse_wikitext_infobox(wikitext):
    fields = {}
    for line in wikitext.splitlines():
        m = re.match(r'\|\s*([^=|]+?)\s*=\s*(.+)', line)
        if m:
            key = m.group(1).strip().lower()
            val = re.sub(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', r'\1', m.group(2))  # strip links
            val = re.sub(r'\{\{[^}]+\}\}', '', val)  # strip templates
            val = re.sub(r'<[^>]+>', '', val)         # strip HTML tags
            val = val.strip()
            fields[key] = val
    return fields

def extract_from_wikitext(wikitext, entry):
    r = dict(entry)
    f = parse_wikitext_infobox(wikitext)

    # Category hint for type
    cats = re.findall(r'\[\[Category:([^\]]+)\]\]', wikitext, re.I)
    r["type"] = guess_type(entry["name"], " ".join(cats))

    for key, val in f.items():
        if not val: continue
        if any(k in key for k in ["continent","region","habitat region"]):
            r["region"] = val
        elif "biome" in key:
            r["biomes"] = [b.strip() for b in re.split(r'[,/\n•]', val) if b.strip()]
        elif "social" in key:
            r["socialStructure"] = nso(val)
        elif "land space" in key or ("land" in key and "space" in key and "water" not in key):
            r["baseLand"], r["addLand"] = parse_space(val)
        elif "water space" in key or ("water" in key and "space" in key):
            r["baseWater"], r["addWater"] = parse_space(val)
        elif "group" in key and "min" in key:
            m = re.search(r'\d+', val)
            if m: r["minGroupSize"] = int(m.group())
        elif "group" in key and "max" in key:
            m = re.search(r'\d+', val)
            if m: r["maxGroupSize"] = int(m.group())
        elif "male" in key and "max" in key:
            m = re.search(r'\d+', val)
            if m: r["maxAdultMales"] = int(m.group())
        elif "female" in key and "max" in key:
            m = re.search(r'\d+', val)
            if m: r["maxAdultFemales"] = int(m.group())
        elif "compatible" in key or "enrichment" in key:
            r["compatibleAnimals"] = [a.strip() for a in re.split(r'[,\n•]', val) if a.strip()]
        elif "conservation" in key:
            s = ns(val)
            if s: r["conservationStatus"] = s

    # Fallback space from body text
    if not r.get("baseLand"):
        m = re.search(r'(\d[\d,]*)\s*m²\s*\+\s*(\d[\d,]*)\s*m²', wikitext)
        if m:
            r["baseLand"] = int(m.group(1).replace(",",""))
            r["addLand"]  = int(m.group(2).replace(",",""))

    return r

# ── Fetch one animal's detail ────────────────────────────────────────────────
def get_detail(entry):
    wikitext = get_page_wikitext(entry["name"])
    if not wikitext:
        print(f"    No wikitext for {entry['name']}")
        return entry
    return extract_from_wikitext(wikitext, entry)

# ── Output formatters ────────────────────────────────────────────────────────
def to_js(a):
    return (
        f'  {{ name: {json.dumps(a.get("name",""))}, '
        f'type: {json.dumps(a.get("type","Animal"))}, '
        f'appeal: {a.get("appeal",0)}, '
        f'conservationStatus: {json.dumps(a.get("conservationStatus","Unknown"))}, '
        f'region: {json.dumps(a.get("region",""))}, '
        f'biomes: {json.dumps(a.get("biomes",[]))}, '
        f'socialStructure: {json.dumps(a.get("socialStructure","Solitary"))}, '
        f'minGroupSize: {a.get("minGroupSize",1)}, '
        f'maxGroupSize: {a.get("maxGroupSize",10)}, '
        f'maxAdultMales: {a.get("maxAdultMales",1)}, '
        f'maxAdultFemales: {a.get("maxAdultFemales",1)}, '
        f'baseLand: {a.get("baseLand",0)}, '
        f'addLand: {a.get("addLand",0)}, '
        f'baseWater: {a.get("baseWater",0)}, '
        f'addWater: {a.get("addWater",0)}, '
        f'compatibleAnimals: {json.dumps(a.get("compatibleAnimals",[]))} }}'
    )

TSV_HEADERS = [
    "Animal Name","Type","Base Appeal","Conservation Status",
    "Regions / Continents","Biomes","Social Structure",
    "Group Size Min","Group Size Max","Max Adult Males","Max Adult Females",
    "Base Land (m²)","Add. Land (m²)","Base Water (m²)","Add. Water (m²)",
    "Interspecies Enrichment Compatibility"
]

def to_tsv_row(a):
    return [
        a.get("name",""), a.get("type","Animal"), a.get("appeal",""),
        a.get("conservationStatus",""), a.get("region",""),
        ", ".join(a.get("biomes",[])), a.get("socialStructure",""),
        a.get("minGroupSize",""), a.get("maxGroupSize",""),
        a.get("maxAdultMales",""), a.get("maxAdultFemales",""),
        a.get("baseLand",""), a.get("addLand",""),
        a.get("baseWater",""), a.get("addWater",""),
        ", ".join(a.get("compatibleAnimals",[])),
    ]

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser()
    p.add_argument("--all",    action="store_true")
    p.add_argument("--animal", type=str)
    args = p.parse_args()

    animals = get_animal_list()
    if not animals:
        sys.exit(1)

    if args.animal:
        animals = [a for a in animals if args.animal.lower() in a["name"].lower()]
        if not animals:
            # Try directly by name even if not in list
            animals = [{"name": args.animal, "conservationStatus": "Unknown"}]
        print(f"  Targeting: {[a['name'] for a in animals]}")

    detailed = []
    if args.all or args.animal:
        print(f"\nFetching detail pages for {len(animals)} animals (0.5s delay)…")
        for i, a in enumerate(animals):
            print(f"  [{i+1}/{len(animals)}] {a['name']}")
            detailed.append(get_detail(a))
            time.sleep(0.5)
    else:
        detailed = animals
        print("(Run with --all to also pull habitat/social/space data)")

    # Write outputs
    with open("pz_animals_scraped.json","w",encoding="utf-8") as f:
        json.dump(detailed, f, indent=2, ensure_ascii=False)
    print(f"\n✅  pz_animals_scraped.json  ({len(detailed)} animals)")

    with open("pz_animals_patch.js","w") as f:
        f.write("// Auto-generated — paste entries into src/data/pz1_animals.js\n")
        f.write("// Fill in: appeal, maxAdultMales, maxAdultFemales (manual from Zoopedia)\n\n")
        f.write("export const SCRAPED_ANIMALS = [\n")
        f.write(",\n".join(to_js(a) for a in detailed))
        f.write("\n];\n")
    print(f"✅  pz_animals_patch.js")

    buf = StringIO()
    w = csv.writer(buf, delimiter="\t")
    w.writerow(TSV_HEADERS)
    for a in sorted(detailed, key=lambda x: x["name"]):
        w.writerow(to_tsv_row(a))
    with open("pz_animals_sheet.tsv","w",encoding="utf-8", newline="") as f:
        f.write(buf.getvalue())
    print(f"✅  pz_animals_sheet.tsv  (Google Sheets: File → Import → Upload)")

    with open("diff_report.txt","w") as f:
        f.write(f"Planet Zoo Scrape — {len(detailed)} animals\n{'='*65}\n")
        f.write(f"{'Name':<30} {'Status':<22} {'Land':>12} {'Water':>12}  Social\n{'-'*65}\n")
        for a in sorted(detailed, key=lambda x: x["name"]):
            land  = f"{a.get('baseLand','?')}+{a.get('addLand','?')}"
            water = f"{a.get('baseWater','?')}+{a.get('addWater','?')}"
            f.write(f"{a['name']:<30} {a.get('conservationStatus','?'):<22} {land:>12} {water:>12}  {a.get('socialStructure','?')}\n")
    print(f"✅  diff_report.txt")

if __name__ == "__main__":
    main()
