'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Merchant {
  id: string; name: string; slug: string; category: string; city: string
  rating: number; delivery_time_min: number; delivery_time_max: number
  delivery_fee: number; is_open: boolean; logo_url: string | null
}

interface CartItem {
  merchantId: string; merchantName: string; name: string; price: number; qty: number
}

const BANNERS = [
  { title: 'No container charge. Ever.', sub: 'Flat 1,000 RWF delivery · MTN MoMo & Airtel', bg: '#D85A30' },
  { title: '18 restaurants in Kigali', sub: 'From Paka street food to Inganzo fine dining', bg: '#1d4ed8' },
  { title: 'New: Japanda is live', sub: 'Ramen, donburi, yakitori & sake delivering', bg: '#075985' },
  { title: 'Pay with MTN or Airtel', sub: 'Mobile Money · Airtel Money · Cash on delivery', bg: '#065f46' },
]

const PANEL_TABS = [
  { id: 'customer', label: 'Customer App' },
  { id: 'merchant', label: 'Merchant' },
  { id: 'admin', label: 'Admin' },
]

export default function HomePage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [category, setCategory] = useState('All')
  const [categories, setCategories] = useState<string[]>([])
  const [banner, setBanner] = useState(0)
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)
  const [screen, setScreen] = useState<'home' | 'menu' | 'cart' | 'orders' | 'prime' | 'more'>('home')
  const [panel, setPanel] = useState<'customer' | 'merchant' | 'admin'>('customer')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [searchActive, setSearchActive] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('merchants')
      .select('*')
      .eq('is_active', true)
      .eq('city', 'Kigali')
      .order('rating', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setMerchants(data)
          setCategories(['All', ...Array.from(new Set(data.map((m: Merchant) => m.category)))])
        }
      })
    const t = setInterval(() => setBanner(b => (b + 1) % BANNERS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const filtered = merchants.filter(m => {
    const matchCat = category === 'All' || m.category === category
    const matchSearch = search === '' || m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const ff = { fontFamily: "'Outfit',-apple-system,sans-serif" }

  // ─── Panel Switcher (top bar) ────────────────────────────────────────────
  const PanelSwitcher = () => (
    <div style={{ background: '#000', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'center', padding: '6px 14px', gap: 6 }}>
      {PANEL_TABS.map(p => (
        <button key={p.id} onClick={() => setPanel(p.id as any)}
          style={{
            padding: '5px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 11, fontWeight: 600,
            background: panel === p.id ? '#D85A30' : '#1a1a1a',
            color: panel === p.id ? '#fff' : '#555',
            transition: 'all 0.2s'
          }}>
          {p.label}
        </button>
      ))}
    </div>
  )

  // ─── Bottom Nav ──────────────────────────────────────────────────────────
  const BottomNav = () => {
    const tabs = [
      { id: 'home', icon: '☰', label: 'Store Front' },
      { id: 'prime', icon: '◈', label: 'Prime' },
      { id: 'orders', icon: '🛍', label: 'Orders' },
      { id: 'cart', icon: '🛒', label: 'Cart' },
      { id: 'more', icon: '⋮', label: 'More' },
    ]
    return (
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111', borderTop: '0.5px solid #222', display: 'flex', zIndex: 100 }}>
        {tabs.map(t => (
          <div key={t.id}
            onClick={() => {
              if (t.id === 'home') { setScreen('home'); setSelectedMerchant(null) }
              else setScreen(t.id as any)
            }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px 6px', cursor: 'pointer', gap: 2, position: 'relative' }}>
            {t.id === 'cart' && cartCount > 0 && (
              <div style={{ position: 'absolute', top: 4, right: '50%', marginRight: -18, background: '#D85A30', color: '#fff', borderRadius: 10, fontSize: 8, fontWeight: 700, padding: '1px 5px', minWidth: 14, textAlign: 'center' }}>
                {cartCount}
              </div>
            )}
            <span style={{ fontSize: 18, color: screen === t.id ? '#D85A30' : '#444' }}>{t.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: screen === t.id ? '#D85A30' : '#444' }}>{t.label}</span>
          </div>
        ))}
      </div>
    )
  }

  // ─── Merchant Panel ──────────────────────────────────────────────────────
  if (panel === 'merchant') {
    return (
      <div style={{ ...ff, background: '#0f0f0f', minHeight: '100vh', color: '#fff' }}>
        <PanelSwitcher />
        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏪</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Merchant Dashboard</div>
          <div style={{ color: '#555', fontSize: 13, marginBottom: 30 }}>Manage your restaurant, menu, and orders</div>
          {[
            { icon: '🍽️', label: 'My Menu', desc: 'Add and edit menu items' },
            { icon: '📦', label: 'Live Orders', desc: 'View and manage incoming orders' },
            { icon: '📊', label: 'Analytics', desc: 'Sales, ratings and insights' },
            { icon: '⚙️', label: 'Settings', desc: 'Hours, delivery zones, payments' },
          ].map(item => (
            <div key={item.label} style={{ background: '#1a1a1a', borderRadius: 12, padding: '16px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, border: '0.5px solid #2a2a2a', cursor: 'pointer' }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, background: '#1a1a1a', borderRadius: 12, padding: 16, border: '0.5px solid #2a2a2a' }}>
            <div style={{ color: '#555', fontSize: 11, marginBottom: 4 }}>Status</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Restaurant is Open
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Admin Panel ─────────────────────────────────────────────────────────
  if (panel === 'admin') {
    return (
      <div style={{ ...ff, background: '#0f0f0f', minHeight: '100vh', color: '#fff' }}>
        <PanelSwitcher />
        <div style={{ padding: '30px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Admin Panel</div>
            <div style={{ color: '#555', fontSize: 12, marginTop: 6 }}>Vuka Deliver Operations</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Restaurants', value: merchants.length, icon: '🏪', color: '#D85A30' },
              { label: 'Active Orders', value: '—', icon: '📦', color: '#3b82f6' },
              { label: 'Drivers Online', value: '—', icon: '🛵', color: '#22c55e' },
              { label: 'Revenue Today', value: '—', icon: '💰', color: '#f59e0b' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#1a1a1a', borderRadius: 12, padding: '14px 12px', border: '0.5px solid #2a2a2a' }}>
                <div style={{ fontSize: 22 }}>{stat.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: stat.color, marginTop: 6 }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
          {[
            { icon: '🏪', label: 'Manage Restaurants' },
            { icon: '🛵', label: 'Driver Management' },
            { icon: '👤', label: 'Users & Accounts' },
            { icon: '📊', label: 'Platform Analytics' },
            { icon: '💳', label: 'Payments & Payouts' },
          ].map(item => (
            <div key={item.label} style={{ background: '#1a1a1a', borderRadius: 12, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, border: '0.5px solid #2a2a2a', cursor: 'pointer' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</span>
              <span style={{ marginLeft: 'auto', color: '#333', fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Menu Screen ──────────────────────────────────────────────────────────
  if (screen === 'menu' && selectedMerchant) {
    return (
      <div style={{ ...ff, background: '#0f0f0f', minHeight: '100vh', color: '#fff', paddingBottom: 130 }}>
        <PanelSwitcher />
        <MerchantMenuScreen
          merchant={selectedMerchant}
          cart={cart}
          setCart={setCart}
          onBack={() => { setScreen('home'); setSelectedMerchant(null) }}
        />
        <BottomNav />
      </div>
    )
  }

  // ─── Cart Screen ──────────────────────────────────────────────────────────
  if (screen === 'cart') {
    return (
      <div style={{ ...ff, background: '#0f0f0f', minHeight: '100vh', color: '#fff', paddingBottom: 80 }}>
        <PanelSwitcher />
        <div style={{ background: '#111', padding: '14px 16px', position: 'sticky', top: 0, zIndex: 50, borderBottom: '0.5px solid #2a2a2a' }}>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>🛒 Your Cart</div>
        </div>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#555' }}>
            <div style={{ fontSize: 50, marginBottom: 16 }}>🛒</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Your cart is empty</div>
            <div style={{ fontSize: 12, marginBottom: 24 }}>Add items from a restaurant to get started</div>
            <button onClick={() => setScreen('home')}
              style={{ background: '#D85A30', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div style={{ padding: '12px 14px' }}>
            <div style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #2a2a2a', fontSize: 11, color: '#555', fontWeight: 600 }}>
                {cart[0]?.merchantName?.toUpperCase()}
              </div>
              {cart.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: i < cart.length - 1 ? '0.5px solid #1e1e1e' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                    <div style={{ color: '#D85A30', fontSize: 12, fontWeight: 700, marginTop: 2 }}>{item.price.toLocaleString()} RWF</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => setCart(prev => {
                      const e = prev.find(c => c.name === item.name)
                      if (!e) return prev
                      if (e.qty > 1) return prev.map(c => c.name === item.name ? { ...c, qty: c.qty - 1 } : c)
                      return prev.filter(c => c.name !== item.name)
                    })}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: '0.5px solid #2a2a2a', background: '#111', color: '#fff', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      −
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => setCart(prev => prev.map(c => c.name === item.name ? { ...c, qty: c.qty + 1 } : c))}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#D85A30', color: '#fff', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div style={{ background: '#1a1a1a', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Order Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
                <span>Subtotal</span><span>{cartTotal.toLocaleString()} RWF</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
                <span>Delivery fee</span><span style={{ color: '#22c55e' }}>1,000 RWF</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#22c55e', fontWeight: 600, marginBottom: 8 }}>
                <span>Container charge</span><span>0 RWF ✓</span>
              </div>
              <div style={{ borderTop: '0.5px solid #2a2a2a', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800 }}>
                <span>Total</span><span style={{ color: '#D85A30' }}>{(cartTotal + 1000).toLocaleString()} RWF</span>
              </div>
            </div>

            <button style={{ width: '100%', background: '#D85A30', color: '#fff', border: 'none', borderRadius: 12, padding: '15px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Place Order · MTN MoMo / Airtel
            </button>
          </div>
        )}
        <BottomNav />
      </div>
    )
  }

  // ─── Orders Screen ────────────────────────────────────────────────────────
  if (screen === 'orders') {
    return (
      <div style={{ ...ff, background: '#0f0f0f', minHeight: '100vh', color: '#fff', paddingBottom: 80 }}>
        <PanelSwitcher />
        <div style={{ background: '#111', padding: '14px 16px', position: 'sticky', top: 0, zIndex: 50, borderBottom: '0.5px solid #2a2a2a' }}>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>🛍 My Orders</div>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#555' }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>📦</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No orders yet</div>
          <div style={{ fontSize: 12, marginBottom: 24 }}>Your order history will appear here</div>
          <button onClick={() => setScreen('home')}
            style={{ background: '#D85A30', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Order Now
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  // ─── Prime Screen ─────────────────────────────────────────────────────────
  if (screen === 'prime') {
    return (
      <div style={{ ...ff, background: '#0f0f0f', minHeight: '100vh', color: '#fff', paddingBottom: 80 }}>
        <PanelSwitcher />
        <div style={{ background: 'linear-gradient(135deg,#D85A30,#b04020)', padding: '24px 20px 30px' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>◈</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Vuka Prime</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6 }}>Unlimited free delivery + exclusive perks</div>
        </div>
        <div style={{ padding: '20px 16px' }}>
          {[
            { icon: '🛵', title: 'Free delivery every order', desc: 'No delivery fees, ever. Save 1,000 RWF each time' },
            { icon: '⚡', title: 'Priority queue', desc: 'Your order goes to the front, every time' },
            { icon: '🎁', title: 'Monthly surprise reward', desc: 'Free item from a featured restaurant' },
            { icon: '💳', title: 'Exclusive Prime deals', desc: 'Members-only discounts every week' },
          ].map(perk => (
            <div key={perk.title} style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{perk.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{perk.title}</div>
                <div style={{ color: '#555', fontSize: 11, marginTop: 3 }}>{perk.desc}</div>
              </div>
            </div>
          ))}
          <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 20, marginTop: 10, textAlign: 'center', border: '0.5px solid #2a2a2a' }}>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Monthly plan</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#D85A30' }}>4,900 <span style={{ fontSize: 14, color: '#888' }}>RWF/mo</span></div>
            <button style={{ marginTop: 16, width: '100%', background: '#D85A30', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Start Prime
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  // ─── More Screen ──────────────────────────────────────────────────────────
  if (screen === 'more') {
    return (
      <div style={{ ...ff, background: '#0f0f0f', minHeight: '100vh', color: '#fff', paddingBottom: 80 }}>
        <PanelSwitcher />
        <div style={{ background: '#111', padding: '14px 16px', position: 'sticky', top: 0, zIndex: 50, borderBottom: '0.5px solid #2a2a2a' }}>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>More</div>
        </div>
        <div style={{ padding: '16px 14px' }}>
          {[
            { icon: '👤', label: 'My Account' },
            { icon: '📍', label: 'Saved Addresses' },
            { icon: '💳', label: 'Payment Methods' },
            { icon: '⭐', label: 'Rate the App' },
            { icon: '🆘', label: 'Help & Support' },
            { icon: '📋', label: 'Terms & Privacy' },
          ].map(item => (
            <div key={item.label} style={{ background: '#1a1a1a', borderRadius: 12, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, border: '0.5px solid #2a2a2a', cursor: 'pointer' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</span>
              <span style={{ marginLeft: 'auto', color: '#333', fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>
        <BottomNav />
      </div>
    )
  }

  // ─── Home Screen ──────────────────────────────────────────────────────────
  return (
    <div style={{ ...ff, background: '#0f0f0f', minHeight: '100vh', color: '#fff', paddingBottom: 64 }}>
      <PanelSwitcher />

      {/* Header */}
      <div style={{ background: '#111', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 36, zIndex: 40 }}>
        <div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>🛵 Vuka Deliver</div>
          <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>📍 Kigali · 1,000 RWF delivery · No container charge</div>
        </div>
        <span style={{ fontSize: 20 }}>🇷🇼</span>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 14px' }}>
        <div style={{ background: '#1e1e1e', borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, border: searchActive ? '1px solid #D85A30' : '1px solid transparent' }}>
          <span>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchActive(true)}
            onBlur={() => setSearchActive(false)}
            placeholder="Search and get it vuba cyane..."
            style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, flex: 1, fontFamily: 'inherit' }}
          />
          {search !== '' && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}>✕</button>
          )}
        </div>
      </div>

      {/* Only show banners/featured if not searching */}
      {search === '' && (
        <>
          {/* Banner */}
          <div style={{ margin: '0 14px 8px', borderRadius: 12, overflow: 'hidden', height: 110, position: 'relative' }}>
            {BANNERS.map((b, i) => (
              <div key={i} style={{ position: 'absolute', inset: 0, background: b.bg, opacity: i === banner ? 1 : 0, transition: 'opacity 0.4s', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 16 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.6),transparent)' }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{b.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 3 }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Banner dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 14 }}>
            {BANNERS.map((_, i) => (
              <button key={i} onClick={() => setBanner(i)}
                style={{ width: i === banner ? 16 : 6, height: 6, borderRadius: i === banner ? 3 : '50%', background: i === banner ? '#D85A30' : '#333', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />
            ))}
          </div>

          {/* Featured */}
          <div style={{ padding: '4px 14px 10px' }}>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>We know you might like...</div>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '0 14px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {merchants.slice(0, 6).map(m => (
              <div key={m.id} onClick={() => { setSelectedMerchant(m); setScreen('menu') }}
                style={{ flexShrink: 0, width: 140, background: '#1a1a1a', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: '0.5px solid #2a2a2a' }}>
                <div style={{ height: 80, background: '#1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#888', padding: 6, textAlign: 'center', lineHeight: 1.4 }}>
                  {m.name}
                </div>
                <div style={{ padding: '8px 9px 10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: '#D85A30', fontWeight: 600, marginTop: 4 }}>
                    {m.delivery_fee.toLocaleString()} RWF · ★ {m.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Kigali Favourites / Search results heading */}
      <div style={{ padding: '0 14px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>
          {search !== '' ? `Results for "${search}"` : 'Kigali Favourites'}
        </div>
        {search === '' && <span style={{ color: '#D85A30', fontSize: 11, fontWeight: 600 }}>See all</span>}
      </div>

      {/* Category filter */}
      {search === '' && (
        <div style={{ display: 'flex', gap: 7, padding: '0 14px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{ padding: '6px 14px', borderRadius: 20, border: category === cat ? '1px solid #D85A30' : '1px solid #2a2a2a', background: category === cat ? '#D85A30' : '#1a1a1a', color: category === cat ? '#fff' : '#888', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Restaurant grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🍽️</div>
          <div style={{ fontWeight: 600 }}>No restaurants found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 14px 20px' }}>
          {filtered.map(m => (
            <div key={m.id}
              onClick={() => m.is_open && (setSelectedMerchant(m), setScreen('menu'))}
              style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'hidden', cursor: m.is_open ? 'pointer' : 'default', border: '0.5px solid #2a2a2a', opacity: m.is_open ? 1 : 0.5 }}>
              <div style={{ height: 70, background: '#1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#888', padding: 6, textAlign: 'center', lineHeight: 1.4 }}>
                {m.name}
              </div>
              <div style={{ padding: '9px 10px 12px' }}>
                <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{m.name}</div>
                <div style={{ color: '#666', fontSize: 10, marginTop: 2 }}>{m.category}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10 }}>
                  <span style={{ color: '#F59E0B', fontWeight: 600 }}>★ {m.rating}</span>
                  <span style={{ color: '#666' }}>{m.delivery_time_min}–{m.delivery_time_max}m</span>
                </div>
                <div style={{ color: '#1b8a4e', fontSize: 9, fontWeight: 600, marginTop: 3 }}>
                  {m.is_open ? `${m.delivery_fee.toLocaleString()} RWF · No container charge` : 'Closed'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}

// ─── Merchant Menu Screen (standalone) ──────────────────────────────────────
function MerchantMenuScreen({
  merchant, cart, setCart, onBack
}: {
  merchant: Merchant
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  onBack: () => void
}) {
  const [items, setItems] = useState<any[]>([])
  const supabase = createClient()
  const ff = { fontFamily: "'Outfit',-apple-system,sans-serif" }

  useEffect(() => {
    supabase.from('menu_items').select('*')
      .eq('merchant_id', merchant.id)
      .eq('is_available', true)
      .order('sort_order')
      .then(({ data }) => setItems(data || []))
  }, [merchant.id])

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const addItem = (item: any) => setCart(prev => {
    const e = prev.find(c => c.name === item.name)
    if (e) return prev.map(c => c.name === item.name ? { ...c, qty: c.qty + 1 } : c)
    return [...prev, { merchantId: merchant.id, merchantName: merchant.name, name: item.name, price: item.price, qty: 1 }]
  })

  const removeItem = (name: string) => setCart(prev => {
    const e = prev.find(c => c.name === name)
    if (!e) return prev
    if (e.qty > 1) return prev.map(c => c.name === name ? { ...c, qty: c.qty - 1 } : c)
    return prev.filter(c => c.name !== name)
  })

  return (
    <div style={{ ...ff }}>
      {/* Header */}
      <div style={{ background: '#1a1a1a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 36, zIndex: 40, borderBottom: '0.5px solid #2a2a2a' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#D85A30', fontSize: 22, cursor: 'pointer', fontFamily: 'inherit' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{merchant.name}</div>
          <div style={{ color: '#666', fontSize: 10, marginTop: 1 }}>★ {merchant.rating} · {merchant.delivery_time_min}–{merchant.delivery_time_max} min</div>
        </div>
        {cartCount > 0 && (
          <div style={{ background: '#D85A30', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700 }}>
            {cartCount} items
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', background: '#1a1a1a', borderBottom: '0.5px solid #2a2a2a' }}>
        <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#666', flexWrap: 'wrap' }}>
          <span>★ {merchant.rating}</span>
          <span>{merchant.delivery_time_min}–{merchant.delivery_time_max} min</span>
          <span style={{ color: '#1b8a4e', fontWeight: 600 }}>1,000 RWF delivery</span>
          <span style={{ color: '#1b8a4e', fontWeight: 600 }}>No container charge</span>
        </div>
      </div>

      <div style={{ padding: '8px 14px 3px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555' }}>Menu</div>

      {/* Menu items */}
      {items.map(item => {
        const ic = cart.find(c => c.name === item.name)
        return (
          <div key={item.id} style={{ padding: '12px 14px', borderBottom: '0.5px solid #1a1a1a', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.name}</div>
              {item.description && (
                <div style={{ fontSize: 10, color: '#555', marginTop: 3, lineHeight: 1.4 }}>{item.description}</div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: '#D85A30', marginTop: 6 }}>
                {item.price.toLocaleString()} RWF
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, marginTop: 2 }}>
              {ic && (
                <>
                  <button onClick={() => removeItem(item.name)}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: '0.5px solid #2a2a2a', background: '#1a1a1a', color: '#fff', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    −
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{ic.qty}</span>
                </>
              )}
              <button onClick={() => addItem(item)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#D85A30', color: '#fff', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                +
              </button>
            </div>
          </div>
        )
      })}

      {/* Cart bar */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 64, left: 0, right: 0, padding: '10px 14px', background: '#0f0f0f', borderTop: '0.5px solid #1a1a1a' }}>
          <button style={{ width: '100%', background: '#D85A30', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontFamily: 'inherit' }}>
            <span>🛒 {cartCount} items · View Cart</span>
            <span>{cartTotal.toLocaleString()} RWF</span>
          </button>
        </div>
      )}
    </div>
  )
}

