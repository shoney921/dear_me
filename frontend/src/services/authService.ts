import api from '@/lib/api'
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RegisterResponse,
  ResendVerificationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailResponse,
} from '@/types/auth'

export const authService = {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', data)
    return response.data
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login/json', data)
    return response.data
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/users/me')
    return response.data
  },

  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const response = await api.get<VerifyEmailResponse>(`/auth/verify-email?token=${token}`)
    return response.data
  },

  async resendVerification(data: ResendVerificationRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/resend-verification', data)
    return response.data
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/forgot-password', data)
    return response.data
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/reset-password', data)
    return response.data
  },
}
