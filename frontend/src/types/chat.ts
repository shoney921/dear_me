export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: number;
  chat_id: number;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface PersonaChat {
  id: number;
  persona_id: number;
  requester_id: number;
  title: string | null;
  created_at: string;
  updated_at: string | null;
  persona_name: string | null;
  owner_name: string | null;
  last_message: string | null;
  message_count: number;
}

export interface PersonaChatDetail extends PersonaChat {
  messages: ChatMessage[];
}

export interface ChatListResponse {
  chats: PersonaChat[];
  total: number;
  page: number;
  limit: number;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export interface CreateChatRequest {
  title?: string;
}
