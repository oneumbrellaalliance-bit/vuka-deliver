'use client'
// app/(customer)/restaurant/[slug]/menu-client.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Merchant, MenuItem, MenuCategory } from '@/lib/supabase/types'

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

interface Props {
  merchant: Merchant
  categories: MenuCategory[]
  items: MenuItem[]
}

export default function MenuClient({ merchant, categories, items }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const router = useRouter()

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  const addItem = (item: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(c => c.menuItemId === item.id)
      if (exists) return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const removeItem = (menuItemId: string) => {
    setCart(prev => {
      const item = prev.find(c => c.menuItemId === menuItemId)
      if (!item) return prev
      if (item.quantity > 1) return prev.map(c => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c)
      return prev.filter(c => c.menuItemId !== menuItemId)
    })
  }

  const goToCheckout = () => {
    // Store cart in sessionStorage and navigate to checkout
    sessionStorage.setItem('cart', JSON.stringify({
      merchantId: merchant.id,
      merchantName: merchant.name,
      items: cart,
      deliveryFee: merchant.delivery_fee,
    }))
    router.push('/checkout')
  }

  // Group items by category
  const itemsByCategory: Record<string, MenuItem[]> = {}
  const uncategorized: MenuItem[] = []

  items.forEach(item => {
    if (item.category_id) {
      if (!itemsByCategory[item.category_id]) itemsByCategory[item.category_id] = []
      itemsByCategory[item.category_id].push(item)
    } else {
      uncategorized.push(item)
    }
  })

  return (
    <div className="min-h-screen bg-[#FBF7F2] pb-28">
      {/* Header */}
      <header className="bg-[#1A1A1A] px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-[#E8521A] text-xl font-bold">←</button>
        <div>
          <h1 className="text-white font-bold">{merchant.name}</h1>
          <p className="text-gray-400 text-xs">{merchant.category} · ⭐ {merchant.rating}</p>
        </div>
      </header>

      {/* Merchant info bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex gap-4 text-sm text-gray-500">
        <span>🕐 {merchant.delivery_time_min}–{merchant.delivery_time_max} min</span>
        <span>🛵 {merchant.delivery_fee.toLocaleString()} RWF</span>
        <span className={merchant.is_open ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
          {merchant.is_open ? '● Open' : '● Closed'}
        </span>
      </div>

      {/* Menu */}
      <div className="px-4 py-4">
        {/* Categorized items */}
        {categories.map(cat => {
          const catItems = itemsByCategory[cat.id] || []
          if (catItems.length === 0) return null
          return (
            <section key={cat.id} className="mb-6">
              <h2 className="font-bold text-gray-900 text-base mb-3">{cat.name}</h2>
              <div className="space-y-2">
                {catItems.map(item => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={cart.find(c => c.menuItemId === item.id)?.quantity || 0}
                    onAdd={() => addItem(item)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            </section>
          )
        })}

        {/* Uncategorized items */}
        {uncategorized.length > 0 && (
          <section className="mb-6">
            <h2 className="font-bold text-gray-900 text-base mb-3">Menu</h2>
            <div className="space-y-2">
              {uncategorized.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={cart.find(c => c.menuItemId === item.id)?.quantity || 0}
                  onAdd={() => addItem(item)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4">
          <button
            onClick={goToCheckout}
            className="w-full bg-[#1A1A1A] text-white font-bold py-4 px-6 rounded-2xl flex justify-between items-center shadow-xl"
          >
            <span className="bg-[#E8521A] text-white text-sm px-2.5 py-0.5 rounded-full font-bold">{cartCount}</span>
            <span>View Cart</span>
            <span>{cartSubtotal.toLocaleString()} RWF</span>
          </button>
        </div>
      )}
    </div>
  )
}

function MenuItemCard({
  item, quantity, onAdd, onRemove
}: {
  item: MenuItem
  quantity: number
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <div className="bg-white rounded-xl p-4 flex justify-between items-start shadow-sm">
      <div className="flex-1 pr-3">
        <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
        {item.description && (
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">{item.description}</p>
        )}
        <p className="text-[#E8521A] font-bold text-sm mt-2">{item.price.toLocaleString()} RWF</p>
      </div>

      <div className="flex items-center gap-2 mt-1 flex-shrink-0">
        {quantity > 0 ? (
          <>
            <button
              onClick={onRemove}
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center"
            >
              −
            </button>
            <span className="font-bold text-sm min-w-[16px] text-center">{quantity}</span>
          </>
        ) : null}
        <button
          onClick={onAdd}
          className="w-8 h-8 rounded-full bg-[#E8521A] text-white font-bold text-lg flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  )
}
