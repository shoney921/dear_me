export interface User {
  id: number
  email: string
  username: string
  profile_image?: string
  is_active: boolean
  email_verified: boolean
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface RegisterResponse {
  id: number
  email: string
  username: string
  message: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}
