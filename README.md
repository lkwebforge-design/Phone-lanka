# Phone Lanka

A mobile-first Sri Lankan phone marketplace frontend.

## Current preview
This first version is a static HTML/CSS/JavaScript frontend with:
- Responsive marketplace homepage
- Brand, condition, seller-district and price sorting filters
- Sample phone listings (clearly labelled as illustrative)
- Saved listings using browser local storage
- Product detail preview
- Seller onboarding preview
- All 25 Sri Lankan districts

## Run locally
Open `index.html` in a browser. No build step is required.

## Publish with GitHub Pages
In the repository, open **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, then save. GitHub will provide the public Pages URL after deployment.

## Important
This is a frontend prototype only. Listings are sample data. Seller accounts, real listings, image uploads, order management, messaging, moderation, payment processing and admin tools are not connected yet. Do not accept real orders or payments through this prototype.

## Next implementation phase
Connect a dedicated Supabase project for authentication, Postgres data, private image storage and row-level security. Add seller/customer roles, verified seller workflow, listing moderation, order records and safe contact/order flows. Keep this project independent from all other WebForge projects.
