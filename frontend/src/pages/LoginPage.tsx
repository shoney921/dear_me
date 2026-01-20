import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'

interface LocationState {
  message?: string
}

// 백엔드 에러 메시지를 한국어로 변환
function getErrorMessage(error: any): string {
  // 네트워크 에러
  if (!error.response) {
    return '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'
  }

  const status = error.response?.status
  const detail = error.response?.data?.detail

  // 상태 코드별 처리
  switch (status) {
    case 401:
      return '이메일 또는 비밀번호가 올바르지 않습니다.'
    case 400:
      if (detail === 'Inactive user') {
        return '비활성화된 계정입니다. 관리자에게 문의해주세요.'
      }
      return detail || '잘못된 요청입니다.'
    case 422:
      // Validation error
      if (Array.isArray(detail)) {
        return detail.map((e: any) => e.msg).join(', ')
      }
      return '입력값이 올바르지 않습니다.'
    case 500:
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    default:
      return detail || '로그인에 실패했습니다. 다시 시도해주세요.'
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // 회원가입 성공 메시지 표시
  useEffect(() => {
    const state = location.state as LocationState
    if (state?.message) {
      setSuccessMessage(state.message)
      // state 초기화 (새로고침 시 메시지 사라지도록)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      try {
        // 토큰 저장 후 사용자 정보 조회
        localStorage.setItem('access_token', data.access_token)
        const user = await authService.getMe()
        setAuth(user, data.access_token)
        navigate('/', { replace: true })
      } catch (err) {
        setError('사용자 정보를 불러오는데 실패했습니다. 다시 로그인해주세요.')
        localStorage.removeItem('access_token')
      }
    },
    onError: (err: any) => {
      const message = getErrorMessage(err)
      setError(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    // 클라이언트 측 유효성 검사
    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.')
      return
    }

    loginMutation.mutate({ email, password })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">DearMe</CardTitle>
          <CardDescription>일기 기반 AI 페르소나 서비스</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {successMessage && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? '로그인 중...' : '로그인'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link to="/register" className="text-primary hover:underline">
                회원가입
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
