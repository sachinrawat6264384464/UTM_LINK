# Custom UTM Tracking & Analytics System

A custom, lightweight, first-party UTM tracking and analytics platform built from scratch with **Next.js App Router**, **TypeScript**, and **Tailwind CSS**.

> **Zero Third-Party Dependency:** Completely independent of Google Analytics, Google Tag Manager, Mixpanel, or PostHog. Operates strictly with first-party anonymous tokens and relational data persistence.

---

## 🚀 Key Features

1. **Custom Client Tracking Engine (`src/lib/tracking/tracker.ts`)**:
   - Parses all standard campaign dimensions: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term`.
   - Automatic referrer categorization (e.g. Google organic search, LinkedIn, Instagram, WhatsApp, Facebook).
   - Generates and reuses first-party anonymous tokens (`vid_...`) and session tokens (`sid_...`).
   - 30-minute inactivity session expiration window.
   - Dual-touch attribution model: preserves **First-Touch** origin while actively updating **Last Non-Direct Touch**.
   - Idempotent deduplication: rejects duplicate event IDs and duplicate `session_start` dispatches.

2. **Public Demo Website (`/tracking-demo`)**:
   - Live **Telemetry & Campaign Attribution HUD** showing the visitor's detected UTM dimensions, session ID, and attribution model in real time.
   - Interactive product showcase with `view_item`, `add_to_cart`, and simulated `purchase` conversion buttons.
   - Live Session Telemetry Stream displaying events as they occur.
   - One-click campaign quick-switch buttons (LinkedIn, Instagram, WhatsApp, Direct).

3. **Admin Analytics Dashboard (`/admin/analytics`)**:
   - **Overview KPI Cards**: Total Visitors, Total Sessions, Page Views, Unique Visitors, Add-To-Cart Events, Purchases, Attributed Revenue, and Conversion Rate (%).
   - **Interactive Visualizations**:
     - Visitors & Sessions over time (Timeline chart)
     - Traffic Sources Distribution (Donut breakdown)
     - Conversions & Revenue by Source (Multi-channel attribution)
     - Campaign Performance Comparison
   - **Multi-Dimensional Attribution Table**: Source, Medium, Campaign, Visitors, Sessions, Page Views, Purchases, Revenue, and Conversion Rate.
   - **Live Ingestion Feed & Event Inspector**: Detailed JSON telemetry view for every event.
   - **UTM Campaign Link Builder**: With quick presets for LinkedIn, Instagram, WhatsApp, Facebook, Email, Google Organic, and Direct Visit.
   - **Interactive Testing Guide**: Step-by-step instructions explaining Source, Medium, Campaign, Referrer, and Attribution mechanics.

4. **Secure Server-Side API Handlers**:
   - `POST /api/analytics/events`: Validates payloads, handles rate limiting, and guarantees idempotency.
   - `POST /api/analytics/demo-purchase`: Server-side price calculation using predefined products to prevent client tampering.
   - `GET /api/analytics/overview`: Aggregated KPI calculations.
   - `GET /api/analytics/sources`: Multi-channel attribution reports.
   - `GET /api/analytics/campaigns`: Campaign performance metrics.
   - `GET /api/analytics/recent-events`: Filtered, paginated event feed.
   - `POST /api/analytics/seed`: Seeds realistic sample data for instant demonstration.
   - `POST /api/analytics/reset`: Clears test tracking records.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **UI & Icons**: Tailwind CSS v4, Lucide React
- **Visualizations**: Crisp interactive responsive SVG charts
- **Database Layer**:
  - Relational Schema with foreign keys, indexes, and unique constraints (`prisma/schema.prisma`).
  - Out-of-the-box zero-setup persistent storage (`data/analytics_store.json`) with full PostgreSQL/Neon migration compatibility.

---

## 🏁 Getting Started

### 1. Install & Setup
```bash
# Clone or navigate to the directory
cd UTM_LINK

# Install dependencies (already prepared)
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Demo Landing Page**: [http://localhost:3000/tracking-demo](http://localhost:3000/tracking-demo)
- **Admin Analytics Dashboard**: [http://localhost:3000/admin/analytics](http://localhost:3000/admin/analytics)

---

## 🧪 Running Automated Tests

Run the standalone verification test suite:
```bash
npm test
```

Verifies:
- UTM Parameter Extraction (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`)
- Multi-Channel Attribution (LinkedIn, Instagram, WhatsApp, Google Organic, Direct)
- ID Generation & Uniqueness (`vid_`, `sid_`, `evt_`)
- Deduplication & Idempotency (Event ID collision rejection, session_start deduplication)
- Server-side Verified Pricing & Conversion Math

---

## 💼 Step-by-Step Scenario: Testing LinkedIn Campaign Attribution

1. Open **[http://localhost:3000/admin/analytics](http://localhost:3000/admin/analytics)**.
2. In the **UTM Campaign Link Builder**, click the **LinkedIn** preset button:
   ```
   http://localhost:3000/tracking-demo?utm_source=linkedin&utm_medium=social&utm_campaign=portfolio_launch&utm_content=hero_cta
   ```
3. Click **Open in New Tab**.
4. On the demo page, observe the **Live Detected Visitor & Campaign State**:
   - `Source`: `linkedin`
   - `Medium`: `social`
   - `Campaign`: `portfolio_launch`
5. Click **"Test Conversion ($199.00)"** on the Growth Attribution Suite card.
6. A simulated order `ord_sim_...` will be generated and attributed to `portfolio_launch`.
7. Switch back to `/admin/analytics` and click **Refresh**:
   - Total Sessions increments.
   - Total Purchases increments.
   - $199.00 is attributed to LinkedIn in the Traffic Source report and charts.

---

## 🛡️ Privacy & Compliance

- **No Third-Party Cookies:** Only first-party cookies/localStorage are used for session attribution.
- **No Personal Information (PII):** Full IP addresses, email addresses, payment credentials, or device fingerprints are never collected or stored.
- **Idempotency:** Unique event IDs prevent duplicate counts during network retries or page reloads.
- **Simulated Conversions:** Test orders are clearly labeled `simulated_success` with server-calculated amounts.
