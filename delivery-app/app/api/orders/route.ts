// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requestToPay, normalizeMoMoPhone } from '@/lib/payments/mtn-momo'
import { collectPayment } from '@/lib/payments/airtel-money'
import { notifyMerchantNewOrder } from '@/lib/notifications/africas-talking'
import type { CartItem } from '@/lib/supabase/types'

interface CreateOrderBody {
  merchantId: string
  items: CartItem[]
  deliveryAddress: string
  deliveryCity: string
  deliveryLat?: number
  deliveryLng?: number
  customerName: string
  customerPhone: string
  paymentMethod: 'mtn_momo' | 'airtel_money' | 'cash'
  notes?: string
  customerId?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderBody = await req.json()
    const supabase = createAdminClient()

    // ── Validate merchant exists and is open ──────────────────
    const { data: merchant, error: mErr } = await supabase
      .from('merchants')
      .select('id, name, delivery_fee, phone, is_open, is_active')
      .eq('id', body.merchantId)
      .single()

    if (mErr || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    if (!merchant.is_open || !merchant.is_active) {
      return NextResponse.json({ error: 'Merchant is currently closed' }, { status: 400 })
    }

    // ── Calculate totals ──────────────────────────────────────
    const subtotal = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const deliveryFee = merchant.delivery_fee
    const total = subtotal + deliveryFee

    // ── Create order record ───────────────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_id: body.customerId || null,
        merchant_id: body.merchantId,
        status: 'pending',
        subtotal,
        delivery_fee: deliveryFee,
        discount: 0,
        total,
        delivery_address: body.deliveryAddress,
        delivery_city: body.deliveryCity,
        delivery_lat: body.deliveryLat || null,
        delivery_lng: body.deliveryLng || null,
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        payment_method: body.paymentMethod,
        payment_status: 'pending',
        notes: body.notes || null,
        estimated_delivery_at: new Date(Date.now() + 40 * 60 * 1000).toISOString(), // +40min
      })
      .select()
      .single()

    if (orderErr || !order) {
      console.error('Order creation failed:', orderErr)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // ── Insert order items ────────────────────────────────────
    const orderItems = body.items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      notes: item.notes || null,
    }))

    await supabase.from('order_items').insert(orderItems)

    // ── Trigger payment ───────────────────────────────────────
    let paymentReference: string | null = null

    if (body.paymentMethod === 'mtn_momo') {
      try {
        const phone = normalizeMoMoPhone(body.customerPhone)
        paymentReference = await requestToPay({
          amount: total,
          currency: 'RWF',
          phone,
          externalId: order.id,
          payerMessage: `Order ${order.order_number} - ${merchant.name}`,
          payeeNote: `Vuka Deliver order ${order.order_number}`,
        })

        // Log payment transaction
        await supabase.from('payment_transactions').insert({
          order_id: order.id,
          provider: 'mtn_momo',
          provider_reference: paymentReference,
          amount: total,
          currency: 'RWF',
          status: 'pending',
        })
      } catch (payErr) {
        console.error('MTN MoMo initiation failed:', payErr)
        // Don't block the order — customer can retry payment
      }
    } else if (body.paymentMethod === 'airtel_money') {
      try {
        paymentReference = await collectPayment({
          amount: total,
          currency: 'RWF',
          phone: body.customerPhone,
          reference: order.order_number,
          country: 'RW',
        })

        await supabase.from('payment_transactions').insert({
          order_id: order.id,
          provider: 'airtel_money',
          provider_reference: paymentReference,
          amount: total,
          currency: 'RWF',
          status: 'pending',
        })
      } catch (payErr) {
        console.error('Airtel Money initiation failed:', payErr)
      }
    } else if (body.paymentMethod === 'cash') {
      // Cash orders are immediately confirmed
      await supabase
        .from('orders')
        .update({ status: 'confirmed', payment_status: 'pending' })
        .eq('id', order.id)

      await supabase.from('payment_transactions').insert({
        order_id: order.id,
        provider: 'cash',
        amount: total,
        currency: 'RWF',
        status: 'pending',
      })
    }

    // Update payment reference if we got one
    if (paymentReference) {
      await supabase
        .from('orders')
        .update({ payment_reference: paymentReference })
        .eq('id', order.id)
    }

    // ── Notify merchant ───────────────────────────────────────
    if (merchant.phone) {
      await notifyMerchantNewOrder({
        merchantPhone: merchant.phone,
        orderNumber: order.order_number,
        customerName: body.customerName,
        itemCount: body.items.reduce((s, i) => s + i.quantity, 0),
        total,
      }).catch(err => console.error('Merchant SMS failed:', err))
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      total,
      paymentReference,
      status: order.status,
    })
  } catch (err) {
    console.error('Order API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/orders?id=xxx — fetch order with items + status history
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*),
      order_status_history (status, created_at),
      merchants (name, phone, address)
    `)
    .eq('id', id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json(order)
}
