export interface Chat {
  id: number
  user_id: number
  persona_id: number
  is_own_persona: boolean
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: number
  chat_id: number
  content: string
  is_user: boolean
  created_at: string
}

export interface ChatWithMessages extends Chat {
  messages: ChatMessage[]
}

export interface ChatListResponse {
  items: Chat[]
  total: number
}
