#!/usr/bin/env python3
"""
Planet Zoo Animal Data Scraper
================================
Pulls animal data from the Planet Zoo Fandom wiki and merges with
existing pz1_animals.js to fill gaps and validate data.

Usage:
    pip install requests beautifulsoup4 lxml
    python scrape_pz_wiki.py [--all] [--animal "Lion"]

    --all        Scrape every animal's detail page (slow, ~2 min)
    --animal X   Scrape only one animal by name (for testing)

Output:
    pz1_animals_scraped.json  - Full scraped dataset
    pz1_animals_patch.js      - JS patch for new/missing animals
    diff_report.txt           - Summary of what was found
"""

import json, re, time, sys, argparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing deps. Run:  pip install requests beautifulsoup4 lxml")
    sys.exit(1)

BASE_WIKI = "https://planetzoo.fandom.com"
LIST_URL  = f"{BASE_WIKI}/wiki/List_of_Animals"
HEADERS   = {"User-Agent": "Mozilla/5.0 (compatible; PlanetZooDataBot/1.0; research)"}

STATUS_MAP = {
    "lc":"Least Concern","nt":"Near Threatened","vu":"Vulnerable",
    "en":"Endangered","cr":"Critically Endangered","ew":"Extinct in the Wild",
    "least concern":"Least Concern","near threatened":"Near Threatened",
    "vulnerable":"Vulnerable","endangered":"Endangered",
    "critically endangered":"Critically Endangered",
}
def norm_status(s): return STATUS_MAP.get(s.strip().lower(), s.strip().title())

SOCIAL_MAP = {
    "solitary":"Solitary","pair":"Pair Bond","pair bond":"Pair Bond",
    "gregarious":"Gregarious","matrilineal":"Matrilineal",
    "patrilineal":"Patrilineal","harem":"Matrilineal","herd":"Gregarious",
}
def norm_social(s): return SOCIAL_MAP.get(s.strip().lower(), s.strip().title())

def parse_space(text):
    """Parse '510 m² +180 m²/ea.' → (510, 180)"""
    if not text: return None, None
    text = text.replace(",","").replace("\u00a0"," ")
    m = re.search(r'(\d+)\s*m.*?\+\s*(\d+)', text, re.I)
    if m: return int(m.group(1)), int(m.group(2))
    m = re.search(r'(\d+)', text)
    if m: return int(m.group(1)), 0
    return None, None

def fetch(url, label=""):
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"  WARN fetch {label}: {e}")
        return None

def fetch_list():
    print(f"Fetching list: {LIST_URL}")
    html = fetch(LIST_URL, "animal list")
    if not html: return []
    soup = BeautifulSoup(html, "lxml")
    animals = []
    for table in soup.find_all("table", class_=re.compile("wikitable", re.I)):
        for row in table.find_all("tr")[1:]:
            cells = row.find_all(["td","th"])
            if not cells: continue
            link = cells[0].find("a", href=re.compile(r"/wiki/"))
            if not link: continue
            name = link.get_text(strip=True)
            href = link["href"]
            # Try to extract status from row
            status = "Unknown"
            for c in cells:
                img = c.find("img")
                if img:
                    alt = img.get("alt","")
                    s = norm_status(alt)
                    if s != alt: status = s; break
                txt = c.get_text(strip=True)
                s = norm_status(txt)
                if s != txt and s in STATUS_MAP.values(): status = s; break
            animals.append({"name": name, "href": href, "conservationStatus": status})
    print(f"  Found {len(animals)} entries")
    return animals

