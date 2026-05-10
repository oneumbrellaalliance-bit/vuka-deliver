// app/(customer)/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Merchant } from '@/lib/supabase/types'

interface SearchParams {
  city?: string
  category?: string
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const city = searchParams.city || 'Kigali'
  const category = searchParams.category

  // Fetch merchants
  let query = supabase
    .from('merchants')
    .select('*')
    .eq('is_active', true)
    .eq('city', city)
    .order('rating', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data: merchants = [] } = await query

  // Fetch cities for filter
  const { data: cities = [] } = await supabase
    .from('cities')
    .select('name')
    .eq('active', true)
    .order('name')

  // Get unique categories from current city's merchants
  const { data: allMerchants = [] } = await supabase
    .from('merchants')
    .select('category')
    .eq('is_active', true)
    .eq('city', city)

  const categories = [...new Set(allMerchants.map(m => m.category))].sort()

  return (
    <main className="min-h-screen bg-[#FBF7F2]">
      {/* Header */}
      <header className="bg-[#1A1A1A] sticky top-0 z-50 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">🛵 Vuka Deliver</h1>
          <p className="text-gray-400 text-xs mt-0.5">Fast delivery in Rwanda</p>
        </div>
        <Link href="/login" className="text-sm text-[#E8521A] font-semibold">Sign In</Link>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#E8521A] to-[#C0392B] px-4 py-8">
        <h2 className="text-white text-2xl font-black leading-tight">
          Hungry?<br />
          <span className="font-normal text-lg opacity-80">Delivered in under 45 min.</span>
        </h2>

        {/* City selector */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {cities.map(c => (
            <a
              key={c.name}
              href={`/?city=${c.name}`}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                city === c.name
                  ? 'bg-white text-[#E8521A] border-white'
                  : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
              }`}
            >
              {c.name}
            </a>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide bg-white border-b border-gray-100">
        <a
          href={`/?city=${city}`}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            !category ? 'bg-[#E8521A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </a>
        {categories.map(cat => (
          <a
            key={cat}
            href={`/?city=${city}&category=${encodeURIComponent(cat)}`}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              category === cat ? 'bg-[#E8521A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </a>
        ))}
      </div>

      {/* Restaurant grid */}
      <section className="px-4 py-6">
        <h3 className="font-bold text-gray-900 mb-4">
          {merchants.length} restaurant{merchants.length !== 1 ? 's' : ''} in {city}
        </h3>

        {merchants.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="font-medium">No restaurants available right now</p>
            <p className="text-sm mt-1">Try a different city or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {merchants.map(merchant => (
              <RestaurantCard key={merchant.id} merchant={merchant} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function RestaurantCard({ merchant }: { merchant: Merchant }) {
  const href = merchant.is_open ? `/restaurant/${merchant.slug}` : '#'

  return (
    <Link
      href={href}
      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
        !merchant.is_open ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      {/* Cover / logo area */}
      <div className="h-20 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-4xl relative">
        {merchant.logo_url ? (
          <img src={merchant.logo_url} alt={merchant.name} className="w-full h-full object-cover" />
        ) : (
          <span>🍽️</span>
        )}
        {!merchant.is_open && (
          <div className="absolute top-2 right-2 bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            CLOSED
          </div>
        )}
      </div>

      <div className="p-3">
        <h4 className="font-bold text-gray-900 text-sm leading-tight">{merchant.name}</h4>
        <p className="text-gray-500 text-xs mt-0.5">{merchant.category}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-[#E8521A] font-bold text-xs">⭐ {merchant.rating}</span>
          <span className="text-gray-400 text-xs">{merchant.delivery_time_min}–{merchant.delivery_time_max}m</span>
        </div>
        <p className="text-gray-400 text-xs mt-1">{merchant.delivery_fee.toLocaleString()} RWF delivery</p>
      </div>
    </Link>
  )
}
