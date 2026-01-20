import type { User } from './auth'

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected'

export interface Friendship {
  id: number
  requester_id: number
  addressee_id: number
  status: FriendshipStatus
  created_at: string
  updated_at: string
}

export interface FriendshipWithUser extends Friendship {
  requester?: User
  addressee?: User
}

export interface FriendListResponse {
  friends: User[]
  total: number
}
