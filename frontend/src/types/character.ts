export type CharacterStyle = 'watercolor' | 'anime' | 'pixel' | '3d' | 'realistic' | 'cartoon'

export interface Character {
  id: number
  user_id: number
  name?: string
  image_url?: string
  thumbnail_url?: string
  style: CharacterStyle
  generation_count: number
  created_at: string
  updated_at: string
}

export interface CharacterHistory {
  id: number
  image_url: string
  style: CharacterStyle
  diary_count_at_generation?: number
  created_at: string
}

export interface CharacterWithHistory extends Character {
  history: CharacterHistory[]
}

export interface CharacterGenerateRequest {
  style?: CharacterStyle
  name?: string
}

export interface CharacterStyleChangeRequest {
  style: CharacterStyle
}

export interface CharacterGenerationStatus {
  can_generate: boolean
  has_character: boolean
  diary_count: number
  required_diary_count: number
  can_evolve: boolean
  next_evolution_at?: number
}

export interface CharacterStyleOption {
  value: CharacterStyle
  name: string
  is_premium: boolean
  available: boolean
}
