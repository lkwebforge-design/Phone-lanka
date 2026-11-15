# Phone Lanka

A mobile-first Sri Lankan phone marketplace frontend.

## Current preview

This first version is a static HTML/CSS/JavaScript frontend with:
- Responsive marketplace homepage
- Brand, condition, province, district, DS division, GN division, town/area and price sorting filters
- Cascading location browser: Province → District → Divisional Secretariat → GN Division → town/local area
- Lazy-loaded GN directory files, split by province
- Sample phone listings and seller shops (clearly labelled as illustrative)
- Saved listings using browser local storage
- Product detail and seller onboarding previews
- All 9 provinces and 25 districts

## Sri Lanka location data

- `data/sri-lanka-locations.json`: province, district and DS division directory.
- `data/gn-divisions/`: nine province files containing GN division codes, English/Sinhala names where supplied, parent DS division, district, province and postal codes.
- GN source: [Open Admin Data — Sri Lanka Administrative Divisions](https://github.com/open-admin-data/sri-lanka-administrative-divisions), licensed CC BY 4.0. Attribution is also shown in the website location section.
- The source dataset lists 14,043 GN records. The Department of Census and Statistics' 2024 Census reports 14,008. This discrepancy is documented in the data files; the directory is a useful searchable reference, not a reconciled current official register.
- Town and neighbourhood aliases are a separate starter list and are not yet exhaustive.

## Run locally

Open `index.html` in a browser using a local static server so the JSON data files can be fetched. No build step is required.

## Publish with GitHub Pages

In the repository, open **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, then save. GitHub will provide the public Pages URL after deployment.

## Important

This is a frontend prototype only. Listings and shop examples are sample data. Seller accounts, real listings, image uploads, order management, messaging, moderation, payment processing and admin tools are not connected yet. Do not accept real orders or payments through this prototype.

## Next implementation phase

Connect a dedicated Supabase project for authentication, Postgres data, private image storage and row-level security. Add seller/customer roles, verified seller workflow, listing moderation, listing ownership, safe contact flows and admin tools. Keep this project independent from all other WebForge projects.
