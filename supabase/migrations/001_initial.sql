-- ============================================================
-- Vuka Deliver — Initial Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";  -- for geo queries (optional, remove if not using)

-- ─────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  phone text unique,
  role text not null default 'customer' check (role in ('customer','merchant','rider','admin')),
  city text default 'Kigali',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────
-- CITIES
-- ─────────────────────────────────────────
create table cities (
  id serial primary key,
  name text unique not null,
  country text default 'Rwanda',
  active boolean default true,
  delivery_fee_base int default 500,  -- RWF
  created_at timestamptz default now()
);

insert into cities (name, delivery_fee_base) values
  ('Kigali', 1000),
  ('Rubavu', 1000),
  ('Musanze', 1000),
  ('Rusizi', 1000),
  ('Huye', 1000),
  ('Nyagatare', 1000);

-- ─────────────────────────────────────────
-- MERCHANTS
-- ─────────────────────────────────────────
create table merchants (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  category text not null,
  city text not null references cities(name),
  address text,
  phone text,
  logo_url text,
  cover_url text,
  rating numeric(2,1) default 0,
  rating_count int default 0,
  delivery_fee int default 500,
  delivery_time_min int default 20,
  delivery_time_max int default 45,
  min_order int default 0,
  is_open boolean default false,
  is_active boolean default true,  -- admin can deactivate
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- CATEGORIES + MENU ITEMS
-- ─────────────────────────────────────────
create table menu_categories (
  id uuid default uuid_generate_v4() primary key,
  merchant_id uuid references merchants(id) on delete cascade,
  name text not null,
  sort_order int default 0
);

create table menu_items (
  id uuid default uuid_generate_v4() primary key,
  merchant_id uuid references merchants(id) on delete cascade,
  category_id uuid references menu_categories(id) on delete set null,
  name text not null,
  description text,
  price int not null,  -- RWF, in whole numbers
  image_url text,
  is_available boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────
create table orders (
  id uuid default uuid_generate_v4() primary key,
  order_number text unique not null,  -- e.g. ORD-2025-00142
  customer_id uuid references profiles(id) on delete set null,
  merchant_id uuid references merchants(id) on delete set null,
  rider_id uuid references profiles(id) on delete set null,

  -- Status lifecycle
  status text not null default 'pending'
    check (status in ('pending','confirmed','preparing','ready','in_transit','delivered','cancelled')),

  -- Amounts (all in RWF)
  subtotal int not null,
  delivery_fee int not null default 500,
  discount int default 0,
  total int not null,

  -- Delivery info
  delivery_address text not null,
  delivery_city text not null,
  delivery_lat numeric(10,7),
  delivery_lng numeric(10,7),
  customer_phone text not null,
  customer_name text not null,

  -- Payment
  payment_method text not null default 'cash'
    check (payment_method in ('mtn_momo','airtel_money','cash','card')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded')),
  payment_reference text,  -- MoMo transaction ID

  -- Metadata
  notes text,
  estimated_delivery_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items (snapshot of menu_items at time of order)
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  name text not null,       -- snapshot
  price int not null,       -- snapshot
  quantity int not null default 1,
  subtotal int not null,
  notes text
);

-- Auto-generate order number
create sequence order_number_seq start 1000;

create or replace function generate_order_number()
returns trigger language plpgsql as $$
begin
  new.order_number := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 5, '0');
  return new;
end;
$$;

create trigger set_order_number
  before insert on orders
  for each row execute function generate_order_number();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────
-- ORDER STATUS HISTORY (for tracking timeline)
-- ─────────────────────────────────────────
create table order_status_history (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Auto-log status changes
create or replace function log_order_status_change()
returns trigger language plpgsql as $$
begin
  if old.status is distinct from new.status then
    insert into order_status_history (order_id, status)
    values (new.id, new.status);
  end if;
  return new;
end;
$$;

create trigger track_order_status
  after update on orders
  for each row execute function log_order_status_change();

-- ─────────────────────────────────────────
-- RIDERS
-- ─────────────────────────────────────────
create table rider_profiles (
  id uuid references profiles(id) on delete cascade primary key,
  city text not null,
  vehicle_type text default 'motorcycle' check (vehicle_type in ('motorcycle','bicycle','car')),
  is_online boolean default false,
  current_lat numeric(10,7),
  current_lng numeric(10,7),
  rating numeric(2,1) default 5.0,
  total_deliveries int default 0,
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- PAYMENTS LOG
-- ─────────────────────────────────────────
create table payment_transactions (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete set null,
  provider text not null check (provider in ('mtn_momo','airtel_money','cash','card')),
  provider_reference text,        -- external transaction ID
  amount int not null,
  currency text default 'RWF',
  status text not null default 'pending' check (status in ('pending','success','failed')),
  raw_response jsonb,             -- store full provider response for debugging
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS LOG
-- ─────────────────────────────────────────
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  channel text not null check (channel in ('sms','whatsapp','push')),
  message text not null,
  status text default 'sent',
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table profiles enable row level security;
alter table merchants enable row level security;
alter table menu_items enable row level security;
alter table menu_categories enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table rider_profiles enable row level security;
alter table payment_transactions enable row level security;

-- Profiles: users can read/update own profile; admin reads all
create policy "Users can read own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);
create policy "Admin reads all profiles" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Merchants: public read for active merchants
create policy "Public can read active merchants" on merchants
  for select using (is_active = true);
create policy "Merchant can update own restaurant" on merchants
  for update using (owner_id = auth.uid());
create policy "Admin full access merchants" on merchants
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Menu items: public read for available items
create policy "Public can read available menu items" on menu_items
  for select using (is_available = true);
create policy "Merchant can manage own menu" on menu_items
  for all using (
    exists (select 1 from merchants where id = menu_items.merchant_id and owner_id = auth.uid())
  );

-- Orders: customers see own orders; merchants see orders for their restaurant; riders see assigned
create policy "Customer sees own orders" on orders
  for select using (customer_id = auth.uid());
create policy "Merchant sees restaurant orders" on orders
  for select using (
    exists (select 1 from merchants where id = orders.merchant_id and owner_id = auth.uid())
  );
create policy "Rider sees assigned orders" on orders
  for select using (rider_id = auth.uid());
create policy "Admin sees all orders" on orders
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Customer can insert orders" on orders
  for insert with check (customer_id = auth.uid());
create policy "Merchant can update order status" on orders
  for update using (
    exists (select 1 from merchants where id = orders.merchant_id and owner_id = auth.uid())
  );

-- Order items follow order access
create policy "Order items follow order access" on order_items
  for select using (
    exists (select 1 from orders where id = order_items.order_id and (
      customer_id = auth.uid() or rider_id = auth.uid() or
      exists (select 1 from merchants where id = orders.merchant_id and owner_id = auth.uid())
    ))
  );

-- ─────────────────────────────────────────
-- REALTIME (enable for live order tracking)
-- ─────────────────────────────────────────
-- In Supabase dashboard: Database → Replication → enable for:
-- orders, rider_profiles, order_status_history

-- Run this to enable via SQL:
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table orders, rider_profiles, order_status_history;
commit;
