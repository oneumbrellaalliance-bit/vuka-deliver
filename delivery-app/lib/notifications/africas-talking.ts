// lib/notifications/africas-talking.ts
// Africa's Talking — SMS + WhatsApp for Rwanda
// Docs: https://developers.africastalking.com/

import type { OrderStatus } from '../supabase/types'

const API_KEY = process.env.AT_API_KEY!
const USERNAME = process.env.AT_USERNAME!
const SENDER_ID = process.env.AT_SENDER_ID || 'VukaDeliv'

// ─── SMS ─────────────────────────────────────────────────────

export async function sendSMS(to: string | string[], message: string): Promise<void> {
  const recipients = Array.isArray(to) ? to.join(',') : to

  const res = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      'apiKey': API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      username: USERNAME,
      to: recipients,
      message,
      from: SENDER_ID,
    }),
  })

  if (!res.ok) {
    console.error('SMS send failed:', await res.text())
    // Don't throw — notifications should not block the order flow
  }
}

// ─── ORDER NOTIFICATION TEMPLATES ────────────────────────────

export function getOrderSMS(params: {
  status: OrderStatus
  orderNumber: string
  customerName: string
  merchantName?: string
  total?: number
}): string {
  const { status, orderNumber, customerName, merchantName, total } = params

  const messages: Partial<Record<OrderStatus, string>> = {
    confirmed: `Mwaramutse ${customerName}! 🛵 Order ${orderNumber} confirmed at ${merchantName}. We'll notify you when it's on the way. - Vuka Deliver`,
    preparing: `Your order ${orderNumber} is now being prepared at ${merchantName}. Hang tight! - Vuka Deliver`,
    in_transit: `Your order ${orderNumber} is on its way! 🛵 Your rider has picked it up and is heading to you. - Vuka Deliver`,
    delivered: `Order ${orderNumber} delivered! Enjoy your meal 🍽️. Rate your experience at vuka.rw - Vuka Deliver`,
    cancelled: `Order ${orderNumber} has been cancelled. If you paid online, your refund will arrive in 24-48 hours. Sorry for the inconvenience. - Vuka Deliver`,
  }

  return messages[status] || `Update on your order ${orderNumber}: ${status}. - Vuka Deliver`
}

export function getMerchantNewOrderSMS(params: {
  orderNumber: string
  customerName: string
  itemCount: number
  total: number
}): string {
  return `🔔 New order ${params.orderNumber} from ${params.customerName} — ${params.itemCount} item(s) — ${params.total.toLocaleString()} RWF. Open your dashboard to accept. - Vuka Deliver`
}

export function getRiderAssignedSMS(params: {
  orderNumber: string
  merchantName: string
  address: string
}): string {
  return `New delivery assigned: ${params.orderNumber} from ${params.merchantName} → ${params.address}. Open app for details. - Vuka Deliver`
}

// ─── SEND ORDER STATUS NOTIFICATION ──────────────────────────

export async function notifyOrderStatusChange(params: {
  customerPhone: string
  customerName: string
  orderNumber: string
  status: OrderStatus
  merchantName?: string
  total?: number
}): Promise<void> {
  const message = getOrderSMS(params)
  await sendSMS(params.customerPhone, message)
}

export async function notifyMerchantNewOrder(params: {
  merchantPhone: string
  orderNumber: string
  customerName: string
  itemCount: number
  total: number
}): Promise<void> {
  const message = getMerchantNewOrderSMS(params)
  await sendSMS(params.merchantPhone, message)
}

export async function notifyRiderAssigned(params: {
  riderPhone: string
  orderNumber: string
  merchantName: string
  address: string
}): Promise<void> {
  const message = getRiderAssignedSMS(params)
  await sendSMS(params.riderPhone, message)
}
