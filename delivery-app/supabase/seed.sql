-- ============================================================
-- Seed Data — Run after 001_initial.sql
-- Creates sample merchants + menu items for testing
-- ============================================================

-- Note: Create real merchant accounts in Supabase Auth first,
-- then replace the owner_id UUIDs below.
-- For testing, you can leave owner_id as null.

-- ─── MERCHANTS ───────────────────────────────────────────────

insert into merchants (name, slug, description, category, city, address, phone, rating, delivery_fee, delivery_time_min, delivery_time_max, is_open, is_active) values
(
  'Inzovu Kitchen',
  'inzovu-kitchen',
  'Authentic Rwandan home cooking. Isombe, tilapia, brochettes and more.',
  'Rwandan',
  'Kigali',
  'KG 14 Ave, Kacyiru, Kigali',
  '+250788000001',
  4.8, 500, 20, 35, true, true
),
(
  'Nyamirambo Grill',
  'nyamirambo-grill',
  'The best brochettes in the city. Beef, goat, chicken — all chargrilled.',
  'BBQ & Brochettes',
  'Kigali',
  'KN 3 St, Nyamirambo, Kigali',
  '+250788000002',
  4.6, 500, 25, 40, true, true
),
(
  'Kigali Café',
  'kigali-cafe',
  'Specialty Rwandan coffee, fresh juices, mandazi and light bites.',
  'Coffee & Snacks',
  'Kigali',
  'KG 7 Ave, Kimihurura, Kigali',
  '+250788000003',
  4.9, 300, 15, 25, true, true
),
(
  'Indian Spice House',
  'indian-spice-house',
  'Authentic North and South Indian cuisine. Curries, biryanis, fresh naan.',
  'Indian',
  'Kigali',
  'KN 5 Rd, Remera, Kigali',
  '+250788000004',
  4.7, 600, 30, 45, true, true
),
(
  'Pizza House RW',
  'pizza-house-rw',
  'Stone-baked pizzas and fresh pasta, made to order.',
  'Italian',
  'Kigali',
  'KG 11 Ave, Kiyovu, Kigali',
  '+250788000005',
  4.4, 500, 35, 50, true, true
),
(
  'Lake View Kitchen',
  'lake-view-kitchen',
  'Fresh Lake Kivu tilapia and local dishes with a view.',
  'Rwandan',
  'Rubavu',
  'Gisenyi Beach Rd, Rubavu',
  '+250788000006',
  4.7, 400, 20, 35, true, true
),
(
  'Volcan Brochettes',
  'volcan-brochettes',
  'Chargrilled brochettes and cold Mutzig. Musanze staple since 2015.',
  'BBQ & Brochettes',
  'Musanze',
  'Musanze Town Centre',
  '+250788000007',
  4.5, 400, 20, 40, true, true
);

-- ─── MENU CATEGORIES ──────────────────────────────────────────

-- Inzovu Kitchen categories
with m as (select id from merchants where slug = 'inzovu-kitchen')
insert into menu_categories (merchant_id, name, sort_order)
select m.id, cat, i from m,
  (values ('Main Dishes', 1), ('Rice & Sides', 2), ('Drinks', 3)) as t(cat, i);

-- ─── MENU ITEMS ───────────────────────────────────────────────

-- Inzovu Kitchen
with m as (select id from merchants where slug = 'inzovu-kitchen')
insert into menu_items (merchant_id, name, description, price, is_available) select
  m.id, name, description, price, true
from m,
(values
  ('Isombe na Dodo', 'Cassava leaves with amaranth greens, served with rice', 3500),
  ('Grilled Tilapia', 'Lake Kivu tilapia, chips and mixed salad', 5500),
  ('Igisafuriya', 'Traditional beef stew with potatoes and ripe plantains', 4500),
  ('Brochettes Plate', 'Goat brochettes (6 pieces) with frites and sauce', 4000),
  ('Ugali na Sukuma', 'Maize ugali with sautéed sukuma wiki', 2500),
  ('Agatogo', 'Banana and beef stew, cooked low and slow', 4000)
) as items(name, description, price);

