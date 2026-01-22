export type SubscriptionPlan = 'free' | 'premium'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'

export interface Subscription {
  id: number
  user_id: number
  plan: SubscriptionPlan
  status: SubscriptionStatus
  started_at: string
  expires_at?: string
  cancelled_at?: string
  created_at: string
}

export interface SubscriptionStatusResponse {
  is_premium: boolean
  plan: SubscriptionPlan
  expires_at?: string
}

export interface PremiumPlanInfo {
  name: string
  price: number
  currency: string
  features: string[]
  period_days: number
}
