export interface Persona {
  id: number
  user_id: number
  name: string
  personality: string
  traits?: string[]
  speaking_style?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface PersonaStatus {
  diary_count: number
  required_count: number
  can_generate: boolean
  has_persona: boolean
}

export interface PersonaGenerateResponse {
  persona: Persona
  message: string
}