def fetch_detail(entry):
    url = BASE_WIKI + entry["href"]
    html = fetch(url, entry["name"])
    if not html: return entry
    soup = BeautifulSoup(html, "lxml")
    r = dict(entry)

    # ── Portable Infobox (modern Fandom) ──
    for section in soup.find_all(class_=re.compile("pi-item|pi-data", re.I)):
        label_el = section.find(class_=re.compile("pi-data-label", re.I))
        val_el   = section.find(class_=re.compile("pi-data-value", re.I))
        if not label_el or not val_el: continue
        label = label_el.get_text(strip=True).lower()
        val   = val_el.get_text(" ", strip=True)

        if "region" in label or "continent" in label:
            r["region"] = val.strip()
        elif "biome" in label:
            r["biomes"] = [b.strip() for b in re.split(r"[,/\n]", val) if b.strip()]
        elif "social" in label:
            r["socialStructure"] = norm_social(val)
        elif "land space" in label or "habitat space" in label:
            b, p = parse_space(val)
            if b: r["baseSpace"] = b; r["perAdditionalSpace"] = p or 0
        elif "water space" in label:
            b, _ = parse_space(val)
            if b: r["baseWaterSpace"] = b
        elif "group size" in label and "min" in label:
            m = re.search(r"\d+", val)
            if m: r["minGroupSize"] = int(m.group())
        elif "group size" in label and "max" in label:
            m = re.search(r"\d+", val)
            if m: r["maxGroupSize"] = int(m.group())
        elif "compatible" in label:
            r["compatibleAnimals"] = [a.strip() for a in re.split(r"[,\n]", val) if a.strip()]

    # ── Fallback: old-style wikitable infobox ──
    if "baseSpace" not in r:
        for table in soup.find_all("table", class_=re.compile("infobox|wikitable", re.I)):
            for row in table.find_all("tr"):
                cells = row.find_all(["th","td"])
                if len(cells) < 2: continue
                lbl = cells[0].get_text(strip=True).lower()
                val = cells[-1].get_text(" ", strip=True)
                if "land space" in lbl:
                    b, p = parse_space(val)
                    if b: r["baseSpace"] = b; r["perAdditionalSpace"] = p or 0
                elif "social" in lbl:
                    r["socialStructure"] = norm_social(val)

    # ── Body text fallback for space ──
    if "baseSpace" not in r:
        body = soup.get_text(" ")
        m = re.search(r"(\d[\d,]*)\s*m²\s*\+\s*(\d[\d,]*)\s*m²", body)
        if m:
            r["baseSpace"] = int(m.group(1).replace(",",""))
            r["perAdditionalSpace"] = int(m.group(2).replace(",",""))

    return r

def to_js_entry(a):
    def q(v): return json.dumps(v) if v else '""'
    return (
        f'  {{\n'
        f'    name: {json.dumps(a.get("name",""))},\n'
        f'    conservationStatus: {json.dumps(a.get("conservationStatus","Unknown"))},\n'
        f'    region: {json.dumps(a.get("region",""))},\n'
        f'    biomes: {json.dumps(a.get("biomes",[]))},\n'
        f'    socialStructure: {json.dumps(a.get("socialStructure","Solitary"))},\n'
        f'    baseSpace: {a.get("baseSpace", 0)},\n'
        f'    perAdditionalSpace: {a.get("perAdditionalSpace", 0)},\n'
        f'    minGroupSize: {a.get("minGroupSize", 1)},\n'
        f'    maxGroupSize: {a.get("maxGroupSize", 10)},\n'
        f'    compatibleAnimals: {json.dumps(a.get("compatibleAnimals",[]))},\n'
        f'    appeal: 0,\n'
        f'  }}'
    )

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true", help="Scrape all detail pages")
    parser.add_argument("--animal", type=str, help="Scrape a single animal by name")
    args = parser.parse_args()

    animals = fetch_list()
    if not animals:
        print("List fetch failed. The wiki may have changed structure.")
        sys.exit(1)

    if args.animal:
        animals = [a for a in animals if args.animal.lower() in a["name"].lower()]
        print(f"Filtered to: {[a['name'] for a in animals]}")

    if args.all or args.animal:
        print(f"\nFetching detail pages for {len(animals)} animals (0.5s delay each)...")
        detailed = []
        for i, a in enumerate(animals):
            print(f"  [{i+1}/{len(animals)}] {a['name']}")
            detailed.append(fetch_detail(a))
            time.sleep(0.5)
    else:
        detailed = animals
        print("\nSkipping detail pages (run with --all to fetch habitat/space data)")

    # Write JSON
    with open("pz1_animals_scraped.json","w",encoding="utf-8") as f:
        json.dump(detailed, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Wrote {len(detailed)} animals → pz1_animals_scraped.json")

    # Write JS
    js = "// Generated by scrape_pz_wiki.py — review before importing\n"
    js += "export const SCRAPED_ANIMALS = [\n"
    js += ",\n".join(to_js_entry(a) for a in detailed)
    js += "\n];\n"
    js += "export const SCRAPED_MAP = Object.fromEntries(SCRAPED_ANIMALS.map(a => [a.name, a]));\n"
    with open("pz1_animals_patch.js","w") as f:
        f.write(js)
    print(f"✅ Wrote JS patch → pz1_animals_patch.js")

    # Diff report
    with open("diff_report.txt","w") as f:
        f.write(f"Planet Zoo Scrape Report\n{'='*50}\n")
        f.write(f"Total: {len(detailed)}\n\n")
        f.write(f"{'Name':<35} {'Status':<25} {'Space':<20} {'Social'}\n")
        f.write(f"{'-'*90}\n")
        for a in sorted(detailed, key=lambda x: x['name']):
            sp = f"{a.get('baseSpace','?')}+{a.get('perAdditionalSpace','?')}/ea"
            f.write(f"{a['name']:<35} {a.get('conservationStatus','?'):<25} {sp:<20} {a.get('socialStructure','?')}\n")
    print(f"✅ Wrote diff_report.txt\n")
    print("Next: copy entries from pz1_animals_patch.js into src/data/pz1_animals.js")

if __name__ == "__main__":
    main()
