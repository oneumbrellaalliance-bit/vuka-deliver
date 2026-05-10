// app/api/payments/airtel/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifyOrderStatusChange } from '@/lib/notifications/africas-talking'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Airtel Money webhook:', body)

    const supabase = createAdminClient()

    // Airtel sends: { transaction: { id, status_code, message, airtel_money_id } }
    const txnId = body?.transaction?.id || body?.data?.transaction?.id
    const statusCode = body?.transaction?.status_code || body?.data?.transaction?.status

    if (!txnId) {
      return NextResponse.json({ error: 'No transaction id' }, { status: 400 })
    }

    const { data: txn } = await supabase
      .from('payment_transactions')
      .select('*, orders(*)')
      .eq('provider_reference', txnId)
      .single()

    if (!txn || !txn.order_id) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // TS = Transaction Successful
    if (statusCode === 'TS' || statusCode === 'SUCCESS') {
      await supabase
        .from('payment_transactions')
        .update({ status: 'success', raw_response: body })
        .eq('id', txn.id)

      await supabase
        .from('orders')
        .update({ payment_status: 'paid', status: 'confirmed' })
        .eq('id', txn.order_id)

      const order = txn.orders as any
      if (order?.customer_phone) {
        await notifyOrderStatusChange({
          customerPhone: order.customer_phone,
          customerName:  order.customer_name,
          orderNumber:   order.order_number,
          status:        'confirmed',
        }).catch(console.error)
      }
    } else {
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
    console.error('Airtel webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
