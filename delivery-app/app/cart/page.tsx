'use client'
// app/cart/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Cart, CartItem } from '@/lib/supabase/types'

export default function CartPage() {
  const [cart, setCart]   = useState<Cart | null>(null)
  const router            = useRouter()

  useEffect(() => {
    const raw = sessionStorage.getItem('cart')
    if (raw) setCart(JSON.parse(raw))
  }, [])

  const save = (updated: Cart) => {
    setCart(updated)
    sessionStorage.setItem('cart', JSON.stringify(updated))
  }

  const updateQty = (index: number, delta: number) => {
    if (!cart) return
    const items = [...cart.items]
    items[index].quantity = Math.max(0, items[index].quantity + delta)
    const filtered = items.filter(i => i.quantity > 0)
    if (filtered.length === 0) {
      sessionStorage.removeItem('cart')
      router.push('/')
      return
    }
    save({ ...cart, items: filtered })
  }

  const clearCart = () => {
    sessionStorage.removeItem('cart')
    router.push('/')
  }

  if (!cart || cart.items.length === 0) return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-3">🛒</div>
      <h2 className="font-bold text-gray-900 mb-2">Your cart is empty</h2>
      <Link href="/" className="text-brand text-sm font-medium">Browse restaurants</Link>
    </div>
  )

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const total    = subtotal + cart.deliveryFee

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href={`/restaurant/${cart.merchantId}`} className="text-brand text-xl font-bold">←</Link>
          <h1 className="text-white font-bold">Your Cart</h1>
        </div>
        <button onClick={clearCart} className="text-xs text-gray-400 bg-transparent border-none cursor-pointer">
          Clear all
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-36">
        {/* Restaurant name */}
        <p className="text-xs text-gray-400 uppercase tracking-wide px-1">From {cart.merchantName}</p>

        {/* Items */}
        {cart.items.map((item, i) => (
          <div key={i} className="card p-4 flex justify-between items-center">
            <div className="flex-1 mr-3">
              <p className="font-medium text-gray-900 text-sm">{item.name}</p>
              {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
              <p className="text-brand font-bold text-sm mt-1">{(item.price * item.quantity).toLocaleString()} RWF</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(i, -1)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg font-medium text-gray-700 cursor-pointer border-none">
                −
              </button>
              <span className="font-bold text-gray-900 min-w-[18px] text-center">{item.quantity}</span>
              <button
                onClick={() => updateQty(i, 1)}
                className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-lg font-medium text-white cursor-pointer border-none">
                +
              </button>
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="card p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal ({cart.items.reduce((s,i) => s+i.quantity, 0)} items)</span>
            <span>{subtotal.toLocaleString()} RWF</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Delivery fee</span>
            <span>{cart.deliveryFee.toLocaleString()} RWF</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span className="text-brand">{total.toLocaleString()} RWF</span>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <button
          onClick={() => router.push('/checkout')}
          className="w-full bg-brand text-white font-semibold rounded-xl py-3.5 text-sm cursor-pointer border-none flex justify-between px-5">
          <span>Checkout</span>
          <span>{total.toLocaleString()} RWF</span>
        </button>
      </div>
    </div>
  )
}
