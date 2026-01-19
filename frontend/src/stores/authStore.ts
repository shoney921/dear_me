import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'
import type { User, AuthState } from '@/types/auth'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        const formData = new URLSearchParams()
        formData.append('username', email)
        formData.append('password', password)

        const response = await api.post('/auth/login', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })

        const { access_token } = response.data
        localStorage.setItem('token', access_token)

        set({ token: access_token, isAuthenticated: true })

        await get().checkAuth()
      },

      register: async (email: string, username: string, password: string) => {
        await api.post('/auth/register', {
          email,
          username,
          password,
        })
      },

      logout: () => {
        localStorage.removeItem('token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      setUser: (user: User) => {
        set({ user })
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token')

        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }

        try {
          const response = await api.get('/auth/me')
          set({
            user: response.data,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch {
          localStorage.removeItem('token')
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
      }),
    }
  )
)
