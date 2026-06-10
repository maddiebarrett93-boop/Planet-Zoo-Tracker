# Google Sheets Sync Setup

## 1. Create a GCP Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create or select a project (e.g. `planet-zoo-tracker`)
3. **APIs & Services → Enable APIs → Google Sheets API** ✓
4. **IAM & Admin → Service Accounts → Create Service Account**
   - Name: `planet-zoo-writer`
   - Skip role assignment → Done
5. Click the new account → **Keys → Add Key → JSON** → download
6. Note the `client_email` and `private_key` from the JSON

## 2. Share your Google Sheet

Open your Planet Zoo sheet and share it with the service account email
(`planet-zoo-writer@your-project.iam.gserviceaccount.com`) as **Editor**.

Your Sheet ID: `1rhKqONXzIC5iyGye6Z4e1mSmhWpM31ZH-A2sqQxjEoE`

## 3. Add tabs to the Sheet

The API expects these tab names (create them if missing):
- `Animals`
- `Roster`
- `Conservation`
- `Habitats`
- `Bloodlines`
- `Peeps`
- `Zoos`

## 4. Set Vercel environment variables

In your Vercel project → Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `VITE_SHEET_ID` | `1rhKqONXzIC5iyGye6Z4e1mSmhWpM31ZH-A2sqQxjEoE` |
| `VITE_SHEETS_ENABLED` | `true` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | from your JSON key file |
| `GOOGLE_PRIVATE_KEY` | the full `private_key` value from the JSON (paste as-is including the `\n` characters) |

## 5. Deploy

```bash
git add -A
git commit -m "Add Sheets sync"
git push
```

Vercel will redeploy automatically. The sync indicator in the header
will show ✓ Synced when the connection is working.

## How it works

- On every tab switch, the app fetches fresh data for that tab from Sheets
- While fetching, it shows locally-cached data so the screen is never blank
- Every edit auto-saves to Sheets after a 1.5 second debounce
- Multiple zoo profiles each get their own `zoo_id` column — they share one Sheet but are fully isolated
- The `PZ1_Animals` tab in your Sheet is **read-only reference data** and is never written by the app
