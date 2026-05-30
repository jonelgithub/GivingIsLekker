# Giving is lekker
### Frictionless Micro-Giving via Investec Programmable Banking

> **Tweet-Length Description:** Giving is lekker turns daily Investec card swipes into automated, tax-efficient micro-donations to South African charities via card webhooks and OAuth2 OpenAPI transfers! 🇿🇦💳✨

**Giving is lekker** is a Next.js web application designed for South African private banking clients. It turns daily card swipes into automated, tax-efficient micro-donations. When a client swipes their Investec card, the platform intercepts the card swipe webhook, calculates a customized round-up difference (e.g. to the nearest R5, R10, or R20), and executes a direct transfer of that difference from their private transaction account to a selected, verified South African charity.

---

## Q2 2026 Bounty Submission: "API Side Hustle"
This project is aligned with the **Investec Developer Community Q2 2026 Bounty Challenge**.

### Commercial Viability & Monetisation Model
"Giving is lekker" operates on a multi-tier commercial model:
1. **Micro-Transaction Platform Fee (Default)**: The platform charges a **1.5% convenience fee** on each round-up donation transfer (min R0.01 per swipe). In a high-net-worth client group, this aggregates a high volume of small fees.
2. **SaaS Premium Tier ("Lekker Donor Premium")**: For **R19/month**, high-wealth clients can subscribe to the Premium Tier. This automatically compiles, matches, and issues aggregated **Section 18A tax deduction certificates** (saving clients up to 45% of their donations on South African income tax returns) and includes carbon-offset matching.
3. **Charity Premium Listing**: A 5% marketing listing fee is charged to charities for premium feed exposure and corporate CSR matching opportunities.

---

## Frontend-Backend Integration Workflow
```
[Card Swipe at Merchant] 
       │
       ▼
(Investec Webhook Router) ──► [Next.js Webhook Receiver (API POST)]
                                       │
                                       ▼ (Calculates Round-Up + Platform Fee)
                              [Fetch In-Memory OAuth2 Token] 
                                       │
                                       ▼ (Triggers OpenAPI Transfer Request)
                              [Investec OpenAPI Accounts/Transfer API] 
                                       │
                                       ▼ (Success Feedback Loop)
                              [Save Ledger & Update Dashboard UI]
```

1. **Transaction Interception**: The client swipes their card at a merchant. Investec fires an HTTP POST webhook to `/api/investec/webhook`.
2. **Calculation**: The Next.js API route evaluates the transaction amount and the user's active round-up increment:
   * *Example*: R42.50 swipe with an R5 round-up increment calculates a **R2.50 donation** and a **R0.04 (1.5%) platform convenience fee**.
3. **OAuth2 Handshake**: The backend checks for a cached OpenAPI OAuth2 access token. If expired or empty, it basic-authenticates with client credentials against `https://openapi.investec.com/identity/v2/oauth2/token`.
4. **Transfer Execution**: The backend fires a POST request to `/za/pb/v1/accounts/{fromAccountId}/transfer` to perform a real-time account transfer to the selected charity's account number.
5. **Ledger Registry**: The successful transfer is logged in the local JSON database (`db.json`) and instantly pushed to the client's live transaction ledger on the dashboard.

---

## Required Credentials & Configuration

To run this application in Live production mode, you must set up the following environment variables. If these credentials are not present, the application automatically defaults to **Simulated Sandbox Mode** with card swipe and transfer simulations.

Create a `.env.local` file in the root directory:

```env
# Investec Developer Credentials (from Developer Portal)
INVESTEC_CLIENT_ID="your_client_id_here"
INVESTEC_CLIENT_SECRET="your_client_secret_here"
INVESTEC_API_KEY="your_api_key_here"

# Webhook Authentication (Optional - to verify webhook signatures)
INVESTEC_WEBHOOK_SECRET="your_webhook_secret_here"

# Security Keys for Session Management
NEXTAUTH_SECRET="your_session_secret_key"
```

---

## Local Installation & Setup

### Prerequisites
* Node.js (v18.x or later)
* npm (v9.x or later)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Step 3: Production Build & Linting Checks
To verify production readiness:
```bash
# Run ESLint validation
npm run lint

# Build the Next.js production bundle
npm run build
```

---

## Demo

### 1. Zebra Luxe Authentication Portal
The login screen features an interactive dot-particle field, a strict black-and-white theme, and dual authentication methods.
* **Credentials Tab**: Standard sign in.
* **Phone Number Tab**: Displays a real-time cryptographic visualizer performing RSA-OAEP encryption as you type, showing private wealth clients how their contact details are protected at the browser boundary.

### 2. Client Wealth & Giving Dashboard
Once authenticated, the user is presented with the main control panel:
* **Active Configuration**: View linked accounts, round-up settings, and simulate live card swipes using the Zebra stripe Card Swipe Simulator button.
* **Private Wealth Impact & Tax Estimator**: Slide controls or input values to project monthly donations, SARS Section 18A tax rebates (up to 45%), and convenience fees.
* **Charity Registry**: Filter and select verified South African charities to link for micro-donations.

### 3. Step 0 Pre-Modal & Marketing Flow
When a user clicks on a charity, a sleek pre-modal emerges featuring:
* A luxury abstract zebra-themed marketing banner.
* A motivational prompt: *"Thank you for wanting to take the first step... It starts somewhere"*.
* High-contrast Zebra striped "Continue" button and outline "Cancel" button. Continuing takes the client directly into the interactive round-up increment settings.

---

## License
This project is open-source and licensed under the [MIT License](LICENSE).

---

## AI Usage & Disclaimer
In compliance with transparency guidelines, we acknowledge that Generative Artificial Intelligence (AI) was utilized in the development of this project:
- **Codebase & Architecture**: AI (Google DeepMind's Antigravity agent) was used to scaffold, draft, and refine code structures, including Next.js pages, API routes, security encryption utilities, and styling (TypeScript, React, SCSS).
- **Visuals & Media**: AI was used in the conceptual design, asset creation, and generation of the visual brand assets and user interface elements.
All AI-generated outputs were audited, refactored, and verified by human developers to meet security standards, ensure proper integration with the Investec OpenAPI, and align with the Investec programmable banking requirements.
