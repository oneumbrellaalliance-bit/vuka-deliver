// app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifyOrderStatusChange } from '@/lib/notifications/africas-talking'
import type { OrderStatus } from '@/lib/supabase/types'

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['preparing', 'cancelled'],
  preparing:  ['ready', 'cancelled'],
  ready:      ['in_transit'],
  in_transit: ['delivered'],
  delivered:  [],
  cancelled:  [],
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status, note }: { status: OrderStatus; note?: string } = await req.json()
  const orderId = params.id

  const supabase = createClient()
  const adminSupabase = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Get current order
  const { data: order, error: orderErr } = await adminSupabase
    .from('orders')
    .select('*, merchants(name, owner_id, phone)')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Authorization check
  const isAdmin = profile?.role === 'admin'
  const isMerchantOwner = (order.merchants as any)?.owner_id === user.id
  const isRider = profile?.role === 'rider' && order.rider_id === user.id

  if (!isAdmin && !isMerchantOwner && !isRider) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Validate status transition
  const allowedNext = VALID_TRANSITIONS[order.status as OrderStatus] || []
  if (!allowedNext.includes(status)) {
    return NextResponse.json({
      error: `Cannot transition from '${order.status}' to '${status}'`,
      allowedTransitions: allowedNext,
    }, { status: 400 })
  }

  // Apply update
  const updateData: Record<string, unknown> = { status }
  if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  }

  const { error: updateErr } = await adminSupabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (updateErr) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  // Log status change with note
  if (note) {
    await adminSupabase.from('order_status_history').insert({
      order_id: orderId,
      status,
      note,
      changed_by: user.id,
    })
  }

  // Notify customer
  await notifyOrderStatusChange({
    customerPhone: order.customer_phone,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    status,
    merchantName: (order.merchants as any)?.name,
  }).catch(console.error)

  return NextResponse.json({ success: true, newStatus: status })
}
