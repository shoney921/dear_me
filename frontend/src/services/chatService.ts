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

  async createWithFriend(personaId: number): Promise<Chat> {
    // 백엔드에서 자동으로 is_own_persona를 감지함
    const response = await api.post<Chat>('/chats', { persona_id: personaId })
    return response.data
  },

  async sendMessage(chatId: number, content: string): Promise<ChatMessage> {
    const response = await api.post<ChatMessage>(`/chats/${chatId}/messages`, { content })
    return response.data
  },

  async sendMessageStream(
    chatId: number,
    content: string,
    onChunk: (chunk: string) => void,
    onUserMessage: (message: ChatMessage) => void,
    onDone: (message: ChatMessage) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const token = localStorage.getItem('access_token')
    const apiUrl = import.meta.env.VITE_API_URL || ''
    const response = await fetch(`${apiUrl}/api/v1/chats/${chatId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || 'Failed to send message')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body')
    }

    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // 마지막 라인은 불완전할 수 있으므로 버퍼에 보관
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'user_message') {
                onUserMessage(data.message)
              } else if (data.type === 'chunk') {
                onChunk(data.content)
              } else if (data.type === 'done') {
                onDone(data.message)
              } else if (data.type === 'error') {
                onError(data.content)
              }
            } catch (parseError) {
              console.warn('JSON parse error, skipping line:', line)
            }
          }
        }
      }

      // 스트림 종료 후 남은 버퍼 처리
      if (buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6))
          if (data.type === 'done') {
            onDone(data.message)
          }
        } catch {
          // 무시
        }
      }
    } catch (error) {
      console.error('Stream reading error:', error)
      onError(error instanceof Error ? error.message : 'Stream reading failed')
    } finally {
      reader.releaseLock()
    }
  },

  async getMessages(chatId: number, limit = 50): Promise<ChatMessage[]> {
    const response = await api.get<ChatMessage[]>(`/chats/${chatId}/messages?limit=${limit}`)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/chats/${id}`)
  },
}
