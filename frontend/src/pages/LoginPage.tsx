import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/error'

interface LocationState {
  message?: string
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
    onError: (err) => {
      setError(getApiErrorMessage(err))
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
