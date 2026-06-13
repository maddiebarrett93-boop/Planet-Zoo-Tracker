# Fixing the API 500 Errors

## Step 1: Check what's wrong
After deploying, visit: `https://planet-zoo-tracker.vercel.app/api/debug`

This will show you exactly which credential is missing or malformed.

## Step 2: Fix your Vercel environment variables

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

You need exactly these three variables:

### VITE_SHEET_ID
```
1rhKqONXzIC5iyGye6Z4e1mSmhWpM31ZH-A2sqQxjEoE
```

### GOOGLE_SERVICE_ACCOUNT_EMAIL
Your service account email from the JSON key file, e.g.:
```
planet-zoo-writer@your-project.iam.gserviceaccount.com
```

### GOOGLE_PRIVATE_KEY ← THIS IS THE TRICKY ONE

Open your downloaded JSON key file. Find the `"private_key"` field. It looks like:
```json
"private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIEo...\n-----END RSA PRIVATE KEY-----\n"
```

**In Vercel, paste the value exactly as it appears in the JSON** — including the `\n` characters literally, with the surrounding quotes stripped.

So paste this (no surrounding quotes):
```
-----BEGIN RSA PRIVATE KEY-----\nMIIEo...\n-----END RSA PRIVATE KEY-----\n
```

❌ WRONG — don't add quotes:
```
"-----BEGIN RSA PRIVATE KEY-----\nMIIEo..."
```

❌ WRONG — don't press Enter to create real newlines. Keep `\n` as literal backslash-n.

## Step 3: Redeploy
After saving env vars, go to Deployments → click the three dots on the latest → Redeploy.

## Step 4: Verify
Visit `/api/debug` again. You should see:
```json
"token_result": "✅ Token obtained successfully"
```
