'use client'
// app/order/[id]/page.tsx
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled'

interface OrderData {
  id: string
  order_number: string
  status: OrderStatus
  total: number
  subtotal: number
  delivery_fee: number
  customer_name: string
  customer_phone: string
  delivery_address: string
  payment_method: string
  payment_status: string
  estimated_delivery_at: string | null
  delivered_at: string | null
  created_at: string
  order_items: { name: string; quantity: number; price: number }[]
  merchants: { name: string; address: string | null; phone: string | null }
}

const STATUS_STEPS: { key: OrderStatus; label: string; sub: string }[] = [
  { key: 'confirmed',  label: 'Order confirmed',  sub: 'Payment received, restaurant notified' },
  { key: 'preparing',  label: 'Preparing',         sub: 'Restaurant is cooking your order' },
  { key: 'ready',      label: 'Ready for pickup',  sub: 'Rider is on the way to collect' },
  { key: 'in_transit', label: 'On the way',        sub: 'Your rider is heading to you' },
  { key: 'delivered',  label: 'Delivered',         sub: 'Enjoy your meal!' },
]

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'delivered']

function getStepIndex(status: OrderStatus) {
  return STATUS_ORDER.indexOf(status)
}

export default function OrderTrackingPage() {
  const { id }          = useParams<{ id: string }>()
  const router          = useRouter()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const fetchOrder = useCallback(async () => {
    const res  = await fetch(`/api/orders?id=${id}`)
    const data = await res.json()
    if (!res.ok) { setError('Order not found'); setLoading(false); return }
    setOrder(data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchOrder()

    // Supabase Realtime — subscribe to order status changes
    const supabase = createClient()
    const channel  = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'orders',
        filter: `id=eq.${id}`,
      }, payload => {
        setOrder(prev => prev ? { ...prev, status: payload.new.status, delivered_at: payload.new.delivered_at } : prev)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, fetchOrder])

  if (loading) return (
    <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading your order...</div>
    </div>
  )

  if (error || !order) return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-4xl mb-3">😕</div>
      <div className="font-bold text-gray-900 mb-2">Order not found</div>
      <Link href="/" className="text-brand text-sm font-medium">Back to home</Link>
    </div>
  )

  const currentStep  = getStepIndex(order.status)
  const isCancelled  = order.status === 'cancelled'
  const isDelivered  = order.status === 'delivered'

  const payLabel: Record<string, string> = {
    mtn_momo:    'MTN Mobile Money',
    airtel_money:'Airtel Money',
    cash:        'Cash on delivery',
    card:        'Card',
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-brand text-xl font-bold">←</Link>
          <div>
            <h1 className="text-white font-bold text-base">Track Order</h1>
            <p className="text-gray-400 text-xs">{order.order_number}</p>
          </div>
        </div>
        {!isDelivered && !isCancelled && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="text-xs text-gray-400">Live</span>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Status card */}
        {isCancelled ? (
          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">❌</div>
            <div className="font-bold text-gray-900 text-lg">Order cancelled</div>
            <p className="text-gray-500 text-sm mt-2">
              {order.payment_status === 'paid'
                ? 'Your refund will arrive within 24–48 hours.'
                : 'No charge was made.'}
            </p>
            <Link href="/" className="btn-primary mt-4 inline-block">Order again</Link>
          </div>
        ) : (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">From</p>
                <p className="font-bold text-gray-900">{order.merchants.name}</p>
              </div>
              {order.estimated_delivery_at && !isDelivered && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">Est. delivery</p>
                  <p className="font-bold text-brand text-sm">
                    {new Date(order.estimated_delivery_at).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              {isDelivered && (
                <span className="badge-delivered">Delivered</span>
              )}
            </div>

            {/* Progress steps */}
            <div className="space-y-4">
              {STATUS_STEPS.map((step, i) => {
                const stepIdx  = getStepIndex(step.key)
                const isDone   = currentStep >= stepIdx
                const isCurrent = currentStep === stepIdx && !isDelivered
                return (
                  <div key={step.key} className="flex gap-3 items-start">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      isDone ? 'bg-brand' : 'bg-gray-100'}`}>
                      <span className={`text-sm font-bold ${isDone ? 'text-white' : 'text-gray-300'}`}>
                        {isDone ? '✓' : (i + 1)}
                      </span>
                    </div>
                    <div className="pt-1.5">
                      <p className={`text-sm font-semibold ${isDone ? 'text-gray-900' : 'text-gray-300'}`}>
                        {step.label}
                        {isCurrent && <span className="ml-2 text-xs text-brand font-normal">● Now</span>}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDone ? 'text-gray-500' : 'text-gray-300'}`}>{step.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Delivery address */}
        <div className="card p-4">
          <h2 className="font-bold text-gray-900 text-sm mb-2">Delivering to</h2>
          <p className="text-gray-700 text-sm">{order.customer_name}</p>
          <p className="text-gray-500 text-sm">{order.delivery_address}, Kigali</p>
          <p className="text-gray-500 text-sm">{order.customer_phone}</p>
        </div>

        {/* Order items */}
        <div className="card p-4">
          <h2 className="font-bold text-gray-900 text-sm mb-3">Order summary</h2>
          {order.order_items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-gray-700">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
              <span className="font-medium">{(item.price * item.quantity).toLocaleString()} RWF</span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span><span>{order.subtotal.toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Delivery fee</span><span>{order.delivery_fee.toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span><span className="text-brand">{order.total.toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <span>Payment</span>
              <span className={order.payment_status === 'paid' ? 'text-green-600 font-medium' : ''}>
                {payLabel[order.payment_method]} · {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {isDelivered && (
          <Link href="/" className="btn-primary block text-center">Order again</Link>
        )}
      </div>
    </div>
  )
}
