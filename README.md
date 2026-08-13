# ArtisanHub — International Multi-Vendor Artisan Marketplace

Multi-language, multi-currency Shopify marketplace — Next.js storefront, Remix embedded admin app, Shopify Functions and Flow, in a TypeScript monorepo.

---

## Shopify Tools Coverage

| Tool | How It's Used |
|---|---|
| **Shopify CLI** | Scaffold, local dev tunnel, deploy app + all extensions |
| **Storefront API (GraphQL)** | All storefront data — products, collections, cart, metaobjects, search |
| **Admin API (GraphQL)** | Vendor product CRUD, order management, metaobject profiles |
| **Shopify App (Remix)** | Embedded vendor dashboard inside Shopify Admin |
| **Shopify Functions** | 4 functions: delivery rules, bundle discounts, cart transform, payment filtering |
| **Shopify Flow** | 3 workflows: order alerts, low stock detection, VIP customer tagging |
| **Shopify Markets** | 3 markets (AU/EG/FR) with language, currency, and RTL support |
| **Metaobjects** | Custom `vendor_profile` data type with 7 fields |
| **Webhooks** | Real-time `orders/create` and `products/update` handling |
| **@shopify/hydrogen-react** | Cart state, money formatting, locale/currency primitives |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│        Next.js 14 Storefront (Vercel)             │
│   @shopify/hydrogen-react · Tailwind CSS          │
│   • /en  /ar (RTL)  /fr — 3 markets              │
│   • AUD · USD · EUR currency switching            │
└───────────────────┬──────────────────────────────┘
                    │ Storefront GraphQL API
┌───────────────────▼──────────────────────────────┐
│              Shopify Store (Dev)                  │
│   • Metaobjects · Markets · Functions · Flow      │
└───────────────────┬──────────────────────────────┘
                    │ Admin GraphQL API + Webhooks
┌───────────────────▼──────────────────────────────┐
│      Vendor App — Remix + Polaris (Railway)       │
│   • Embedded in Shopify Admin                     │
│   • OAuth · Prisma · Session storage             │
└──────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Storefront | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Shopify React | @shopify/hydrogen-react |
| Vendor App | Remix (React Router v7), Shopify App Remix |
| App UI | Shopify Polaris |
| Database | Prisma + SQLite (dev) → PostgreSQL (prod) |
| Functions | TypeScript → Wasm (Shopify Function runner) |
| Hosting | Vercel (storefront) · Railway (vendor app) |
| Tooling | Shopify CLI 3.x · npm workspaces monorepo |

---

## Features

### Storefront (Next.js)
- Multi-language routing: `/en`, `/ar` (RTL), `/fr`
- Multi-currency: AUD, USD, EUR via Shopify Markets
- Product listing with collection filters
- Product detail with variant selection and Add to Cart
- Vendor profile pages driven by Metaobjects
- Predictive search
- Slide-over cart drawer with real-time Shopify cart sync
- Full SEO metadata per page and locale

### Vendor Dashboard (Remix, embedded in Shopify Admin)
- OAuth authentication via Shopify App Remix
- Vendor profile management (stored as Shopify Metaobjects)
- Product create / edit / delete via Admin GraphQL API
- Order view filtered by vendor tag
- Real-time webhooks for order and product events
- Analytics dashboard (total orders, revenue)

### Shopify Functions
- **Delivery Customization** — hides Standard Shipping for `fragile`-tagged products
- **Bundle Discount** — 10% off when buying 3+ items from the same vendor
- **Cart Transform** — caps quantity at 10 per vendor
- **Payment Customization** — hides Cash on Delivery for non-AU addresses

### Shopify Flow Workflows
- **New Order Alert** — tags order with vendor name, emails vendor
- **Low Stock Alert** — tags product `low-stock` when inventory ≤ 5
- **VIP Customer** — tags customer `vip` and issues 15% discount on 5th order

---

## Repository Structure

```
artisanhub/
├── apps/
│   ├── storefront/        # Next.js 14 — Vercel
│   └── vendor-app/        # Remix — Railway
├── extensions/
│   ├── delivery-customization/
│   ├── discount-bundle/
│   ├── cart-transform/
│   └── payment-customization/
├── scripts/
│   ├── setup-metaobjects.ts
│   └── seed.ts
└── shopify.app.toml
```

---

## Local Setup

### Prerequisites
- Node.js 20+
- Shopify CLI (`npm install -g @shopify/cli@latest`)
- A Shopify Partner account + dev store

### 1. Clone and install
```bash
git clone https://github.com/KamelMoohamed/artisanhub.git
cd artisanhub
npm install
```

### 2. Start the vendor app
```bash
shopify app dev
# Follow prompts to connect to your dev store
```

### 3. Set up storefront env vars
```bash
cd apps/storefront
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN
```

### 4. Start the storefront
```bash
npm run dev:storefront
# Opens at http://localhost:3000/en
```

### 5. Seed data (optional)
```bash
npx ts-node scripts/seed.ts
```

---

## Deployment

| Service | Platform | Config |
|---|---|---|
| Storefront | Vercel | Root dir: `apps/storefront` |
| Vendor App | Railway | Root dir: `apps/vendor-app` + PostgreSQL plugin |
| Functions | Shopify | `shopify app deploy` from monorepo root |
