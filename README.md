# Loi25Pilot — Quebec Law 25 Interactive PIA (ÉFVP) & Compliance Binder

100% client-side, bilingual (EN/FR) compliance workflow app for Canadian & Quebec SMBs.

## Architecture & Cost ($0.00 / month)
- **Frontend:** Pure static HTML/CSS/JS in `public/` (Cloudflare Pages or GitHub Pages free tier: $0/mo).
- **DOCX Engine:** Zero-dependency pure-JS OOXML `.docx` generator (`public/js/docx_exporter.js`).
- **License & Webhook Worker:** `worker/license_worker.js` on Cloudflare Workers + KV free tier ($0/mo up to 100k req/day).
- **Merchant of Record (MoR):** Creem (3.9% + $0.40/tx, $0/mo) or Polar.sh (5% + $0.50/tx, $0/mo) handles global & Canadian GST/HST/QST tax compliance.

## Deployment Checklist (Requires User Approval)
1. Deploy `public/` to Cloudflare Pages (`npx wrangler pages deploy public --project-name loi25pilot`).
2. Create KV namespace `LICENSES_KV`, update `wrangler.toml`, set `CREEM_WEBHOOK_SECRET` (or `POLAR_WEBHOOK_SECRET`), and deploy Worker (`npx wrangler deploy`).
3. Update `verifyEndpoint` in `public/js/app.js` to the deployed Worker URL and add checkout links to the Pricing cards.
