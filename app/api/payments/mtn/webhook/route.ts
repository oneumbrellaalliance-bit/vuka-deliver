// app/api/payments/mtn/webhook/route.ts
// MTN MoMo sends a callback here when payment status changes.
// Configure this URL in MTN Developer Portal as your callback URL.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifyOrderStatusChange } from '@/lib/notifications/africas-talking'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('MTN MoMo webhook received:', body)

    const supabase = createAdminClient()

    // MTN sends: { referenceId, status, reason, financialTransactionId, ... }
    const { referenceId, status } = body

    if (!referenceId) {
      return NextResponse.json({ error: 'No referenceId' }, { status: 400 })
    }

    // Find the payment transaction
    const { data: txn } = await supabase
      .from('payment_transactions')
      .select('*, orders(*)')
      .eq('provider_reference', referenceId)
      .single()

    if (!txn || !txn.order_id) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (status === 'SUCCESSFUL') {
      // Mark payment as paid
      await supabase
        .from('payment_transactions')
        .update({ status: 'success', raw_response: body })
        .eq('id', txn.id)

      // Confirm the order
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_reference: body.financialTransactionId || referenceId,
        })
        .eq('id', txn.order_id)

      // Notify customer
      const order = txn.orders as any
      if (order?.customer_phone) {
        await notifyOrderStatusChange({
          customerPhone: order.customer_phone,
          customerName: order.customer_name,
          orderNumber: order.order_number,
          status: 'confirmed',
        }).catch(console.error)
      }
    } else if (status === 'FAILED') {
      await supabase
        .from('payment_transactions')
        .update({ status: 'failed', raw_response: body })
        .eq('id', txn.id)

      await supabase
        .from('orders')
        .update({ payment_status: 'failed', status: 'cancelled' })
        .eq('id', txn.order_id)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('MTN webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

// Also expose a polling endpoint — use this as fallback if webhook isn't fired
// GET /api/payments/mtn/webhook?orderId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')

  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('payment_status, status, order_number')
    .eq('id', orderId)
    .single()

  return NextResponse.json(order || { error: 'Not found' })
}
