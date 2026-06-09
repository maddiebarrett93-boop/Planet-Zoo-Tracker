# Planet Zoo Data Scraper

Pulls animal habitat/social/space data from the PZ Fandom wiki.

## Setup
```bash
pip install requests beautifulsoup4 lxml
```

## Usage
```bash
# Quick run — just the animal list (no detail pages)
python scrape_pz_wiki.py

# Full run — scrapes every animal's detail page (~2 min)
python scrape_pz_wiki.py --all

# Test a single animal
python scrape_pz_wiki.py --animal "Lion"
```

## Output
- `pz1_animals_scraped.json` — Full dataset
- `pz1_animals_patch.js` — Copy new entries into `src/data/pz1_animals.js`  
- `diff_report.txt` — Human-readable summary

## After Scraping
1. Open `pz1_animals_patch.js`
2. Copy any new animal entries into `src/data/pz1_animals.js`
3. Verify `baseSpace` and `perAdditionalSpace` values match the Zoopedia
4. Run `npm run build` in the app root

## Notes
- Steam guides (the appeal list link) don't scrape cleanly due to Steam's CDN.
  Use the appeal values in the Steam guide manually to fill in the `appeal` field
  per animal in pz1_animals.js.
- The scraper is polite (0.5s delay between requests). Don't hammer the wiki.