-- Nyamirambo Grill
with m as (select id from merchants where slug = 'nyamirambo-grill')
insert into menu_items (merchant_id, name, description, price, is_available) select
  m.id, name, description, price, true
from m,
(values
  ('Mixed Brochettes', 'Beef, goat and chicken skewers with frites', 5000),
  ('Nyama Choma (Beef)', 'Slow-roasted beef ribs with kachumbari', 7000),
  ('Nyama Choma (Goat)', 'Roasted goat shoulder, traditionally spiced', 6500),
  ('Grilled Chicken Half', 'Half chicken, marinated and chargrilled', 5500),
  ('Brochettes Only (6pc)', 'Six goat brochettes, no sides', 3000),
  ('Frites (Large)', 'Crispy fried chips', 1500)
) as items(name, description, price);

-- Kigali Café
with m as (select id from merchants where slug = 'kigali-cafe')
insert into menu_items (merchant_id, name, description, price, is_available) select
  m.id, name, description, price, true
from m,
(values
  ('Rwandan Coffee (Black)', 'Single-origin Arabica, black', 1500),
  ('Rwandan Coffee (Milk)', 'Single-origin Arabica with steamed milk', 2000),
  ('Fresh Juice (Passion)', 'Fresh-squeezed passion fruit juice', 1500),
  ('Mandazi (6pc)', 'Lightly sweetened fried dough', 1200),
  ('Avocado Toast', 'Sourdough, avocado, chilli flakes, soft egg', 3000),
  ('Samosa (3pc)', 'Beef samosas, freshly fried', 1800)
) as items(name, description, price);

-- Indian Spice House
with m as (select id from merchants where slug = 'indian-spice-house')
insert into menu_items (merchant_id, name, description, price, is_available) select
  m.id, name, description, price, true
from m,
(values
  ('Chicken Tikka Masala', 'Creamy tomato curry, served with rice or naan', 6000),
  ('Palak Paneer', 'Spinach and cottage cheese curry (vegetarian)', 5000),
  ('Chicken Biryani', 'Fragrant basmati rice with spiced chicken', 5500),
  ('Lamb Rogan Josh', 'Slow-cooked Kashmiri lamb curry', 6500),
  ('Dal Makhani', 'Black lentil curry, butter and cream', 4500),
  ('Garlic Naan (2pc)', 'Freshly baked garlic naan', 1500)
) as items(name, description, price);

-- Pizza House RW
with m as (select id from merchants where slug = 'pizza-house-rw')
insert into menu_items (merchant_id, name, description, price, is_available) select
  m.id, name, description, price, true
from m,
(values
  ('Margherita Pizza (30cm)', 'Tomato, fresh mozzarella, basil', 8000),
  ('BBQ Chicken Pizza (30cm)', 'Smoky BBQ base, grilled chicken, red onion', 9000),
  ('Pepperoni Pizza (30cm)', 'Classic pepperoni with mozzarella', 9500),
  ('Pasta Carbonara', 'Creamy bacon and egg pasta, freshly made', 6500),
  ('Pasta Arrabiata', 'Spicy tomato pasta (vegetarian)', 5500),
  ('Garlic Bread', 'Buttered and toasted ciabatta', 2000)
) as items(name, description, price);

-- Lake View Kitchen (Rubavu)
with m as (select id from merchants where slug = 'lake-view-kitchen')
insert into menu_items (merchant_id, name, description, price, is_available) select
  m.id, name, description, price, true
from m,
(values
  ('Fried Tilapia (Whole)', 'Lake Kivu tilapia, crispy fried with chips', 5000),
  ('Grilled Tilapia (Whole)', 'Tilapia marinated and grilled over charcoal', 5500),
  ('Mukeke (2pc)', 'Local lake fish, pan-fried with lemon', 4500),
  ('Isombe Plate', 'Cassava leaves with rice and fried plantain', 3500),
  ('Goat Brochettes (6pc)', 'Chargrilled goat skewers', 3500),
  ('Fresh Passion Juice', 'Lake-cooled fresh juice', 1200)
) as items(name, description, price);
