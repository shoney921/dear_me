import api from '@/lib/api'
import type {
  Notification,
  NotificationListResponse,
  NotificationUnreadCount,
  NotificationMarkAllReadResponse,
} from '@/types/notification'

interface GetNotificationsParams {
  skip?: number
  limit?: number
  unread_only?: boolean
}

export const notificationService = {
  async getNotifications(params?: GetNotificationsParams): Promise<NotificationListResponse> {
    const response = await api.get<NotificationListResponse>('/notifications', { params })
    return response.data
  },

  async getUnreadCount(): Promise<NotificationUnreadCount> {
    const response = await api.get<NotificationUnreadCount>('/notifications/unread-count')
    return response.data
  },

  async getById(notificationId: number): Promise<Notification> {
    const response = await api.get<Notification>(`/notifications/${notificationId}`)
    return response.data
  },

  async markAsRead(notificationId: number): Promise<Notification> {
    const response = await api.patch<Notification>(`/notifications/${notificationId}/read`)
    return response.data
  },

  async markMultipleAsRead(notificationIds: number[]): Promise<NotificationMarkAllReadResponse> {
    const response = await api.post<NotificationMarkAllReadResponse>('/notifications/mark-read', {
      notification_ids: notificationIds,
    })
    return response.data
  },

  async markAllAsRead(): Promise<NotificationMarkAllReadResponse> {
    const response = await api.post<NotificationMarkAllReadResponse>('/notifications/mark-all-read')
    return response.data
  },

  async delete(notificationId: number): Promise<void> {
    await api.delete(`/notifications/${notificationId}`)
  },
}
