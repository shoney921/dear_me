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
  status: SubscriptionStatus
  expires_at?: string
  cancelled_at?: string
  days_remaining?: number
  is_in_grace_period: boolean
}

export interface UpgradeRequest {
  period_days: number
}

export interface PremiumPlanInfo {
  name: string
  price: number
  currency: string
  features: string[]
  period_days: number
}

export interface UsageDetail {
  used: number
  limit: number | null
  remaining: number | null
}

export interface FriendUsageDetail {
  count: number
  limit: number | null
}

export interface FeatureStatus {
  can_chat_with_friends: boolean
  advanced_stats: boolean
  chemistry_analysis: boolean
}

export interface UsageStatusResponse {
  is_premium: boolean
  plan: string
  daily_chat_messages: UsageDetail
  friends: FriendUsageDetail
  features: FeatureStatus
}
