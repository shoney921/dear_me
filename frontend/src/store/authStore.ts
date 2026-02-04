import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import { queryClient } from '@/lib/queryClient'
import type { User } from '@/types/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isHydrated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setHydrated: () => void
  syncToken: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (user, token) => {
        // localStorage와 Zustand 상태 동기화
        localStorage.setItem('access_token', token)
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        // 모든 인증 관련 데이터 제거
        localStorage.removeItem('access_token')
        localStorage.removeItem('auth-storage')
        // TanStack Query 캐시 전체 초기화 (이전 사용자 데이터 제거)
        queryClient.clear()
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }))
      },

      setHydrated: () => {
        set({ isHydrated: true })
      },

      // localStorage와 Zustand 상태 동기화 (배포 후 불일치 해결)
      syncToken: () => {
        const state = get()
        const localStorageToken = localStorage.getItem('access_token')

        // Zustand에는 토큰이 있는데 localStorage에 없으면 동기화
        if (state.token && !localStorageToken) {
          localStorage.setItem('access_token', state.token)
        }
        // localStorage에는 있는데 Zustand에 없으면 제거 (불일치 상태)
        else if (!state.token && localStorageToken) {
          localStorage.removeItem('access_token')
        }
        // 둘 다 있지만 값이 다르면 localStorage 우선 (최신 값)
        else if (state.token && localStorageToken && state.token !== localStorageToken) {
          set({ token: localStorageToken })
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Hydration 후 토큰 동기화
          state.syncToken()
          state.setHydrated()

          // 토큰 유효성 검증 (간단한 체크)
          if (state.token && state.isAuthenticated) {
            try {
              // JWT 토큰 형식 확인 (Bearer 토큰은 3개 부분으로 구성)
              const parts = state.token.split('.')
              if (parts.length !== 3) {
                console.warn('[Auth] 잘못된 토큰 형식 - 로그아웃 처리')
                state.logout()
              }
            } catch (error) {
              console.error('[Auth] 토큰 검증 실패:', error)
              state.logout()
            }
          }
        }
      },
    }
  )
)
