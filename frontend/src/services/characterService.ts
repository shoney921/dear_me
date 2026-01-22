import api from '@/lib/api'
import type {
  Character,
  CharacterWithHistory,
  CharacterGenerateRequest,
  CharacterStyleChangeRequest,
  CharacterGenerationStatus,
  CharacterStyleOption,
} from '@/types/character'

export const characterService = {
  async getMyCharacter(): Promise<Character> {
    const response = await api.get<Character>('/characters/me')
    return response.data
  },

  async getMyCharacterWithHistory(): Promise<CharacterWithHistory> {
    const response = await api.get<CharacterWithHistory>('/characters/me/history')
    return response.data
  },

  async getStatus(): Promise<CharacterGenerationStatus> {
    const response = await api.get<CharacterGenerationStatus>('/characters/status')
    return response.data
  },

  async getStyles(): Promise<CharacterStyleOption[]> {
    const response = await api.get<CharacterStyleOption[]>('/characters/styles')
    return response.data
  },

  async generate(data: CharacterGenerateRequest): Promise<Character> {
    const response = await api.post<Character>('/characters/generate', data)
    return response.data
  },

  async changeStyle(data: CharacterStyleChangeRequest): Promise<Character> {
    const response = await api.put<Character>('/characters/me/style', data)
    return response.data
  },

  async evolve(): Promise<Character> {
    const response = await api.post<Character>('/characters/me/evolve')
    return response.data
  },

  async getFriendCharacter(userId: number): Promise<Character> {
    const response = await api.get<Character>(`/characters/${userId}`)
    return response.data
  },
}
