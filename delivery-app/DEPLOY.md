# 🚀 Vuka Deliver — Deployment Guide

## Step 1: Supabase setup (15 minutes)

1. Go to https://supabase.com → New project
   - Name: `vuka-deliver`
   - Region: pick the closest to you (Europe West is fine for Rwanda)
   - Password: save this somewhere safe

2. In the SQL Editor, run these files in order:
   - `supabase/migrations/001_initial.sql`
   - `supabase/seed_real_restaurants.sql`

3. Enable Realtime (for live order tracking):
   - Go to Database → Replication
   - Enable publication for: `orders`, `rider_profiles`, `order_status_history`

4. Get your keys:
   - Settings → API
   - Copy: Project URL, anon public key, service_role key

---

## Step 2: Local setup (5 minutes)

```bash
# Install dependencies
npm install

# Also install PWA support
npm install next-pwa

# Copy env file
cp .env.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

The app will work with just Supabase keys. Add payment and SMS keys later.

```bash
npm run dev
```

Open:
- Customer app: http://localhost:3000
- Merchant:      http://localhost:3000/merchant
- Admin:         http://localhost:3000/admin

---

## Step 3: Deploy to Vercel (5 minutes)

```bash
npm install -g vercel
vercel --prod
```

During setup:
- Framework: Next.js
- Root directory: ./
- Build command: `npm run build`

Then add env vars in Vercel dashboard → Settings → Environment Variables.

Your app will be live at: `https://vuka-deliver.vercel.app`

---

## Step 4: Create accounts

### Create your first admin account
1. Go to your live app → /signup
2. Sign up with your phone number
3. In Supabase → Table Editor → profiles
4. Find your row, change `role` from `customer` to `admin`
5. Now you can access /admin

### Add a merchant
1. The merchant signs up at /signup
2. You go to Supabase → profiles → change their role to `merchant`
3. Insert a row in `merchants` with `owner_id` = their user UUID
4. Or run: `UPDATE merchants SET owner_id = 'their-uuid' WHERE slug = 'restaurant-slug'`

### Add riders
Same process — sign up → change role to `rider` → insert row in `rider_profiles`

---

## Step 5: Payments (when ready)

### MTN Mobile Money
1. Register at https://momodeveloper.mtn.com
2. Subscribe to Collections API
3. Get your Subscription Key
4. Create API User + API Key in the sandbox
5. Add to .env.local:
   ```
   MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
   MTN_MOMO_SUBSCRIPTION_KEY=xxx
   MTN_MOMO_API_USER=xxx
   MTN_MOMO_API_KEY=xxx
   MTN_MOMO_TARGET_ENV=sandbox
   ```
6. Webhook URL (set in MTN portal):
   `https://your-domain.vercel.app/api/payments/mtn/webhook`
7. When ready for production, change `MTN_MOMO_TARGET_ENV=production`

### Airtel Money Rwanda
1. Register at https://developers.airtel.africa
2. Get Client ID + Client Secret
3. Add to .env.local:
   ```
   AIRTEL_BASE_URL=https://openapiuat.airtel.africa
   AIRTEL_CLIENT_ID=xxx
   AIRTEL_CLIENT_SECRET=xxx
   AIRTEL_ENV=staging
   ```
4. Webhook URL: `https://your-domain.vercel.app/api/payments/airtel/webhook`

---

## Step 6: SMS notifications (when ready)

1. Register at https://africastalking.com
2. Create app, get API key
3. Add to .env.local:
   ```
   AT_API_KEY=xxx
   AT_USERNAME=your-username
   AT_SENDER_ID=VukaDeliv
   ```

---

## File structure summary

```
app/
  (customer)/page.tsx        — restaurant listing (home)
  restaurant/[slug]/         — menu + add to cart
  cart/page.tsx              — cart management
  checkout/page.tsx          — address + payment
  order/[id]/page.tsx        — live order tracking
  merchant/page.tsx          — merchant dashboard
  admin/page.tsx             — admin ops panel
  login/page.tsx             — sign in
  signup/page.tsx            — create account
  api/
    orders/route.ts           — create order, trigger payment
    orders/[id]/status/       — advance order status
    payments/mtn/webhook/     — MTN payment confirmation
    payments/airtel/webhook/  — Airtel payment confirmation

lib/
  supabase/client.ts         — browser Supabase client
  supabase/server.ts         — server Supabase client
  supabase/types.ts          — TypeScript types
  payments/mtn-momo.ts       — MTN MoMo integration
  payments/airtel-money.ts   — Airtel Money integration
  notifications/africas-talking.ts — SMS notifications
  cities.ts                  — city config

supabase/
  migrations/001_initial.sql — full database schema
  seed_real_restaurants.sql  — 18 real Kigali restaurants
```

---

## Total estimated time to live app: 25-30 minutes
(Supabase: 15min + Local setup: 5min + Vercel deploy: 5min)

Payments and SMS can be wired in later without any schema changes.
