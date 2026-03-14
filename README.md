# Fireblocks

**Institutional Digital Asset Custody & Operations Platform**

Fireblocks gives institutions one operating system for custody, approvals, compliance, treasury controls, and secure digital asset execution. Built for enterprises that need policy-driven multi-signature vault management, real-time transaction workflows, and audit-ready compliance — all in a single console.

---

## Features

- **Multi-Signature Vaults** — Hot, warm, and cold storage with configurable signatory thresholds and multi-chain support (Ethereum, Bitcoin, Solana, Polygon, Arbitrum).
- **Transaction Lifecycle** — Initiate, route, approve, and settle digital asset transfers with full audit trails.
- **Approval Workflows** — Policy-based approval queues with role-gated authorization (admin, approver, analyst, viewer).
- **Compliance & AML** — Counterparty risk scoring, AML/KYC status tracking, and exportable compliance reports.
- **Analytics Dashboard** — Real-time metrics for assets under custody, transaction volume, approval latency, system uptime, and API success rates.
- **Billing & Subscriptions** — Stripe-integrated tiered plans (Starter, Growth, Enterprise) with metered usage tracking.
- **API Key & Webhook Management** — Self-service API key provisioning and configurable webhook endpoints.
- **Role-Based Access Control** — Granular user roles with invitation flow and account locking.
- **Batch Transactions** — Bulk transfer operations for institutional settlement workflows (Growth+).
- **HSM Key Inventory** — Hardware security module key tracking (Growth+).
- **Insurance Policies** — Digital asset insurance management (Enterprise).
- **Dark Theme UI** — Bloomberg Terminal–inspired design with cyan/emerald accents.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5.7 |
| UI Components | [Radix UI](https://radix-ui.com) + [shadcn/ui](https://ui.shadcn.com) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| State Management | [Zustand](https://zustand.docs.pmnd.rs) |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Authentication | Supabase Auth + `@supabase/ssr` |
| Payments | [Stripe](https://stripe.com) (Checkout, Portal, Webhooks) |
| Charts | [Recharts](https://recharts.org) |
| Tables | [TanStack Table](https://tanstack.com/table) |
| Forms | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Animations | [Framer Motion](https://motion.dev) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) |
| Testing | [Playwright](https://playwright.dev) |

---

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- A [Supabase](https://supabase.com) project (for database and auth)
- A [Stripe](https://stripe.com) account (for billing — optional for local dev)
- **FFmpeg** and **Python 3** with `edge-tts` (only for demo video generation)

---

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd fireblocks

# Install dependencies
npm install

# Copy environment config
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe credentials

# Bootstrap the database schema
# Run the contents of supabase/bootstrap.sql against your Supabase project

# Seed demo data (optional)
npm run seed:demo

# Start the dev server
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## Environment Variables

Create a `.env.local` file in the project root:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Application URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `APP_SECRET` | Yes | Application secret for signing |
| `WEBHOOK_SIGNING_SECRET` | Yes | Webhook payload signing key |
| `LOG_LEVEL` | No | Log level (`debug`, `info`, `warn`, `error`) |
| `STRIPE_SECRET_KEY` | Billing | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Billing | Stripe webhook signing secret |
| `STRIPE_PRICE_STARTER_MONTHLY` | Billing | Stripe Price ID for Starter monthly |
| `STRIPE_PRICE_STARTER_ANNUAL` | Billing | Stripe Price ID for Starter annual |
| `STRIPE_PRICE_GROWTH_MONTHLY` | Billing | Stripe Price ID for Growth monthly |
| `STRIPE_PRICE_GROWTH_ANNUAL` | Billing | Stripe Price ID for Growth annual |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | Billing | Stripe Price ID for Enterprise monthly |
| `STRIPE_PRICE_ENTERPRISE_ANNUAL` | Billing | Stripe Price ID for Enterprise annual |
| `DEMO_EMAIL` | Demo | Demo user email (default: `sagar.bhatt@bacancy.com`) |
| `DEMO_PASSWORD` | Demo | Demo user password (default: `FireblocksDemo#2026`) |

---

## Project Structure

```
fireblocks/
├── app/
│   ├── (auth)/                    # Login and signup pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/               # Protected dashboard pages
│   │   ├── analytics/
│   │   ├── approvals/
│   │   ├── compliance/
│   │   ├── dashboard/
│   │   ├── settings/
│   │   ├── transactions/
│   │   └── vaults/[id]/
│   ├── (marketing)/               # Public marketing pages
│   │   ├── about/
│   │   └── contact/
│   ├── api/
│   │   ├── contact/               # Contact form handler
│   │   └── v1/                    # Versioned REST API
│   ├── setup/                     # Onboarding wizard
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page
├── components/
│   ├── auth/                      # Auth forms, sign-out button
│   ├── dashboard/                 # Stats, charts, security panel
│   ├── layout/                    # Sidebar, topbar, mobile nav
│   ├── marketing/                 # Landing page, header, footer
│   ├── setup/                     # Onboarding wizard steps
│   ├── transactions/              # Transaction table and dialogs
│   ├── ui/                        # shadcn/ui primitives
│   └── vaults/                    # Vault cards, create sheet
├── data/                          # Static JSON seed data
├── demo/                          # Generated demo video output
├── hooks/                         # Custom React hooks
├── lib/
│   ├── api/                       # Server-side API helpers
│   ├── auth/                      # Session, profile, helpers
│   ├── billing/                   # Plan config, entitlements
│   ├── reports/                   # Report generation (PDF/CSV)
│   ├── schemas/                   # Zod validation schemas
│   ├── security/                  # HMAC signing, validation
│   └── supabase/                  # Client, server, admin, middleware
├── scripts/
│   ├── seed-demo-data.mjs         # Seed demo data into Supabase
│   ├── demo-workflow.mjs          # Playwright browser automation
│   └── generate-demo-video.mjs    # Full demo video pipeline
├── supabase/
│   └── bootstrap.sql              # Database schema (all tables, RLS)
├── types/                         # TypeScript type definitions
├── proxy.ts                       # Auth middleware
├── next.config.mjs
├── package.json
└── tsconfig.json
```

---

## API Endpoints

All API routes are under `/api/v1/` and require authentication unless noted.

### Core Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check (public) |
| GET | `/api/v1/me` | Current user session info |

### Vaults

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vaults` | List vaults (paginated) |
| POST | `/api/v1/vaults` | Create vault (admin) |
| GET | `/api/v1/vaults/:id` | Get vault details |
| PATCH | `/api/v1/vaults/:id` | Update vault (admin) |
| DELETE | `/api/v1/vaults/:id` | Archive vault (admin) |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/transactions` | List transactions (filterable, paginated) |
| POST | `/api/v1/transactions` | Initiate a transaction |
| GET | `/api/v1/transactions/:id` | Get transaction details |
| POST | `/api/v1/transactions/:id/approve` | Approve transaction (admin/approver) |
| POST | `/api/v1/transactions/:id/reject` | Reject transaction (admin/approver) |

### Approvals & Compliance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/approvals` | Pending approval queue |
| GET | `/api/v1/compliance` | List compliance records |
| POST | `/api/v1/compliance` | Create compliance record (admin) |
| PATCH | `/api/v1/compliance/:id` | Update compliance record (admin) |
| GET | `/api/v1/reports/compliance` | Export compliance report (PDF/CSV) |

### Organization & Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/organization` | Get organization profile |
| PATCH | `/api/v1/organization` | Update organization (admin) |
| GET | `/api/v1/users` | List organization members |
| POST | `/api/v1/users` | Invite user by email (admin) |
| DELETE | `/api/v1/users/:id` | Remove user (admin) |

### Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/plans` | List plan catalog |
| GET | `/api/v1/billing/subscription` | Current subscription and entitlements |
| GET | `/api/v1/billing/usage` | Usage summary |
| POST | `/api/v1/billing/checkout` | Create Stripe checkout session (admin) |
| POST | `/api/v1/billing/finalize` | Finalize checkout (admin) |
| POST | `/api/v1/billing/portal` | Create Stripe customer portal (admin) |
| POST | `/api/v1/billing/webhook` | Stripe webhook (public, signature-verified) |

### Analytics & Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/volume` | Transaction volume by asset |
| GET | `/api/v1/analytics/auc` | Assets under custody time series |
| GET | `/api/v1/analytics/activity` | Activity heatmap |
| GET | `/api/v1/audit` | Audit logs (admin/approver) |
| GET | `/api/v1/system-health` | System component health status |
| GET | `/api/v1/notifications` | Aggregated notifications |

### Developer Tools

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/keys` | List API keys (admin) |
| POST | `/api/v1/keys` | Create API key (admin) |
| DELETE | `/api/v1/keys/:id` | Revoke API key (admin) |
| GET | `/api/v1/webhooks` | List webhooks (admin) |
| POST | `/api/v1/webhooks` | Create webhook (admin) |
| DELETE | `/api/v1/webhooks/:id` | Delete webhook (admin) |
| POST | `/api/v1/webhooks/:id/test` | Test webhook delivery (admin) |

### Advanced (Growth / Enterprise)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/batches` | Batch transactions |
| GET/POST | `/api/v1/hsm-keys` | HSM key inventory |
| GET/POST | `/api/v1/reporting` | Report exports |
| GET | `/api/v1/portfolios` | Portfolio snapshots |
| GET/PUT | `/api/v1/risk-profiles` | Risk profile management |
| GET/POST | `/api/v1/insurance` | Insurance policies (Enterprise) |

---

## Billing Plans

| | Starter | Growth | Enterprise |
|---|---------|--------|------------|
| **Monthly** | $999 | $2,999 | $7,999 |
| **Annual** | $9,990 | $29,990 | $79,990 |
| **AUC Limit** | $25M | $150M | $750M |
| **Monthly Txns** | 250 | 2,500 | 15,000 |
| **API Rate** | 120/min | 400/min | 1,200/min |
| Multi-sig vaults | Yes | Yes | Yes |
| Approval workflows | Yes | Yes | Yes |
| Compliance & audit | Yes | Yes | Yes |
| Webhooks | — | Yes | Yes |
| Advanced analytics | — | Yes | Yes |
| Batch transactions | — | Yes | Yes |
| HSM inventory | — | Yes | Yes |
| White-label | — | — | Yes |
| Insurance | — | — | Yes |
| DeFi integrations | — | — | Yes |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Webpack mode) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed:demo` | Seed demo data into Supabase |
| `npm run demo:workflow` | Run Playwright demo automation |
| `npm run generate-demo-video` | Generate full demo video with narration |

---

## Database Setup

The database schema is defined in `supabase/bootstrap.sql`. Core tables include:

- `organizations` — Multi-tenant organization records
- `users` — Users with roles linked to Supabase Auth
- `vaults` / `vault_assets` — Vault storage with per-asset balances
- `transactions` / `approvals` — Transaction lifecycle with approval steps
- `approval_policies` — Configurable approval rules
- `compliance_records` — AML/KYC counterparty records
- `plan_catalog` / `subscriptions` / `billing_events` — Stripe billing integration
- `api_keys` / `webhooks` — Developer integration endpoints
- `system_health` / `analytics_kpi_snapshots` — Operational monitoring
- `audit_logs` — Full audit trail

To bootstrap a new database, run the contents of `supabase/bootstrap.sql` against your Supabase project's SQL editor.

---

## Authentication

Fireblocks uses **Supabase Auth** with email/password authentication and server-side session management via `@supabase/ssr`.

### Flow

1. User signs up or signs in at `/login` or `/signup`.
2. Supabase issues a session token stored in cookies.
3. Middleware (`proxy.ts`) validates the session on every request.
4. Protected routes (`/dashboard/*`, `/api/v1/*`, `/setup`) require an active session.
5. First-time users are routed to `/setup` for organization onboarding and plan selection.
6. Users without a completed subscription are held at `/setup` until checkout completes.

### Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access — manage vaults, users, billing, settings |
| `approver` | Approve/reject transactions, view compliance |
| `analyst` | Read-only access to analytics and reports |
| `viewer` | Read-only dashboard access |

---

## Demo Video Generation

An automated pipeline generates a product demo video with narration:

```bash
npm run generate-demo-video
```

This command:
1. Starts the dev server (if not running)
2. Pre-warms all page compilations
3. Seeds demo data via Supabase
4. Runs a Playwright browser automation that walks through the full product
5. Converts the recording from WebM to MP4
6. Generates narration audio using Microsoft Edge TTS
7. Merges video and audio into a final demo

**Output** is placed in the `demo/` directory:
- `raw-demo.mp4` — Screen recording without audio
- `narration.mp3` — TTS narration track
- `narration.txt` — Narration script
- `final-demo.mp4` — Final demo with narration overlay

**Environment overrides:**
- `SKIP_SERVER=1` — Skip starting the dev server
- `SKIP_SEED=1` — Skip re-seeding demo data
- `SKIP_TTS=1` — Skip regenerating narration audio
- `DEMO_BASE_URL` — Override the application URL

---

## Testing

Playwright is included as a dev dependency for browser automation and end-to-end testing.

```bash
# Install Playwright browsers
npx playwright install chromium

# Run the demo workflow (serves as a smoke test)
npm run demo:workflow
```

---

## Deployment

The application is built on Next.js and is optimized for deployment on [Vercel](https://vercel.com):

```bash
# Build for production
npm run build

# Start the production server
npm run start
```

Ensure all environment variables are configured in your deployment platform. The Stripe webhook endpoint (`/api/v1/billing/webhook`) must be publicly accessible and configured in your Stripe dashboard.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App Router                   │
├──────────┬──────────────┬───────────────┬───────────────┤
│  (auth)  │ (dashboard)  │  (marketing)  │    api/v1     │
│  Login   │  Dashboard   │  Landing      │  REST API     │
│  Signup  │  Vaults      │  About        │  40+ routes   │
│          │  Transactions│  Contact      │               │
│          │  Approvals   │               │               │
│          │  Compliance  │               │               │
│          │  Analytics   │               │               │
│          │  Settings    │               │               │
├──────────┴──────────────┴───────────────┴───────────────┤
│                    Middleware (proxy.ts)                  │
│           Session validation · Route protection          │
├─────────────────────────────────────────────────────────┤
│                    lib/ (Business Logic)                  │
│     Auth · Billing · Reports · Schemas · Security        │
├──────────────────────┬──────────────────────────────────┤
│   Supabase (Auth)    │       Supabase (PostgreSQL)       │
│   Email/Password     │  Organizations · Users · Vaults   │
│   Session cookies    │  Transactions · Compliance · Audit│
├──────────────────────┴──────────────────────────────────┤
│                      Stripe                              │
│        Checkout · Subscriptions · Customer Portal        │
└─────────────────────────────────────────────────────────┘
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run linting (`npm run lint`)
5. Commit with a descriptive message
6. Push to your fork and open a pull request

---

## License

This project is proprietary. All rights reserved.
