import api from '@/lib/api'
import type {
  Persona,
  PersonaStatus,
  PersonaGenerateResponse,
  PersonaUpdateRequest,
  PersonaCustomizeRequest,
  PersonaCustomizeResponse,
} from '@/types/persona'

export const personaService = {
  async getMyPersona(): Promise<Persona> {
    const response = await api.get<Persona>('/personas/me')
    return response.data
  },

  async getStatus(): Promise<PersonaStatus> {
    const response = await api.get<PersonaStatus>('/personas/status')
    return response.data
  },

  async generate(): Promise<PersonaGenerateResponse> {
    const response = await api.post<PersonaGenerateResponse>('/personas/generate')
    return response.data
  },

  async regenerate(): Promise<PersonaGenerateResponse> {
    const response = await api.post<PersonaGenerateResponse>('/personas/regenerate')
    return response.data
  },

  async update(data: PersonaUpdateRequest): Promise<Persona> {
    const response = await api.put<Persona>('/personas/me', data)
    return response.data
  },

  async customize(data: PersonaCustomizeRequest): Promise<PersonaCustomizeResponse> {
    const response = await api.put<PersonaCustomizeResponse>('/personas/me/customize', data)
    return response.data
  },

  async getByUserId(userId: number): Promise<Persona> {
    const response = await api.get<Persona>(`/personas/${userId}`)
    return response.data
  },

  async getFriendPersona(friendId: number): Promise<Persona> {
    const response = await api.get<Persona>(`/personas/${friendId}`)
    return response.data
  },
}
