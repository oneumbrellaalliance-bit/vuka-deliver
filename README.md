# 🛵 Vuka Deliver — Full Stack Delivery Platform

Next.js + Supabase delivery platform. Three apps in one codebase:
- **Customer web app** (PWA installable on mobile)
- **Merchant dashboard**
- **Admin / ops panel**

---

## Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Database + Auth | Supabase (Postgres + Row Level Security) |
| Realtime | Supabase Realtime |
| Payments | MTN MoMo API + Airtel Money API |
| SMS/WhatsApp | Africa's Talking |
| Deployment | Vercel (free tier) |
| Maps | Google Maps JS SDK |

---

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── (customer)/         # Customer-facing pages
│   │   ├── page.tsx        # Home / restaurant list
│   │   ├── restaurant/[id]/page.tsx
│   │   ├── cart/page.tsx
│   │   └── order/[id]/page.tsx   # Live tracking
│   ├── merchant/           # Merchant dashboard (auth-gated)
│   │   ├── page.tsx        # Orders
│   │   └── menu/page.tsx
│   ├── admin/              # Admin ops panel (auth-gated)
│   │   ├── page.tsx
│   │   ├── merchants/page.tsx
│   │   └── riders/page.tsx
│   └── api/                # API routes
│       ├── orders/route.ts
│       ├── payments/mtn/route.ts
│       ├── payments/airtel/route.ts
│       └── notify/route.ts
├── components/             # Shared UI components
├── lib/                    # Supabase client, helpers
├── supabase/               # DB migrations + seed data
└── public/                 # PWA manifest, icons
```

---

## Quick Start

### 1. Clone and install
```bash
git clone <your-repo>
cd delivery-app
npm install
```

### 2. Set up Supabase
1. Go to https://supabase.com → New Project
2. Run the migration in `supabase/migrations/001_initial.sql`
3. Run seed data in `supabase/seed.sql`
4. Copy your project URL and anon key

### 3. Environment variables
```bash
cp .env.example .env.local
# Fill in all values (see .env.example)
```

### 4. Run locally
```bash
npm run dev
# Customer: http://localhost:3000
# Merchant: http://localhost:3000/merchant
# Admin:    http://localhost:3000/admin
```

### 5. Deploy to Vercel
```bash
npx vercel --prod
# Add env vars in Vercel dashboard
```

---

## User Roles (Supabase Auth)
| Role | Access |
|---|---|
| `customer` | Browse, order, track |
| `merchant` | Own restaurant orders + menu |
| `rider` | Assigned deliveries |
| `admin` | Everything |

Roles are stored in `profiles.role` and enforced via Row Level Security policies.

---

## Payment Flow

### MTN Mobile Money
1. Customer enters phone number at checkout
2. Server calls MTN MoMo `requestToPay` API
3. Customer approves on their phone
4. Webhook confirms payment → order confirmed

### Airtel Money
Same flow via Airtel Money API.

### Cash on Delivery
Order confirmed immediately, rider collects cash.

---

## Cities Supported
Configured in `lib/cities.ts`. Currently: Kigali, Rubavu, Musanze, Rusizi.
Add more by extending the cities config — no schema changes needed.
