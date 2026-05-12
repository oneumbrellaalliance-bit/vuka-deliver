// app/(customer)/restaurant/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MenuClient from './menu-client'

interface Merchant {
  id: string
  owner_id: string | null
  name: string
  slug: string
  description: string | null
  category: string
  city: string
  address: string | null
  phone: string | null
  logo_url: string | null
  rating: number
  delivery_time_min: number
  delivery_time_max: number
  delivery_fee: number
  is_open: boolean
  is_active: boolean
  created_at: string
}

export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single() as { data: Merchant | null }

  if (!merchant) notFound()

  const { data: categories = [] } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('merchant_id', merchant.id)
    .order('sort_order')

  const { data: items = [] } = await supabase
    .from('menu_items')
    .select('*')
    .eq('merchant_id', merchant.id)
    .eq('is_available', true)
    .order('sort_order')

  return (
    <MenuClient
      merchant={merchant}
      categories={categories}
      items={items}
    />
  )
}