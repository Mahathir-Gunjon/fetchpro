# LeadFlow — B2B Lead Generation & Automated Website Audit SaaS

An end-to-end B2B Lead Generation and Automated Website Audit SaaS monorepo consisting of:
1. `apps/extension` — Manifest V3 Chrome Extension targeting Google Maps (`https://www.google.com/maps/*`) to scrape local business leads with auto-scrolling, deduplication, and 1-click sync.
2. `apps/web` — Next.js 15+ App Router SaaS platform with automated website auditing (SSL, mobile viewport, backdated copyright, tech stack, email scraping), Google Gemini AI cold pitch generator, Resend 1-click email outreach, and Supabase PostgreSQL backend.

---

## Monorepo Architecture

```
leadgen-audit-saas/
├── package.json                     # Monorepo root workspace configuration
├── README.md                        # Master documentation
├── apps/
│   ├── extension/                   # Manifest V3 Chrome Extension
│   │   ├── manifest.json            # MV3 configuration & permissions
│   │   ├── content.js               # Google Maps results scraper & DOM observer
│   │   ├── popup.html               # Glassmorphic Tailwind popup interface
│   │   ├── popup.js                 # Extraction loop, counters, API sync
│   │   ├── styles.css               # Popup styling & glowing animations
│   │   ├── icons/                   # Real PNG icons (16x16, 48x48, 128x128)
│   │   └── README.md                # Chrome installation guide
│   │
│   └── web/                         # Next.js 15 App Router SaaS Platform
│       ├── package.json             # Dependencies (@google/genai, resend, supabase, lucide-react)
│       ├── tsconfig.json            # TypeScript configuration
│       ├── tailwind.config.ts       # Tailwind CSS theme
│       ├── .env.example             # Environment variables template
│       ├── supabase/
│       │   └── schema.sql           # PostgreSQL schema (users, leads, RLS policies)
│       └── src/
│           ├── app/
│           │   ├── page.tsx         # Modern SaaS Landing Page
│           │   ├── dashboard/       # Lead pipeline & audit dashboard
│           │   └── api/leads/       # API endpoints (sync, audit, pitch, email, export)
│           ├── components/          # LeadsTable, AuditDetailsModal, PitchEditorModal, etc.
│           └── lib/                 # Audit Engine, Gemini AI, Resend client, Supabase store
```

---

## Quick Start Guide

### 1. Install Monorepo Dependencies
From the repository root (`leadgen-audit-saas/`):
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` inside `apps/web`:
```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local` with your credentials (all services have intelligent fallbacks if keys are not yet provided):
```env
# Supabase Configuration (Optional - falls back to in-memory store if unset)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Google Gemini AI (for Cold Pitch Generation)
# Get a free key at: https://aistudio.google.com/
GEMINI_API_KEY=AIzaSy...

# Resend Email Outreach (for 1-click email sending)
# Get an API key at: https://resend.com/
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="LeadFlow Outreach <onboarding@resend.dev>"
```

### 3. Run the Next.js Web Application
```bash
npm run dev:web
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Landing Page**: [http://localhost:3000/](http://localhost:3000/)
- **SaaS Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## Loading the Chrome Extension

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** to **ON** in the top-right corner.
3. Click the **Load unpacked** button in the top-left.
4. Select the directory:
   `apps/extension` (Absolute path: `/Users/mahathir/.gemini/antigravity-ide/scratch/leadgen-audit-saas/apps/extension`).
5. Go to [Google Maps](https://www.google.com/maps) and search for any business query (e.g. `Roofers in Miami`, `Dentists in Austin`, `Plumbers in Dallas`).
6. Click the **LeadFlow** extension icon in your Chrome toolbar.
7. Click **Start Scraping** to extract businesses.
8. Click **Sync Leads to Dashboard** to batch push them straight into your dashboard at `http://localhost:3000`!

---

## Key Features & Automated Systems

### 1. Automated Website Audit Engine (`apps/web/src/lib/audit.ts`)
- **SSL Certificate Verification**: Validates HTTPS security and certificates.
- **Mobile Viewport Detection**: Checks `<meta name="viewport">` responsiveness.
- **Backdated Copyright Scanner**: Analyzes footer dates (e.g. `© 2019`) to flag neglected sites.
- **Tech Stack Clues**: Detects WordPress, Shopify, Webflow, Squarespace, Wix, React, Next.js, and Google Analytics.
- **Regex Contact Email Scraper**: Scrapes emails from homepage, `/contact`, and `/about` pages.
- **Health Score (0-100)**: Calculates a color-coded visual rating.

### 2. Google Gemini AI Cold Pitch Generator (`apps/web/src/lib/gemini.ts`)
- Uses official `@google/genai` SDK (`gemini-2.0-flash`).
- Ingests business reputation and audit findings to write high-converting 3-4 sentence cold outreach emails with low-friction CTAs.

### 3. Resend 1-Click Outreach (`apps/web/src/lib/resend.ts`)
- Dispatches personalized HTML cold outreach emails via Resend.
- Supports sandbox test mode and automatic timestamp/status updates to `emailed`.

### 4. Dual-Mode Database Persistence (`apps/web/src/lib/supabase.ts`)
- Works seamlessly with Supabase PostgreSQL (migration in `apps/web/supabase/schema.sql`).
- Automatically falls back to an in-memory pre-seeded store with sample leads for instant zero-config testing.

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/leads` | List all leads and dashboard statistics |
| `POST` | `/api/leads` | Create a single lead |
| `DELETE` | `/api/leads?id={id}` | Delete a lead |
| `POST` | `/api/leads/sync` | Batch sync leads from Chrome Extension |
| `POST` | `/api/leads/audit` | Run automated website audit for a lead |
| `POST` | `/api/leads/generate-pitch` | Generate Gemini AI cold pitch |
| `POST` | `/api/leads/send-email` | Send outreach email via Resend |
| `POST` | `/api/leads/demo-seed` | Reset/reload sample leads |
| `GET` | `/api/leads/export` | Download leads as CSV |

---

## License
MIT
