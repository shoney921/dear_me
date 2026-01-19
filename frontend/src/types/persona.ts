export interface Persona {
  id: number;
  user_id: number;
  name: string | null;
  personality: string | null;
  traits: string[];
  speaking_style: string | null;
  summary: string | null;
  interests: string[];
  is_public: boolean;
  last_updated: string | null;
  created_at: string;
}

export interface PersonaPublic {
  id: number;
  user_id: number;
  name: string | null;
  personality: string | null;
  traits: string[];
  interests: string[];
}

export interface PersonaStatus {
  can_generate: boolean;
  diary_count: number;
  required_count: number;
  has_persona: boolean;
  message: string;
}

export interface PersonaGenerateRequest {
  force_regenerate?: boolean;
}

export interface PersonaUpdateRequest {
  name?: string;
  is_public?: boolean;
}
