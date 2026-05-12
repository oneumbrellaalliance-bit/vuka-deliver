// app/(customer)/restaurant/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MenuClient from './menu-client'
import type { Merchant } from '@/lib/supabase/types'

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