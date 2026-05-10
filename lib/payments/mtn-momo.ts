// lib/payments/mtn-momo.ts
// MTN Mobile Money Rwanda integration
// Docs: https://momodeveloper.mtn.com/

const BASE_URL = process.env.MTN_MOMO_BASE_URL!
const SUBSCRIPTION_KEY = process.env.MTN_MOMO_SUBSCRIPTION_KEY!
const API_USER = process.env.MTN_MOMO_API_USER!
const API_KEY = process.env.MTN_MOMO_API_KEY!
const TARGET_ENV = process.env.MTN_MOMO_TARGET_ENV || 'sandbox'

// Get OAuth token
async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${API_USER}:${API_KEY}`).toString('base64')

  const res = await fetch(`${BASE_URL}/collection/token/`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
    },
  })

  if (!res.ok) {
    throw new Error(`MTN token error: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return data.access_token
}

export interface MoMoPaymentRequest {
  amount: number          // RWF
  currency: string        // 'RWF'
  phone: string           // e.g. '250788123456' (no + prefix)
  externalId: string      // your order ID
  payerMessage: string    // shown to customer
  payeeNote: string       // internal note
}

export interface MoMoPaymentResult {
  referenceId: string
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
  reason?: string
}

// Initiate a payment request (push notification to customer's phone)
export async function requestToPay(params: MoMoPaymentRequest): Promise<string> {
  const token = await getAccessToken()
  const referenceId = crypto.randomUUID()

  const res = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': TARGET_ENV,
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount.toString(),
      currency: params.currency,
      externalId: params.externalId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: params.phone,
      },
      payerMessage: params.payerMessage,
      payeeNote: params.payeeNote,
    }),
  })

  if (res.status !== 202) {
    throw new Error(`MTN requestToPay failed: ${res.status} ${await res.text()}`)
  }

  return referenceId
}

// Check payment status (poll this after initiating)
export async function getPaymentStatus(referenceId: string): Promise<MoMoPaymentResult> {
  const token = await getAccessToken()

  const res = await fetch(`${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Target-Environment': TARGET_ENV,
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
    },
  })

  if (!res.ok) {
    throw new Error(`MTN status check failed: ${res.status}`)
  }

  const data = await res.json()
  return {
    referenceId,
    status: data.status,
    reason: data.reason,
  }
}

// Helper: normalize phone number to MTN format (no +, no spaces)
export function normalizeMoMoPhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^0/, '250')
}
