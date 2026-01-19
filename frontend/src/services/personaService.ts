import api from '@/lib/api';
import type {
  Persona,
  PersonaPublic,
  PersonaStatus,
  PersonaGenerateRequest,
  PersonaUpdateRequest,
} from '@/types/persona';

export const personaService = {
  /**
   * 페르소나 생성 가능 상태 확인
   */
  async getStatus(): Promise<PersonaStatus> {
    const response = await api.get<PersonaStatus>('/api/v1/personas/status');
    return response.data;
  },

  /**
   * 페르소나 생성/재생성
   */
  async generate(request: PersonaGenerateRequest = {}): Promise<Persona> {
    const response = await api.post<Persona>('/api/v1/personas/generate', request);
    return response.data;
  },

  /**
   * 내 페르소나 조회
   */
  async getMyPersona(): Promise<Persona> {
    const response = await api.get<Persona>('/api/v1/personas/me');
    return response.data;
  },

  /**
   * 내 페르소나 설정 수정
   */
  async updateMyPersona(request: PersonaUpdateRequest): Promise<Persona> {
    const response = await api.put<Persona>('/api/v1/personas/me', request);
    return response.data;
  },

  /**
   * 다른 사용자의 페르소나 조회
   */
  async getUserPersona(userId: number): Promise<PersonaPublic> {
    const response = await api.get<PersonaPublic>(`/api/v1/personas/${userId}`);
    return response.data;
  },
};

export default personaService;
