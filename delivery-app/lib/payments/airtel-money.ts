// lib/payments/airtel-money.ts
// Airtel Money Rwanda integration
// Docs: https://developers.airtel.africa/

const BASE_URL = process.env.AIRTEL_BASE_URL!
const CLIENT_ID = process.env.AIRTEL_CLIENT_ID!
const CLIENT_SECRET = process.env.AIRTEL_CLIENT_SECRET!
const ENV = process.env.AIRTEL_ENV || 'staging'

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  })

  if (!res.ok) {
    throw new Error(`Airtel token error: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return data.access_token
}

export interface AirtelPaymentRequest {
  amount: number
  currency: string    // 'RWF'
  phone: string       // e.g. '0730123456' or '250730123456'
  reference: string   // your order ID
  country: string     // 'RW'
}

// Initiate Airtel Money collection
export async function collectPayment(params: AirtelPaymentRequest): Promise<string> {
  const token = await getAccessToken()
  const transactionId = `VD-${Date.now()}`

  const res = await fetch(`${BASE_URL}/merchant/v1/payments/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Country': params.country,
      'X-Currency': params.currency,
    },
    body: JSON.stringify({
      reference: params.reference,
      subscriber: {
        country: params.country,
        currency: params.currency,
        msisdn: normalizeAirtelPhone(params.phone),
      },
      transaction: {
        amount: params.amount,
        country: params.country,
        currency: params.currency,
        id: transactionId,
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Airtel payment failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return data.data?.transaction?.id || transactionId
}

// Check Airtel transaction status
export async function getTransactionStatus(transactionId: string, country = 'RW', currency = 'RWF') {
  const token = await getAccessToken()

  const res = await fetch(`${BASE_URL}/standard/v1/payments/${transactionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Country': country,
      'X-Currency': currency,
    },
  })

  if (!res.ok) {
    throw new Error(`Airtel status check failed: ${res.status}`)
  }

  const data = await res.json()
  const status = data.data?.transaction?.status

  return {
    transactionId,
    status: status === 'TS' ? 'SUCCESSFUL' : status === 'TF' ? 'FAILED' : 'PENDING',
    airtelStatus: status,
  }
}

export function normalizeAirtelPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('250')) return digits.slice(3)
  if (digits.startsWith('0')) return digits.slice(1)
  return digits
}
