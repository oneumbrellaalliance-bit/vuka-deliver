// lib/supabase/types.ts
// Auto-generate the real version with: npx supabase gen types typescript --local

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          role: 'customer' | 'merchant' | 'rider' | 'admin'
          city: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      cities: {
        Row: {
          id: number
          name: string
          country: string
          active: boolean
          delivery_fee_base: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cities']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['cities']['Insert']>
      }
      merchants: {
        Row: {
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
          cover_url: string | null
          rating: number
          rating_count: number
          delivery_fee: number
          delivery_time_min: number
          delivery_time_max: number
          min_order: number
          is_open: boolean
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['merchants']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['merchants']['Insert']>
      }
      menu_categories: {
        Row: {
          id: string
          merchant_id: string
          name: string
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['menu_categories']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['menu_categories']['Insert']>
      }
      menu_items: {
        Row: {
          id: string
          merchant_id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_available: boolean
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['menu_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['menu_items']['Insert']>
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string | null
          merchant_id: string | null
          rider_id: string | null
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled'
          subtotal: number
          delivery_fee: number
          discount: number
          total: number
          delivery_address: string
          delivery_city: string
          delivery_lat: number | null
          delivery_lng: number | null
          customer_phone: string
          customer_name: string
          payment_method: 'mtn_momo' | 'airtel_money' | 'cash' | 'card'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_reference: string | null
          notes: string | null
          estimated_delivery_at: string | null
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string | null
          name: string
          price: number
          quantity: number
          subtotal: number
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          status: string
          note: string | null
          changed_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_status_history']['Row'], 'id' | 'created_at'>
        Update: never
      }
      rider_profiles: {
        Row: {
          id: string
          city: string
          vehicle_type: 'motorcycle' | 'bicycle' | 'car'
          is_online: boolean
          current_lat: number | null
          current_lng: number | null
          rating: number
          total_deliveries: number
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['rider_profiles']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['rider_profiles']['Insert']>
      }
      payment_transactions: {
        Row: {
          id: string
          order_id: string | null
          provider: 'mtn_momo' | 'airtel_money' | 'cash' | 'card'
          provider_reference: string | null
          amount: number
          currency: string
          status: 'pending' | 'success' | 'failed'
          raw_response: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payment_transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payment_transactions']['Insert']>
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Merchant = Database['public']['Tables']['merchants']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type MenuCategory = Database['public']['Tables']['menu_categories']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type RiderProfile = Database['public']['Tables']['rider_profiles']['Row']

export type OrderStatus = Order['status']
export type PaymentMethod = Order['payment_method']
export type UserRole = Profile['role']

// Cart types (client-side only, not in DB)
export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  notes?: string
}

export interface Cart {
  merchantId: string
  merchantName: string
  items: CartItem[]
  deliveryFee: number
}
