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
      if (!isAuthPage) {
        localStorage.removeItem('access_token')
        // TanStack Query 캐시 초기화
        queryClient.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
