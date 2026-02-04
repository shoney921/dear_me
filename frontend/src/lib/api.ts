import axios from 'axios'

import { queryClient } from './queryClient'

// 프로덕션: 빈 문자열 = 상대 경로 사용 (/api/v1)
// 개발: localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 401 에러로 인한 로그아웃 처리 중복 방지 플래그
let isLoggingOut = false

// Request interceptor - 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 에러 처리 - 로그인/회원가입 페이지에서는 리다이렉트하지 않음
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      const isAuthPage = currentPath === '/login' || currentPath === '/register'

      // 인증 페이지가 아닌 곳에서 401 에러 발생 시에만 리다이렉트
      // 이미 로그아웃 처리 중이면 중복 실행 방지
      if (!isAuthPage && !isLoggingOut) {
        isLoggingOut = true

        console.log('[Auth] 401 Unauthorized - 로그아웃 처리')

        // 토큰 제거
        localStorage.removeItem('access_token')
        localStorage.removeItem('auth-storage')

        // TanStack Query 캐시 초기화
        queryClient.clear()

        // 로그인 페이지로 리다이렉트
        window.location.href = '/login'

        // 리다이렉트 후 플래그 리셋 (다음 세션을 위해)
        setTimeout(() => {
          isLoggingOut = false
        }, 1000)
      }
    }
    return Promise.reject(error)
  }
)

export default api
