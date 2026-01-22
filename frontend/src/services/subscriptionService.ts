import api from '@/lib/api'
import type {
  Subscription,
  SubscriptionStatusResponse,
  PremiumPlanInfo,
} from '@/types/subscription'

export const subscriptionService = {
  async getMySubscription(): Promise<Subscription> {
    const response = await api.get<Subscription>('/subscriptions/me')
    return response.data
  },

  async getStatus(): Promise<SubscriptionStatusResponse> {
    const response = await api.get<SubscriptionStatusResponse>('/subscriptions/status')
    return response.data
  },

  async getPlans(): Promise<PremiumPlanInfo[]> {
    const response = await api.get<PremiumPlanInfo[]>('/subscriptions/plans')
    return response.data
  },

  async upgrade(): Promise<Subscription> {
    const response = await api.post<Subscription>('/subscriptions/upgrade')
    return response.data
  },

  async cancel(): Promise<Subscription> {
    const response = await api.post<Subscription>('/subscriptions/cancel')
    return response.data
  },
}
