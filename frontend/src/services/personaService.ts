import api from '@/lib/api'
import type { Persona, PersonaStatus, PersonaGenerateResponse } from '@/types/persona'

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

  async getByUserId(userId: number): Promise<Persona> {
    const response = await api.get<Persona>(`/personas/${userId}`)
    return response.data
  },
}
