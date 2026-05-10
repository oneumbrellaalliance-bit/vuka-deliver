'use client'
// app/merchant/page.tsx
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order, Merchant, MenuItem } from '@/lib/supabase/types'

type Tab = 'orders' | 'menu' | 'settings'

const STATUS_FLOW: Record<string, string> = {
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'in_transit',
}

const STATUS_LABELS: Record<string, string> = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  preparing:  'Preparing',
  ready:      'Ready',
  in_transit: 'In Transit',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
}

const NEXT_LABELS: Record<string, string> = {
  pending:   'Confirm',
  confirmed: 'Start Cooking',
  preparing: 'Mark Ready',
  ready:     'Dispatch',
}

export default function MerchantPage() {
  const [tab, setTab]           = useState<Tab>('orders')
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [orders, setOrders]     = useState<(Order & { order_items: any[] })[]>([])
  const [items, setItems]       = useState<MenuItem[]>([])
  const [loading, setLoading]   = useState(true)
  const supabase                = createClient()

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: m } = await supabase
      .from('merchants')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (!m) { setLoading(false); return }
    setMerchant(m)

    const { data: ords } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('merchant_id', m.id)
      .not('status', 'in', '("delivered","cancelled")')
      .order('created_at', { ascending: false })

    setOrders(ords || [])

    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('*')
      .eq('merchant_id', m.id)
      .order('sort_order')

    setItems(menuItems || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()

    // Realtime — new orders come in live
    const channel = supabase
      .channel('merchant-orders')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
      }, () => loadData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadData, supabase])

  const advanceOrder = async (orderId: string, currentStatus: string) => {
    const next = STATUS_FLOW[currentStatus]
    if (!next) return
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    await loadData()
  }

  const toggleOpen = async () => {
    if (!merchant) return
    const { data } = await supabase
      .from('merchants')
      .update({ is_open: !merchant.is_open })
      .eq('id', merchant.id)
      .select()
      .single()
    if (data) setMerchant(data)
  }

  const toggleItemAvailability = async (item: MenuItem) => {
    await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)
    await loadData()
  }

  const todayRevenue = orders
    .filter(o => o.payment_status === 'paid' || o.payment_method === 'cash')
    .reduce((s, o) => s + o.subtotal, 0)

  if (loading) return (
    <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading dashboard...</p>
    </div>
  )

  if (!merchant) return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-4xl mb-3">🍽️</div>
      <h2 className="font-bold text-gray-900 mb-2">No restaurant found</h2>
      <p className="text-gray-500 text-sm">Your account isn't linked to a restaurant yet. Contact support.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-white font-bold text-base">{merchant.name}</h1>
          <p className="text-gray-400 text-xs">Merchant dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${merchant.is_open ? 'text-green-400' : 'text-red-400'}`}>
            {merchant.is_open ? 'OPEN' : 'CLOSED'}
          </span>
          <div
            onClick={toggleOpen}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${merchant.is_open ? 'bg-green-500' : 'bg-gray-500'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${merchant.is_open ? 'left-6' : 'left-1'}`} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        {[
          { label: 'Active orders', value: orders.filter(o => o.status !== 'delivered').length },
          { label: 'Revenue today', value: `${(todayRevenue/1000).toFixed(0)}K RWF` },
          { label: 'Rating',        value: `★ ${merchant.rating}` },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <div className="font-bold text-gray-900 text-lg">{s.value}</div>
            <div className="text-gray-400 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pb-3">
        {(['orders', 'menu', 'settings'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize border-none cursor-pointer ${
              tab === t ? 'bg-brand text-white' : 'bg-white text-gray-500'}`}>
            {t === 'orders' ? `Orders (${orders.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pb-8 space-y-3">

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          orders.length === 0
            ? <div className="card p-8 text-center text-gray-400">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm">No active orders right now</p>
              </div>
            : orders.map(order => (
                <div key={order.id} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{order.order_number}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {order.customer_name} · {new Date(order.created_at).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`badge-${order.status === 'in_transit' ? 'transit' : order.status}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    {order.order_items.map((i: any) => `${i.name} ×${i.quantity}`).join(', ')}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brand text-sm">{order.total.toLocaleString()} RWF</span>
                    {STATUS_FLOW[order.status] && (
                      <button
                        onClick={() => advanceOrder(order.id, order.status)}
                        className="bg-[#1a1a1a] text-white text-xs font-medium px-4 py-2 rounded-xl cursor-pointer border-none"
                      >
                        → {NEXT_LABELS[order.status]}
                      </button>
                    )}
                    {order.status === 'in_transit' && (
                      <span className="text-xs text-gray-400">Rider collected</span>
                    )}
                  </div>

                  {/* Payment badge */}
                  <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between text-xs text-gray-400">
                    <span>{order.delivery_address}</span>
                    <span className={order.payment_status === 'paid' ? 'text-green-600 font-medium' : ''}>
                      {order.payment_method === 'cash' ? 'Cash' : order.payment_status === 'paid' ? 'Paid ✓' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))
        )}

        {/* MENU TAB */}
        {tab === 'menu' && (
          items.length === 0
            ? <div className="card p-8 text-center text-gray-400">
                <div className="text-3xl mb-2">🍽️</div>
                <p className="text-sm">No menu items yet</p>
              </div>
            : items.map(item => (
                <div key={item.id} className={`card p-4 flex justify-between items-center ${!item.is_available ? 'opacity-50' : ''}`}>
                  <div className="flex-1 mr-3">
                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    {item.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>}
                    <p className="text-brand font-bold text-sm mt-1">{item.price.toLocaleString()} RWF</p>
                  </div>
                  <div
                    onClick={() => toggleItemAvailability(item)}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors flex-shrink-0 ${item.is_available ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${item.is_available ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </div>
              ))
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div className="card p-4 space-y-4">
            <h2 className="font-bold text-gray-900">Restaurant settings</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant name</label>
              <input defaultValue={merchant.name} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input defaultValue={merchant.phone || ''} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input defaultValue={merchant.address || ''} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min delivery time (min)</label>
                <input type="number" defaultValue={merchant.delivery_time_min} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max delivery time (min)</label>
                <input type="number" defaultValue={merchant.delivery_time_max} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
            </div>
            <button className="w-full bg-brand text-white font-medium py-3 rounded-xl text-sm cursor-pointer border-none">
              Save changes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
