import api from '@/lib/api';
import type {
  PersonaChat,
  PersonaChatDetail,
  ChatListResponse,
  SendMessageRequest,
  SendMessageResponse,
  CreateChatRequest,
} from '@/types/chat';

export const chatService = {
  /**
   * 새 대화 시작
   */
  async createChat(
    personaId: number,
    request: CreateChatRequest = {}
  ): Promise<PersonaChat> {
    const response = await api.post<PersonaChat>(
      `/api/v1/chats/persona/${personaId}`,
      request
    );
    return response.data;
  },

  /**
   * 대화 목록 조회
   */
  async getChats(page = 1, limit = 20): Promise<ChatListResponse> {
    const response = await api.get<ChatListResponse>('/api/v1/chats', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * 대화 상세 조회
   */
  async getChat(chatId: number): Promise<PersonaChatDetail> {
    const response = await api.get<PersonaChatDetail>(`/api/v1/chats/${chatId}`);
    return response.data;
  },

  /**
   * 메시지 전송 (non-streaming)
   */
  async sendMessage(
    chatId: number,
    request: SendMessageRequest
  ): Promise<SendMessageResponse> {
    const response = await api.post<SendMessageResponse>(
      `/api/v1/chats/${chatId}/messages`,
      request
    );
    return response.data;
  },

  /**
   * 메시지 전송 (streaming) - SSE 스트림 반환
   */
  async sendMessageStream(
    chatId: number,
    content: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    const token = localStorage.getItem('access_token');

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/chats/${chatId}/messages/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      onError(error);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('Stream not available');
      return;
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            onComplete();
            return;
          }

          if (data.startsWith('[ERROR]')) {
            onError(data.slice(8));
            return;
          }

          onChunk(data);
        }
      }
    }

    onComplete();
  },

  /**
   * 대화 삭제
   */
  async deleteChat(chatId: number): Promise<void> {
    await api.delete(`/api/v1/chats/${chatId}`);
  },
};

export default chatService;
