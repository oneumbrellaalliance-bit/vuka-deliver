'use client'
// app/checkout/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Cart } from '@/lib/supabase/types'

const KIGALI_DISTRICTS = [
  'Gasabo', 'Kicukiro', 'Nyarugenge',
]

export default function CheckoutPage() {
  const router  = useRouter()
  const [cart, setCart]             = useState<Cart | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  // Form state
  const [name, setName]             = useState('')
  const [phone, setPhone]           = useState('')
  const [address, setAddress]       = useState('')
  const [district, setDistrict]     = useState('Gasabo')
  const [payMethod, setPayMethod]   = useState<'mtn_momo'|'airtel_money'|'cash'>('mtn_momo')
  const [notes, setNotes]           = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('cart')
    if (!raw) { router.push('/'); return }
    setCart(JSON.parse(raw))
  }, [router])

  if (!cart) return null

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const total    = subtotal + cart.deliveryFee

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId:      cart.merchantId,
          items:           cart.items,
          deliveryAddress: address,
          deliveryCity:    'Kigali',
          customerName:    name,
          customerPhone:   phone,
          paymentMethod:   payMethod,
          notes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to place order')
        setLoading(false)
        return
      }

      sessionStorage.removeItem('cart')
      router.push(`/order/${data.orderId}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/cart" className="text-brand text-xl font-bold">←</Link>
        <h1 className="text-white font-bold">Checkout</h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-4">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Order summary */}
        <div className="card p-4">
          <h2 className="font-bold text-gray-900 mb-3">Order from {cart.merchantName}</h2>
          {cart.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-gray-700">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
              <span className="font-medium">{(item.price * item.quantity).toLocaleString()} RWF</span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{subtotal.toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Delivery fee</span><span>{cart.deliveryFee.toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span><span className="text-brand">{total.toLocaleString()} RWF</span>
            </div>
          </div>
        </div>

        {/* Delivery details */}
        <div className="card p-4 space-y-3">
          <h2 className="font-bold text-gray-900">Delivery details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Full name" className="input" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="0788 123 456" className="input" required />
            <p className="text-xs text-gray-400 mt-1">We'll call this number if we can't find you</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <select value={district} onChange={e => setDistrict(e.target.value)} className="input bg-white">
              {KIGALI_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street address</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              placeholder="e.g. KG 14 Ave, near Kacyiru roundabout"
              className="input" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery notes <span className="text-gray-400">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any instructions for the rider..."
              rows={2} className="input resize-none" />
          </div>
        </div>

        {/* Payment method */}
        <div className="card p-4">
          <h2 className="font-bold text-gray-900 mb-3">Payment method</h2>
          <div className="space-y-2">
            {([
              { value: 'mtn_momo',    label: 'MTN Mobile Money',  sub: 'You\'ll get a push notification on your phone' },
              { value: 'airtel_money',label: 'Airtel Money',       sub: 'You\'ll get a push notification on your phone' },
              { value: 'cash',        label: 'Cash on delivery',   sub: 'Pay the rider when your order arrives' },
            ] as const).map(opt => (
              <label key={opt.value}
                className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  payMethod === opt.value ? 'border-brand bg-orange-50' : 'border-gray-200 bg-white'}`}>
                <input type="radio" name="payment" value={opt.value}
                  checked={payMethod === opt.value}
                  onChange={() => setPayMethod(opt.value)}
                  className="mt-0.5 accent-brand" />
                <div>
                  <div className="font-medium text-sm text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.sub}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Place order */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading
              ? 'Placing order...'
              : `Place Order — ${total.toLocaleString()} RWF`}
          </button>
        </div>
      </form>
    </div>
  )
}
