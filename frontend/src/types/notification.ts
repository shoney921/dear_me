export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'diary_reminder'
  | 'persona_updated'
  | 'milestone_3'
  | 'milestone_5'
  | 'milestone_7'
  | 'persona_upgrade_available'
  | 'persona_upgraded'

export interface Notification {
  id: number
  user_id: number
  type: NotificationType
  title: string
  content?: string
  is_read: boolean
  related_id?: number
  created_at: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total_count: number
  unread_count: number
}

export interface NotificationUnreadCount {
  unread_count: number
}

export interface NotificationMarkAllReadResponse {
  updated_count: number
}
