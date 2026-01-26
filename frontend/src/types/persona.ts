export interface PersonaCustomization {
  speaking_style_tone?: 'formal' | 'casual' | 'cute'
  speaking_style_emoji?: boolean
  personality_traits_override?: string[]
  custom_greeting?: string
}

export type PersonaLevel = 'temporary' | 'basic' | 'complete'

export interface Persona {
  id: number
  user_id: number
  name: string
  personality: string
  traits?: string[]
  speaking_style?: string
  avatar_url?: string
  is_public: boolean
  customization?: PersonaCustomization
  level: PersonaLevel
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

export interface PersonaUpdateRequest {
  name?: string
  is_public?: boolean
}

export interface PersonaCustomizeRequest {
  speaking_style_tone?: 'formal' | 'casual' | 'cute'
  speaking_style_emoji?: boolean
  personality_traits_override?: string[]
  custom_greeting?: string
}

export interface PersonaCustomizeResponse {
  id: number
  customization: PersonaCustomization
  updated_at: string
}
