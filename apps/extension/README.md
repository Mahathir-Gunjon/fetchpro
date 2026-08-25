# LeadFlow - Google Maps B2B Lead Scraper (Chrome Extension)

A Manifest V3 Chrome Extension that scrapes B2B business leads directly from Google Maps search results and syncs them to your LeadFlow SaaS Dashboard.

## Features
- **Smart DOM Extraction**: Extracts Business Name, Rating, Review Count, Operational Status (Open/Closed), Phone Number, Google Maps URL, and Website Link.
- **Auto-Scrolling**: Automatically scrolls Google Maps search feed with safe DOM yielding and duplicate prevention.
- **Real-Time Live HUD**: Injects a non-intrusive status banner directly on the active Google Maps tab.
- **1-Click Sync**: Direct batch POST to `/api/leads/sync` on your Next.js dashboard backend.
- **Direct Export**: Allows direct CSV export right from the extension popup.

## How to Install in Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Turn **ON** the **Developer mode** toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left.
4. Select this directory:
   `/Users/mahathir/.gemini/antigravity-ide/scratch/leadgen-audit-saas/apps/extension`
5. The extension **LeadFlow - Google Maps B2B Lead Scraper** is now installed and ready!

## How to Use
1. Go to [Google Maps](https://www.google.com/maps).
2. Search for any business type & location (e.g. `Plumbers in Miami`, `Roofers in Dallas`, `Dentists in Austin`).
3. Click the **LeadFlow** extension icon in your Chrome toolbar.
4. Select your lead target count (e.g. `30 Leads`) and click **Start Scraping**.
5. Watch the real-time extraction counter.
6. Once finished, click **Sync Leads to Dashboard** to push the data into your LeadFlow web dashboard.
