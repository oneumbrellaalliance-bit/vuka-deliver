'use client'
// app/admin/page.tsx
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type AdminTab = 'overview' | 'orders' | 'merchants' | 'riders'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing',
  ready: 'Ready', in_transit: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-pending', confirmed: 'badge-preparing', preparing: 'badge-preparing',
  ready: 'badge-ready', in_transit: 'badge-transit', delivered: 'badge-delivered', cancelled: 'badge-cancelled',
}

export default function AdminPage() {
  const [tab, setTab]           = useState<AdminTab>('overview')
  const [orders, setOrders]     = useState<any[]>([])
  const [merchants, setMerchants] = useState<any[]>([])
  const [riders, setRiders]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const supabase                = createClient()

  const load = useCallback(async () => {
    const [ordersRes, merchantsRes, ridersRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, merchants(name), order_items(name, quantity)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('merchants')
        .select('*')
        .order('name'),
      supabase
        .from('rider_profiles')
        .select('*, profiles(full_name, phone)')
        .order('total_deliveries', { ascending: false }),
    ])
    setOrders(ordersRes.data || [])
    setMerchants(merchantsRes.data || [])
    setRiders(ridersRes.data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
    const ch = supabase.channel('admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rider_profiles' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load, supabase])

  const toggleMerchant = async (id: string, current: boolean) => {
    await supabase.from('merchants').update({ is_open: !current }).eq('id', id)
    await load()
  }

  const toggleMerchantActive = async (id: string, current: boolean) => {
    await supabase.from('merchants').update({ is_active: !current }).eq('id', id)
    await load()
  }

  const assignRider = async (orderId: string, riderId: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_transit' }),
    })
    await supabase.from('orders').update({ rider_id: riderId }).eq('id', orderId)
    await load()
  }

  // Metrics
  const activeOrders    = orders.filter(o => !['delivered','cancelled'].includes(o.status)).length
  const openMerchants   = merchants.filter(m => m.is_open && m.is_active).length
  const activeRiders    = riders.filter(r => r.is_online).length
  const todayRevenue    = orders
    .filter(o => o.payment_status === 'paid' || o.payment_method === 'cash')
    .reduce((s: number, o: any) => s + (o.total || 0), 0)

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f14] flex items-center justify-center">
      <p className="text-gray-500 text-sm">Loading ops center...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0f14] text-white">
      {/* Header */}
      <div className="bg-[#17171f] border-b border-[#2a2a38] px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-base">⚡ Ops Center</h1>
          <p className="text-gray-500 text-xs">Live · Kigali</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {[
          { label: 'Active orders',    value: activeOrders,                    color: '#D85A30' },
          { label: 'Open merchants',   value: `${openMerchants}/${merchants.length}`, color: '#63c922' },
          { label: 'Riders online',    value: activeRiders,                    color: '#378ADD' },
          { label: "Today's revenue",  value: `${(todayRevenue/1000).toFixed(0)}K RWF`, color: '#9F97EE' },
        ].map(s => (
          <div key={s.label} className="bg-[#17171f] border border-[#2a2a38] rounded-xl p-3"
            style={{ borderColor: s.color + '33' }}>
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: s.color }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pb-3">
        {(['overview','orders','merchants','riders'] as AdminTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border-none cursor-pointer ${
              tab === t ? 'bg-brand text-white' : 'bg-[#1f1f2a] text-gray-400'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 pb-8 space-y-2">

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <>
            <p className="text-xs text-gray-500 uppercase tracking-wide py-1">Latest orders</p>
            {orders.slice(0, 6).map(order => (
              <div key={order.id} className="bg-[#17171f] border border-[#2a2a38] rounded-xl p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-white">{order.order_number}</span>
                  <span className={STATUS_COLORS[order.status] || 'badge-pending'}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{order.customer_name} · {order.delivery_address}</p>
                <p className="text-sm font-bold text-brand mt-1">{(order.total||0).toLocaleString()} RWF</p>
              </div>
            ))}
          </>
        )}

        {/* ORDERS */}
        {tab === 'orders' && orders.map(order => (
          <div key={order.id} className="bg-[#17171f] border border-[#2a2a38] rounded-xl p-3">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="font-medium text-sm text-white">{order.order_number}</span>
                <p className="text-xs text-gray-500 mt-0.5">{order.customer_name} · {new Date(order.created_at).toLocaleTimeString('en-RW',{hour:'2-digit',minute:'2-digit'})}</p>
              </div>
              <span className={STATUS_COLORS[order.status] || 'badge-pending'}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-1">
              {(order.order_items||[]).slice(0,3).map((i:any)=>`${i.name} ×${i.quantity}`).join(', ')}
            </p>
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-brand">{(order.total||0).toLocaleString()} RWF</p>
              <p className="text-xs text-gray-500">{order.payment_method?.replace('_',' ')} · {order.payment_status}</p>
            </div>
            {order.merchants && (
              <p className="text-xs text-gray-600 mt-1">{order.merchants.name}</p>
            )}
          </div>
        ))}

        {/* MERCHANTS */}
        {tab === 'merchants' && merchants.map(m => (
          <div key={m.id} className="bg-[#17171f] border border-[#2a2a38] rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="font-medium text-sm text-white">{m.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.category} · ★ {m.rating} · {m.city}</p>
              <div className="flex gap-2 mt-1">
                <span className={`text-xs font-medium ${m.is_open ? 'text-green-400' : 'text-gray-500'}`}>
                  {m.is_open ? 'Open' : 'Closed'}
                </span>
                <span className={`text-xs ${m.is_active ? 'text-gray-500' : 'text-red-400 font-medium'}`}>
                  {m.is_active ? 'Active' : 'Suspended'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => toggleMerchant(m.id, m.is_open)}
                className={`text-xs px-3 py-1 rounded-lg border-none cursor-pointer font-medium ${
                  m.is_open ? 'bg-[#2a2a38] text-gray-300' : 'bg-green-900 text-green-300'}`}>
                {m.is_open ? 'Close' : 'Open'}
              </button>
              <button
                onClick={() => toggleMerchantActive(m.id, m.is_active)}
                className={`text-xs px-3 py-1 rounded-lg border-none cursor-pointer font-medium ${
                  m.is_active ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                {m.is_active ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        ))}

        {/* RIDERS */}
        {tab === 'riders' && (
          riders.length === 0
            ? <div className="bg-[#17171f] rounded-xl p-8 text-center text-gray-500 text-sm">
                No riders registered yet. Riders sign up at /signup and are assigned the rider role in Supabase.
              </div>
            : riders.map(r => (
                <div key={r.id} className="bg-[#17171f] border border-[#2a2a38] rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-white">{r.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.city} · {r.vehicle_type} · {r.total_deliveries} deliveries</p>
                    <p className="text-xs text-gray-500">★ {r.rating}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${r.is_online ? 'text-green-400' : 'text-gray-500'}`}>
                      {r.is_online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{r.profiles?.phone}</p>
                  </div>
                </div>
              ))
        )}
      </div>
    </div>
  )
}
