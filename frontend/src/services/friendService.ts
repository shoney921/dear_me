import api from '@/lib/api'
import type { User } from '@/types/auth'
import type { Friendship, FriendshipWithUser, FriendListResponse, FriendWithPersona, FriendRecommendationResponse } from '@/types/friend'

export const friendService = {
  async getList(): Promise<FriendListResponse> {
    const response = await api.get<FriendListResponse>('/friends')
    return response.data
  },

  async sendRequest(addresseeId: number): Promise<Friendship> {
    const response = await api.post<Friendship>('/friends/request', {
      addressee_id: addresseeId,
    })
    return response.data
  },

  async getReceivedRequests(): Promise<FriendshipWithUser[]> {
    const response = await api.get<FriendshipWithUser[]>('/friends/requests/received')
    return response.data
  },

  async getSentRequests(): Promise<FriendshipWithUser[]> {
    const response = await api.get<FriendshipWithUser[]>('/friends/requests/sent')
    return response.data
  },

  async respondToRequest(friendshipId: number, status: 'accepted' | 'rejected'): Promise<Friendship> {
    const response = await api.patch<Friendship>(`/friends/requests/${friendshipId}`, { status })
    return response.data
  },

  async removeFriend(friendId: number): Promise<void> {
    await api.delete(`/friends/${friendId}`)
  },

  async searchUsers(username: string): Promise<User[]> {
    const response = await api.get<User[]>(`/users/search/${username}`)
    return response.data
  },

  async getListWithPersona(): Promise<FriendWithPersona[]> {
    const response = await api.get<FriendWithPersona[]>('/friends/with-persona')
    return response.data
  },

  async getRecommendations(): Promise<FriendRecommendationResponse> {
    const response = await api.get<FriendRecommendationResponse>('/friends/recommendations')
    return response.data
  },
}
