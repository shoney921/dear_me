import api from '@/lib/api'
import type { Chat, ChatMessage, ChatWithMessages, ChatListResponse } from '@/types/chat'

export const chatService = {
  async getList(page = 1, perPage = 10): Promise<ChatListResponse> {
    const response = await api.get<ChatListResponse>(`/chats?page=${page}&per_page=${perPage}`)
    return response.data
  },

  async getById(id: number): Promise<ChatWithMessages> {
    const response = await api.get<ChatWithMessages>(`/chats/${id}`)
    return response.data
  },

  async create(personaId: number): Promise<Chat> {
    const response = await api.post<Chat>('/chats', { persona_id: personaId })
    return response.data
  },

  async sendMessage(chatId: number, content: string): Promise<ChatMessage> {
    const response = await api.post<ChatMessage>(`/chats/${chatId}/messages`, { content })
    return response.data
  },

  async getMessages(chatId: number, limit = 50): Promise<ChatMessage[]> {
    const response = await api.get<ChatMessage[]>(`/chats/${chatId}/messages?limit=${limit}`)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/chats/${id}`)
  },
}
